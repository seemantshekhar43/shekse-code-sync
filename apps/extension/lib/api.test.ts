import type { CaptureSubmission } from "@scs/types";
import { afterEach, describe, expect, it, vi } from "vitest";
import { postCapture } from "./api.js";

const payload = {
  title: "1. Two Sum",
  questionLink: "https://leetcode.com/problems/two-sum/",
  platform: "leetcode",
  level: "easy",
  statement: "<p>...</p>",
  tags: [],
  topics: ["array"],
  companies: [],
  solution: { language: "python", code: "pass" },
  status: "accepted",
  solvedAt: new Date("2026-07-25T00:00:00.000Z"),
} as CaptureSubmission;

afterEach(() => vi.unstubAllGlobals());

describe("postCapture", () => {
  it("POSTs to /submissions with a bearer token and returns the id", async () => {
    const fetchMock = vi.fn(
      async (_url: string, _init: RequestInit) =>
        new Response(JSON.stringify({ id: "sub_1" }), { status: 201 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await postCapture("http://localhost:3001/", "tok_123", payload);

    expect(result).toEqual({ id: "sub_1" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:3001/submissions"); // trailing slash trimmed
    expect(init.method).toBe("POST");
    expect((init.headers as Record<string, string>).authorization).toBe("Bearer tok_123");
    expect(JSON.parse(init.body as string).title).toBe("1. Two Sum");
  });

  it("omits the authorization header when no token is set", async () => {
    const fetchMock = vi.fn(
      async (_url: string, _init: RequestInit) =>
        new Response(JSON.stringify({ id: "x" }), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await postCapture("http://localhost:3001", "", payload);

    const [, init] = fetchMock.mock.calls[0];
    expect((init.headers as Record<string, string>).authorization).toBeUndefined();
  });

  it("throws with the response body on a non-2xx status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("bad request", { status: 400 })),
    );

    await expect(postCapture("http://localhost:3001", "t", payload)).rejects.toThrow(/400.*bad request/);
  });
});
