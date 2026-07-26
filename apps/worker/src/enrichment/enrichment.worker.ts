import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { aiProvider } from "@scs/ai";
import { prisma } from "@scs/db";
import { parseRepo, readSubmissionFiles } from "@scs/github";
import { type Job, Worker } from "bullmq";

interface EnrichmentJob {
  submissionId: string;
}

/** Owns the BullMQ worker that runs AI enrichment for captured submissions. */
@Injectable()
export class EnrichmentWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EnrichmentWorker.name);
  private worker?: Worker<EnrichmentJob>;

  onModuleInit(): void {
    const url = new URL(process.env.REDIS_URL ?? "redis://localhost:6379");
    this.worker = new Worker<EnrichmentJob>("enrichment", (job) => this.process(job), {
      connection: {
        host: url.hostname,
        port: Number(url.port) || 6379,
        password: url.password || undefined,
      },
    });
    // eslint-disable-next-line no-console
    console.log("Enrichment worker started");
  }

  /**
   * BullMQ handler: run enrichment, and on the final attempt mark the
   * submission `failed` before rethrowing so BullMQ records the failure and
   * schedules retries per the producer's backoff policy.
   */
  private async process(job: Job<EnrichmentJob>): Promise<void> {
    try {
      await this.enrich(job.data.submissionId);
    } catch (err) {
      const maxAttempts = job.opts.attempts ?? 1;
      const attempt = job.attemptsMade + 1;
      this.logger.error(
        `Enrichment failed for ${job.data.submissionId} (attempt ${attempt}/${maxAttempts}): ${
          (err as Error).message
        }`,
      );
      if (attempt >= maxAttempts) {
        await this.markFailed(job.data.submissionId);
      }
      throw err;
    }
  }

  /**
   * Read the problem's statement + solution back from GitHub (the source of
   * truth), run AI analysis, and persist it. Missing GitHub wiring is a
   * permanent failure, so it marks `failed` without retrying.
   */
  async enrich(submissionId: string): Promise<void> {
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { user: true },
    });
    if (!submission) {
      this.logger.warn(`Submission ${submissionId} not found; skipping enrichment.`);
      return;
    }

    const { githubInstallationId, githubRepo } = submission.user;
    if (!githubInstallationId || !githubRepo) {
      this.logger.warn(
        `No GitHub source wired for submission ${submissionId}; marking enrichment failed.`,
      );
      await this.markFailed(submissionId);
      return;
    }

    const { owner, repo } = parseRepo(githubRepo);
    const { statement, code } = await readSubmissionFiles({
      installationId: Number(githubInstallationId),
      owner,
      repo,
      slug: submission.slug,
      language: submission.language,
    });

    const analysis = await aiProvider.analyze({
      title: submission.title,
      statement,
      language: submission.language,
      code,
    });

    await prisma.analysis.upsert({
      where: { submissionId },
      create: { submissionId, ...analysis },
      update: analysis,
    });
    await prisma.submission.update({
      where: { id: submissionId },
      data: { enrichment: "done" },
    });
  }

  private async markFailed(submissionId: string): Promise<void> {
    await prisma.submission
      .update({ where: { id: submissionId }, data: { enrichment: "failed" } })
      .catch((err: unknown) =>
        this.logger.error(`Could not mark ${submissionId} failed: ${(err as Error).message}`),
      );
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
