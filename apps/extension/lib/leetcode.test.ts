import { describe, expect, it } from "vitest";
import {
  buildCapture,
  type LeetCodeQuestion,
  type LeetCodeSubmission,
  mapDifficulty,
  mapLanguage,
  parseMemoryKb,
  parseRuntimeMs,
  slugFromUrl,
} from "./leetcode.js";

describe("leetcode mappers", () => {
  it("maps language slugs to normalized keys", () => {
    expect(mapLanguage("python3")).toBe("python");
    expect(mapLanguage("golang")).toBe("go");
    expect(mapLanguage("C++")).toBe("cpp");
    expect(mapLanguage("rust")).toBe("rust");
  });

  it("maps difficulty and rejects unknown", () => {
    expect(mapDifficulty("Easy")).toBe("easy");
    expect(mapDifficulty("HARD")).toBe("hard");
    expect(() => mapDifficulty("Insane")).toThrow();
  });

  it("parses runtime to whole ms", () => {
    expect(parseRuntimeMs("64 ms")).toBe(64);
    expect(parseRuntimeMs("0 ms")).toBe(0);
    expect(parseRuntimeMs("N/A")).toBeUndefined();
  });

  it("parses memory to whole kb across units", () => {
    expect(parseMemoryKb("17.2 MB")).toBe(Math.round(17.2 * 1024));
    expect(parseMemoryKb("1024 KB")).toBe(1024);
    expect(parseMemoryKb("1 GB")).toBe(1024 * 1024);
    expect(parseMemoryKb("N/A")).toBeUndefined();
  });

  it("extracts the problem slug from a tab url", () => {
    expect(slugFromUrl("https://leetcode.com/problems/two-sum/")).toBe("two-sum");
    expect(slugFromUrl("https://leetcode.com/problems/two-sum/description/?x=1")).toBe("two-sum");
    expect(slugFromUrl("https://leetcode.com/problemset/")).toBeNull();
    expect(slugFromUrl(undefined)).toBeNull();
  });
});

describe("buildCapture", () => {
  const question: LeetCodeQuestion = {
    questionId: "1",
    title: "Two Sum",
    titleSlug: "two-sum",
    difficulty: "Easy",
    content: "<p>Given an array...</p>",
    topicTags: [
      { name: "Array", slug: "array" },
      { name: "Hash Table", slug: "hash-table" },
    ],
  };
  const submission: LeetCodeSubmission = {
    id: "987",
    statusDisplay: "Accepted",
    lang: "python3",
    runtime: "64 ms",
    memory: "17.2 MB",
    timestamp: 1_785_000_000,
    code: "class Solution:\n    pass",
  };

  it("assembles a valid CaptureSubmission", () => {
    const capture = buildCapture(question, submission);
    expect(capture.title).toBe("1. Two Sum");
    expect(capture.questionLink).toBe("https://leetcode.com/problems/two-sum/");
    expect(capture.platform).toBe("leetcode");
    expect(capture.level).toBe("easy");
    expect(capture.topics).toEqual(["array", "hash-table"]);
    expect(capture.solution).toEqual({ language: "python", code: submission.code });
    expect(capture.status).toBe("accepted");
    expect(capture.runtimeMs).toBe(64);
    expect(capture.memoryKb).toBe(Math.round(17.2 * 1024));
    expect(capture.solvedAt).toEqual(new Date(1_785_000_000 * 1000));
  });

  it("omits metrics when LeetCode reports N/A", () => {
    const capture = buildCapture(question, { ...submission, runtime: "N/A", memory: "N/A" });
    expect(capture.runtimeMs).toBeUndefined();
    expect(capture.memoryKb).toBeUndefined();
  });
});
