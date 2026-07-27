import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { prisma } from "@scs/db";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RevisionsService } from "./revisions.service.js";

vi.mock("@scs/db", () => ({
  prisma: {
    submission: { findMany: vi.fn(), findFirst: vi.fn() },
    revisionAttempt: { create: vi.fn() },
  },
}));

function makeService() {
  return new RevisionsService();
}

describe("RevisionsService.queue", () => {
  beforeEach(() => vi.clearAllMocks());

  it("includes never-rated submissions and excludes ones not yet due", async () => {
    const now = new Date("2026-07-27T12:00:00.000Z");
    vi.useFakeTimers().setSystemTime(now);

    vi.mocked(prisma.submission.findMany).mockResolvedValue([
      {
        id: "never-rated",
        title: "Two Sum",
        level: "easy",
        analysis: { pattern: "hash-map" },
        revisions: [],
      },
      {
        id: "overdue",
        title: "LRU Cache",
        level: "medium",
        analysis: null,
        revisions: [{ dueAt: new Date("2026-07-26T00:00:00.000Z") }],
      },
      {
        id: "not-due-yet",
        title: "Word Ladder",
        level: "hard",
        analysis: { pattern: "bfs" },
        revisions: [{ dueAt: new Date("2026-08-01T00:00:00.000Z") }],
      },
    ] as never);

    const result = await makeService().queue("user_1");

    expect(result.map((r) => r.submissionId)).toEqual(["never-rated", "overdue"]);
    expect(result.map((r) => r.pattern)).toEqual(["hash-map", null]);

    vi.useRealTimers();
  });
});

describe("RevisionsService.recordAttempt", () => {
  beforeEach(() => vi.clearAllMocks());

  it("throws NotFoundException when the submission doesn't belong to the user", async () => {
    vi.mocked(prisma.submission.findFirst).mockResolvedValue(null);

    await expect(makeService().recordAttempt("user_1", "sub_1", 4)).rejects.toThrow(
      NotFoundException,
    );
  });

  it("throws ForbiddenException when the submission isn't marked for revision", async () => {
    vi.mocked(prisma.submission.findFirst).mockResolvedValue({
      isMarkedForRevision: false,
      revisions: [],
    } as never);

    await expect(makeService().recordAttempt("user_1", "sub_1", 4)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it("schedules from the latest attempt and persists a new RevisionAttempt row", async () => {
    vi.mocked(prisma.submission.findFirst).mockResolvedValue({
      isMarkedForRevision: true,
      revisions: [{ ease: 2.5, intervalDays: 6, dueAt: new Date("2026-07-20") }],
    } as never);
    vi.mocked(prisma.revisionAttempt.create).mockResolvedValue({} as never);

    const result = await makeService().recordAttempt("user_1", "sub_1", 4);

    expect(result.intervalDays).toBe(15); // round(6 * 2.5)
    expect(prisma.revisionAttempt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ submissionId: "sub_1", selfRating: 4 }),
      }),
    );
  });
});
