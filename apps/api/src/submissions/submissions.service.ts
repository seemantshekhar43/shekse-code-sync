import { Injectable } from "@nestjs/common";
import { prisma } from "@scs/db";
import { buildSubmissionFiles, slugify } from "@scs/github";
import type { CaptureSubmission, SubmissionSummary } from "@scs/types";
import { QueueService } from "../queue/queue.service.js";
import { toSummary } from "./submissions.mapper.js";

@Injectable()
export class SubmissionsService {
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
   * Capture flow: write the metadata row + (TODO) commit to GitHub, then
   * enqueue AI enrichment and return immediately (fire-and-forget).
   */
  async capture(userId: string, input: CaptureSubmission): Promise<{ id: string }> {
    const slug = slugify(input.title);

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

    // TODO: commit question.md + solution.<ext> + meta.json to the user's repo
    // via @scs/github once the GitHub App installation is wired to the user.
    void buildSubmissionFiles;

    await this.queue.enqueueEnrichment({ submissionId: submission.id });

    return { id: submission.id };
  }
}
