import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { aiProvider } from "@scs/ai";
import { prisma } from "@scs/db";
import { type Job, Worker } from "bullmq";

interface EnrichmentJob {
  submissionId: string;
}

/** Owns the BullMQ worker that runs AI enrichment for captured submissions. */
@Injectable()
export class EnrichmentWorker implements OnModuleInit, OnModuleDestroy {
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

  private async process(job: Job<EnrichmentJob>): Promise<void> {
    const submission = await prisma.submission.findUnique({
      where: { id: job.data.submissionId },
    });
    if (!submission) return;

    // NOTE (scaffold): statement + code would be read back from GitHub. Stubbed.
    const analysis = await aiProvider.analyze({
      title: submission.title,
      statement: "",
      language: submission.language,
      code: "",
    });

    await prisma.analysis.upsert({
      where: { submissionId: submission.id },
      create: { submissionId: submission.id, ...analysis },
      update: analysis,
    });
    await prisma.submission.update({
      where: { id: submission.id },
      data: { enrichment: "done" },
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.worker?.close();
  }
}
