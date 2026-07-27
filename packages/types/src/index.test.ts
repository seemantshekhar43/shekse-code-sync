import { describe, expect, it } from "vitest";
import { CaptureSubmission, SubmissionQuery } from "./index.js";

describe("CaptureSubmission", () => {
  it("parses a valid submission and defaults empty arrays", () => {
    const parsed = CaptureSubmission.parse({
      title: "Two Sum",
      questionLink: "https://leetcode.com/problems/two-sum/",
      platform: "leetcode",
      level: "easy",
      statement: "# Two Sum",
      solution: { language: "python", code: "print(1)" },
      status: "accepted",
      solvedAt: "2026-07-25T00:00:00.000Z",
    });
    expect(parsed.tags).toEqual([]);
    expect(parsed.solvedAt).toBeInstanceOf(Date);
  });

  it("rejects an invalid level", () => {
    expect(() =>
      CaptureSubmission.parse({
        title: "x",
        questionLink: "https://leetcode.com/problems/x/",
        platform: "leetcode",
        level: "impossible",
        statement: "x",
        solution: { language: "python", code: "x" },
        status: "accepted",
        solvedAt: new Date(),
      }),
    ).toThrow();
  });
});

describe("SubmissionQuery.synced", () => {
  it('parses the string "false" as boolean false, not truthy coercion', () => {
    expect(SubmissionQuery.parse({ synced: "false" }).synced).toBe(false);
  });

  it('parses the string "true" as boolean true', () => {
    expect(SubmissionQuery.parse({ synced: "true" }).synced).toBe(true);
  });

  it("rejects any other value", () => {
    expect(() => SubmissionQuery.parse({ synced: "yes" })).toThrow();
  });
});
