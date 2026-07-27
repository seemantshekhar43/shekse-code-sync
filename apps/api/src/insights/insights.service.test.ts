import { prisma } from "@scs/db";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InsightsService } from "./insights.service.js";

vi.mock("@scs/db", () => ({
  prisma: {
    submission: { findMany: vi.fn() },
  },
}));

function makeService() {
  return new InsightsService();
}

describe("InsightsService.summary", () => {
  beforeEach(() => vi.clearAllMocks());

  it("aggregates pattern coverage, difficulty mix, streaks, and the calendar for the given year", async () => {
    const now = new Date("2026-07-28T12:00:00.000Z");
    vi.useFakeTimers().setSystemTime(now);

    vi.mocked(prisma.submission.findMany).mockResolvedValue([
      {
        id: "s1",
        title: "Two Sum",
        level: "easy",
        solvedAt: new Date("2026-07-28T09:00:00.000Z"), // today
        analysis: { pattern: "hash-map" },
      },
      {
        id: "s2",
        title: "Valid Parentheses",
        level: "easy",
        solvedAt: new Date("2026-07-27T09:00:00.000Z"), // yesterday, continues streak
        analysis: { pattern: "stack" },
      },
      {
        id: "s3",
        title: "Merge Intervals",
        level: "medium",
        solvedAt: new Date("2026-07-27T10:00:00.000Z"), // same day as s2
        analysis: { pattern: "hash-map" },
      },
      {
        id: "s4",
        title: "Course Schedule",
        level: "hard",
        solvedAt: new Date("2026-01-05T00:00:00.000Z"), // isolated day, earlier in the year
        analysis: null,
      },
    ] as never);

    const result = await makeService().summary("user_1", 2026);

    expect(result.today).toBe(1);
    expect(result.difficultyMix).toEqual({ easy: 2, medium: 1, hard: 1 });
    expect(result.patternCoverage).toEqual([
      { pattern: "hash-map", count: 2, lastSolvedAt: new Date("2026-07-28T09:00:00.000Z") },
      { pattern: "stack", count: 1, lastSolvedAt: new Date("2026-07-27T09:00:00.000Z") },
    ]);
    expect(result.patternsTouched).toBe(2);
    expect(result.weakestPatterns).toEqual(["stack"]);
    expect(result.activeDays).toBe(3);
    expect(result.calendarTotal).toBe(4);
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);

    const day = result.days.find((d) => d.date === "2026-07-27");
    expect(day?.count).toBe(2);
    expect(day?.submissions.map((s) => s.id).sort()).toEqual(["s2", "s3"]);

    vi.useRealTimers();
  });

  it("returns zeroed streaks when there are no submissions", async () => {
    vi.mocked(prisma.submission.findMany).mockResolvedValue([] as never);

    const result = await makeService().summary("user_1", 2026);

    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
    expect(result.patternCoverage).toEqual([]);
    expect(result.days).toEqual([]);
  });
});
