import type { InsightsSummary } from "@scs/types";
import { describe, expect, it } from "vitest";
import { generateObservations } from "./insights-observations";

function baseSummary(overrides: Partial<InsightsSummary> = {}): InsightsSummary {
  return {
    today: 0,
    thisWeek: 0,
    lastWeek: 0,
    thisMonth: 0,
    lastMonth: 0,
    patternsTouched: 0,
    patternCoverage: [],
    weakestPatterns: [],
    difficultyMix: { easy: 0, medium: 0, hard: 0 },
    currentStreak: 0,
    longestStreak: 0,
    calendarYear: 2026,
    calendarTotal: 0,
    activeDays: 0,
    days: [],
    ...overrides,
  };
}

describe("generateObservations", () => {
  it("falls back to a starter note when there's no data", () => {
    expect(generateObservations(baseSummary())).toEqual([
      "Solve and mark a few problems to start seeing patterns here.",
    ]);
  });

  it("calls out the top two patterns, weakest patterns, and pace change", () => {
    const notes = generateObservations(
      baseSummary({
        patternCoverage: [
          { pattern: "sliding-window", count: 5, lastSolvedAt: new Date() },
          { pattern: "hash-map", count: 4, lastSolvedAt: new Date() },
        ],
        weakestPatterns: ["stack", "backtracking"],
        thisWeek: 3,
        lastWeek: 1,
      }),
    );

    expect(notes[0]).toContain("sliding-window (5 solves) and hash-map (4)");
    expect(notes[1]).toContain("stack, backtracking have just one solve each");
    expect(notes[2]).toContain("picked up this week (3 vs 1 last week)");
  });

  it("notes a slowdown when this week is behind last week", () => {
    const notes = generateObservations(baseSummary({ thisWeek: 1, lastWeek: 4 }));
    expect(notes.find((n) => n.includes("slowed down"))).toBeDefined();
  });

  it("uses singular 'solve' when the top pattern has exactly one", () => {
    const notes = generateObservations(
      baseSummary({
        patternCoverage: [
          { pattern: "dp", count: 1, lastSolvedAt: new Date() },
          { pattern: "hash-map", count: 1, lastSolvedAt: new Date() },
        ],
      }),
    );
    expect(notes[0]).toContain("dp (1 solve) and hash-map (1)");
  });
});
