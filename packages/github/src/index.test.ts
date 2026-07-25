import { describe, expect, it } from "vitest";
import { buildSubmissionFiles, extForLanguage, slugify } from "./index.js";

describe("github helpers", () => {
  it("slugifies titles", () => {
    expect(slugify("Two Sum")).toBe("two-sum");
    expect(slugify("  Longest Substring!! ")).toBe("longest-substring");
  });

  it("maps languages to extensions", () => {
    expect(extForLanguage("python")).toBe("py");
    expect(extForLanguage("C++")).toBe("cpp");
    expect(extForLanguage("brainfuck")).toBe("txt");
  });

  it("builds the three repo files", () => {
    const files = buildSubmissionFiles({
      title: "Two Sum",
      questionLink: "https://leetcode.com/problems/two-sum/",
      platform: "leetcode",
      level: "easy",
      statement: "# Two Sum",
      tags: [],
      topics: [],
      companies: [],
      solution: { language: "python", code: "print(1)" },
      status: "accepted",
      solvedAt: new Date("2026-07-25T00:00:00.000Z"),
    });
    expect(files.map((f) => f.path)).toEqual(["question.md", "solution.py", "meta.json"]);
  });
});
