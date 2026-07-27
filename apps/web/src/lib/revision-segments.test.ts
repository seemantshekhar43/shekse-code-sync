import { describe, expect, it } from "vitest";
import type { RevisionQueueItem } from "@scs/types";
import { averageEase, segmentQueue } from "./revision-segments.js";

const now = new Date("2026-07-28T00:00:00.000Z");

function item(overrides: Partial<RevisionQueueItem>): RevisionQueueItem {
  return {
    submissionId: "s1",
    title: "Two Sum",
    questionLink: "https://leetcode.com/problems/two-sum/",
    pattern: null,
    level: "easy",
    dueAt: null,
    ease: null,
    intervalDays: null,
    ...overrides,
  };
}

describe("segmentQueue", () => {
  it("buckets never-rated and overdue items into due now, items within 3 days into due soon, and the rest into upcoming", () => {
    const neverRated = item({ submissionId: "never-rated", dueAt: null });
    const overdue = item({ submissionId: "overdue", dueAt: new Date("2026-07-26T00:00:00.000Z") });
    const dueSoon = item({ submissionId: "due-soon", dueAt: new Date("2026-07-30T00:00:00.000Z") });
    const upcoming = item({ submissionId: "upcoming", dueAt: new Date("2026-08-10T00:00:00.000Z") });

    const result = segmentQueue([neverRated, overdue, dueSoon, upcoming], now);

    expect(result.dueNow.map((i) => i.submissionId)).toEqual(["never-rated", "overdue"]);
    expect(result.dueSoon.map((i) => i.submissionId)).toEqual(["due-soon"]);
    expect(result.upcoming.map((i) => i.submissionId)).toEqual(["upcoming"]);
  });

  it("treats a due date exactly 3 days out as due soon, not upcoming", () => {
    const exactlyThreeDays = item({ submissionId: "boundary", dueAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) });

    const result = segmentQueue([exactlyThreeDays], now);

    expect(result.dueSoon.map((i) => i.submissionId)).toEqual(["boundary"]);
    expect(result.upcoming).toEqual([]);
  });
});

describe("averageEase", () => {
  it("returns null when no items have been rated", () => {
    expect(averageEase([item({ ease: null }), item({ ease: null })])).toBeNull();
  });

  it("averages only rated items, rounded to 1 decimal", () => {
    const items = [item({ ease: 2.5 }), item({ ease: 2.6 }), item({ ease: null })];
    expect(averageEase(items)).toBe(2.6);
  });
});
