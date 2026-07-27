import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@scs/db";
import type { RevisionAttemptResult, RevisionQueueItem } from "@scs/types";
import { scheduleNext } from "./srs.js";

async function markedSubmissions(userId: string) {
  return prisma.submission.findMany({
    where: { userId, isMarkedForRevision: true },
    include: {
      analysis: { select: { pattern: true } },
      revisions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
}

function toQueueItem(s: Awaited<ReturnType<typeof markedSubmissions>>[number]): RevisionQueueItem {
  const latest = s.revisions[0];
  return {
    submissionId: s.id,
    title: s.title,
    questionLink: s.questionLink,
    pattern: s.analysis?.pattern ?? null,
    level: s.level,
    dueAt: latest?.dueAt ?? null,
    ease: latest?.ease ?? null,
    intervalDays: latest?.intervalDays ?? null,
  };
}

function sortByDueAt(items: RevisionQueueItem[]): RevisionQueueItem[] {
  return [...items].sort((a, b) => {
    if (a.dueAt === null) return b.dueAt === null ? 0 : -1;
    if (b.dueAt === null) return 1;
    return a.dueAt.getTime() - b.dueAt.getTime();
  });
}

@Injectable()
export class RevisionsService {
  /**
   * A user's marked submissions that are currently due: never rated, or their
   * latest rated attempt's `dueAt` has passed. Sorted soonest-due first, with
   * never-rated items (immediately due) surfacing before any dated ones.
   */
  async queue(userId: string): Promise<RevisionQueueItem[]> {
    const now = new Date();
    const submissions = await markedSubmissions(userId);
    const items = submissions.map(toQueueItem).filter((item) => item.dueAt === null || item.dueAt <= now);
    return sortByDueAt(items);
  }

  /**
   * Every marked submission regardless of due date, for the full Revision
   * screen (which segments client-side into due now / due soon / upcoming).
   */
  async fullQueue(userId: string): Promise<RevisionQueueItem[]> {
    const submissions = await markedSubmissions(userId);
    return sortByDueAt(submissions.map(toQueueItem));
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
