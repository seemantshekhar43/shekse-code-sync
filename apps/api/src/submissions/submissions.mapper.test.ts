import { describe, expect, it } from "vitest";
import { type SubmissionRow, toSummary } from "./submissions.mapper.js";

const baseRow: SubmissionRow = {
  id: "sub_1",
  title: "Two Sum",
  slug: "two-sum",
  questionLink: "https://leetcode.com/problems/two-sum/",
  platform: "leetcode",
  level: "easy",
  language: "python",
  status: "accepted",
  tags: ["array"],
  topics: ["hash-table"],
  isMarkedForRevision: false,
  enrichment: "pending",
  repoPath: "two-sum",
  solvedAt: new Date("2026-07-25T00:00:00.000Z"),
  analysis: null,
};

describe("toSummary", () => {
  it("maps a row without analysis (pattern null)", () => {
    const summary = toSummary(baseRow);
    expect(summary.pattern).toBeNull();
    expect(summary.title).toBe("Two Sum");
    expect(summary.enrichment).toBe("pending");
  });

  it("marks synced false when repoPath hasn't been set yet", () => {
    const summary = toSummary({ ...baseRow, repoPath: null });
    expect(summary.synced).toBe(false);
  });

  it("pulls pattern from analysis when present", () => {
    const summary = toSummary({
      ...baseRow,
      enrichment: "done",
      analysis: { pattern: "hash-map" },
    });
    expect(summary.pattern).toBe("hash-map");
    expect(summary.enrichment).toBe("done");
  });
});
