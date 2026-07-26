import { Injectable, Logger } from "@nestjs/common";
import { prisma } from "@scs/db";
import { buildSubmissionFiles, commitFiles, parseRepo, slugify } from "@scs/github";
import type { CaptureSubmission, SubmissionSummary } from "@scs/types";
import { QueueService } from "../queue/queue.service.js";
import { toSummary } from "./submissions.mapper.js";

@Injectable()
export class SubmissionsService {
  private readonly logger = new Logger(SubmissionsService.name);

  constructor(private readonly queue: QueueService) {}

  /** List a user's submissions for the dashboard, newest first. */
  async list(userId: string): Promise<SubmissionSummary[]> {
    const rows = await prisma.submission.findMany({
      where: { userId },
      orderBy: { solvedAt: "desc" },
      include: { analysis: { select: { pattern: true } } },
    });
    return rows.map(toSummary);
  }

  /**
   * Capture flow: commit the problem to the user's GitHub repo (source of
   * truth), write the metadata index row, then enqueue AI enrichment and return
   * immediately (enrichment is fire-and-forget).
   */
  async capture(userId: string, input: CaptureSubmission): Promise<{ id: string }> {
    const slug = slugify(input.title);
    const user = await this.ensureUser(userId);

    // GitHub is the source of truth: commit before indexing so a failed push
    // surfaces to the caller instead of leaving an orphan DB row. When the user
    // has no installation wired yet (local/demo), skip and index only.
    await this.syncToGithub(user, slug, input);

    const submission = await prisma.submission.upsert({
      where: { userId_slug: { userId, slug } },
      create: {
        userId,
        title: input.title,
        slug,
        questionLink: input.questionLink,
        platform: input.platform,
        level: input.level,
        language: input.solution.language,
        status: input.status,
        tags: input.tags,
        topics: input.topics,
        companies: input.companies,
        runtimeMs: input.runtimeMs,
        memoryKb: input.memoryKb,
        repoPath: slug,
        solvedAt: input.solvedAt,
      },
      update: {
        status: input.status,
        runtimeMs: input.runtimeMs,
        memoryKb: input.memoryKb,
        attemptCount: { increment: 1 },
        solvedAt: input.solvedAt,
      },
    });

    await this.queue.enqueueEnrichment({ submissionId: submission.id });

    return { id: submission.id };
  }

  /** Commit question.md + solution.<ext> + meta.json to the user's repo. */
  private async syncToGithub(
    user: { githubInstallationId: string | null; githubRepo: string | null },
    slug: string,
    input: CaptureSubmission,
  ): Promise<void> {
    if (!user.githubInstallationId || !user.githubRepo) {
      this.logger.warn(
        `No GitHub installation wired for this user; skipping repo write for "${slug}".`,
      );
      return;
    }
    const { owner, repo } = parseRepo(user.githubRepo);
    await commitFiles({
      installationId: Number(user.githubInstallationId),
      owner,
      repo,
      slug,
      files: buildSubmissionFiles(input),
      message: `Add ${input.title}`,
    });
  }

  /**
   * Resolve the capturing user, ensuring a row exists.
   *
   * MVP bridge: real users arrive via auth (#16); until then the extension posts
   * as a fixed demo user, whose GitHub install/repo are seeded from env so the
   * write path can run end-to-end.
   */
  private async ensureUser(userId: string) {
    const demoInstallationId = process.env.DEMO_GITHUB_INSTALLATION_ID;
    const demoRepo = process.env.DEMO_GITHUB_REPO;
    const update: { githubInstallationId?: string; githubRepo?: string } = {};
    if (demoInstallationId) update.githubInstallationId = demoInstallationId;
    if (demoRepo) update.githubRepo = demoRepo;
    return prisma.user.upsert({
      where: { id: userId },
      update,
      create: {
        id: userId,
        email: `${userId}@shekse.local`,
        githubInstallationId: demoInstallationId || null,
        githubRepo: demoRepo || null,
      },
      select: { githubInstallationId: true, githubRepo: true },
    });
  }
}
