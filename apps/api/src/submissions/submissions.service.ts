import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { prisma } from "@scs/db";
import {
  buildSubmissionFiles,
  commitFiles,
  parseRepo,
  readSubmissionFiles,
  slugify,
} from "@scs/github";
import type { CaptureSubmission, SubmissionQuery, SubmissionSummary } from "@scs/types";
import { QueueService } from "../queue/queue.service.js";
import { toSummary } from "./submissions.mapper.js";

@Injectable()
export class SubmissionsService {
  private readonly logger = new Logger(SubmissionsService.name);

  constructor(private readonly queue: QueueService) {}

  /**
   * List a user's submissions for the dashboard/Problems screen. With no query,
   * returns everything newest-first (what the overview relies on for its stats).
   */
  async list(userId: string, query?: SubmissionQuery): Promise<SubmissionSummary[]> {
    const rows = await prisma.submission.findMany({
      where: {
        userId,
        ...(query?.platform ? { platform: query.platform } : {}),
        ...(query?.level ? { level: query.level } : {}),
        ...(query?.language ? { language: query.language } : {}),
        ...(query?.synced !== undefined
          ? { repoPath: query.synced ? { not: null } : null }
          : {}),
        ...(query?.pattern ? { analysis: { pattern: query.pattern } } : {}),
        ...(query?.q ? { title: { contains: query.q, mode: "insensitive" } } : {}),
      },
      orderBy: query ? { [query.sortBy]: query.sortOrder } : { solvedAt: "desc" },
      include: { analysis: { select: { pattern: true } } },
    });
    return rows.map(toSummary);
  }

  /**
   * Fetch a submission's captured code, read back from GitHub (source of
   * truth), plus the AI-derived complexity for that same submitted solution
   * (null while enrichment is still pending/failed).
   */
  async getCode(
    userId: string,
    submissionId: string,
  ): Promise<{
    language: string;
    code: string;
    analysis: { timeComplexity: string; spaceComplexity: string } | null;
  }> {
    const [submission, user] = await Promise.all([
      prisma.submission.findFirst({
        where: { id: submissionId, userId },
        select: {
          slug: true,
          language: true,
          repoPath: true,
          analysis: { select: { timeComplexity: true, spaceComplexity: true } },
        },
      }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { githubInstallationId: true, githubRepo: true },
      }),
    ]);
    if (!submission || !submission.repoPath || !user?.githubInstallationId || !user.githubRepo) {
      throw new NotFoundException("Submission code isn't available (not synced to GitHub yet).");
    }
    const { owner, repo } = parseRepo(user.githubRepo);
    const { code } = await readSubmissionFiles({
      installationId: Number(user.githubInstallationId),
      owner,
      repo,
      slug: submission.slug,
      language: submission.language,
    });
    return { language: submission.language, code, analysis: submission.analysis };
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
    const synced = await this.syncToGithub(user, slug, input);

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
        repoPath: synced ? slug : null,
        solvedAt: input.solvedAt,
      },
      update: {
        status: input.status,
        runtimeMs: input.runtimeMs,
        memoryKb: input.memoryKb,
        attemptCount: { increment: 1 },
        solvedAt: input.solvedAt,
        ...(synced ? { repoPath: slug } : {}),
      },
    });

    await this.queue.enqueueEnrichment({ submissionId: submission.id });

    return { id: submission.id };
  }

  /** Commit question.md + solution.<ext> + meta.json to the user's repo. Returns whether it actually synced. */
  private async syncToGithub(
    user: { githubInstallationId: string | null; githubRepo: string | null },
    slug: string,
    input: CaptureSubmission,
  ): Promise<boolean> {
    if (!user.githubInstallationId || !user.githubRepo) {
      this.logger.warn(
        `No GitHub installation wired for this user; skipping repo write for "${slug}".`,
      );
      return false;
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
    return true;
  }

  /**
   * Resolve the capturing user's GitHub sync target. The row is created at web
   * login and its `githubInstallationId` / `githubRepo` are set when the user
   * installs the GitHub App (see the web `/github/installed` flow). If either is
   * unset the caller skips the repo write and indexes only.
   */
  private async ensureUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { githubInstallationId: true, githubRepo: true },
    });
    return user ?? { githubInstallationId: null, githubRepo: null };
  }
}
