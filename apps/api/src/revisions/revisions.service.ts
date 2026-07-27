import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@scs/db";
import type { RevisionAttemptResult, RevisionQueueItem } from "@scs/types";
import { scheduleNext } from "./srs.js";

@Injectable()
export class RevisionsService {
  /**
   * A user's marked submissions that are currently due: never rated, or their
   * latest rated attempt's `dueAt` has passed. Sorted soonest-due first, with
   * never-rated items (immediately due) surfacing before any dated ones.
   */
  async queue(userId: string): Promise<RevisionQueueItem[]> {
    const now = new Date();
    const submissions = await prisma.submission.findMany({
      where: { userId, isMarkedForRevision: true },
      include: {
        analysis: { select: { pattern: true } },
        revisions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    return submissions
      .map((s) => ({
        submissionId: s.id,
        title: s.title,
        pattern: s.analysis?.pattern ?? null,
        level: s.level,
        dueAt: s.revisions[0]?.dueAt ?? null,
      }))
      .filter((item) => item.dueAt === null || item.dueAt <= now)
      .sort((a, b) => {
        if (a.dueAt === null) return b.dueAt === null ? 0 : -1;
        if (b.dueAt === null) return 1;
        return a.dueAt.getTime() - b.dueAt.getTime();
      });
  }

  /** Records a self-rated attempt and schedules the next `dueAt` via SM-2. */
  async recordAttempt(
    userId: string,
    submissionId: string,
    selfRating: number,
  ): Promise<RevisionAttemptResult> {
    const submission = await prisma.submission.findFirst({
      where: { id: submissionId, userId },
      include: { revisions: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    if (!submission) {
      throw new NotFoundException("Submission not found");
    }
    if (!submission.isMarkedForRevision) {
      throw new ForbiddenException("Submission isn't marked for revision");
    }

    const latest = submission.revisions[0];
    const { ease, intervalDays, dueAt } = scheduleNext(
      latest ? { ease: latest.ease, intervalDays: latest.intervalDays } : null,
      selfRating,
      new Date(),
    );

    await prisma.revisionAttempt.create({
      data: { submissionId, selfRating, ease, intervalDays, dueAt },
    });

    return { ease, intervalDays, dueAt };
  }
}
