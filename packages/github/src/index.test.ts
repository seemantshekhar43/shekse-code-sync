import { describe, expect, it, vi } from "vitest";
import {
  buildSubmissionFiles,
  commitFilesWith,
  extForLanguage,
  getFileContentWith,
  listInstallationReposWith,
  type OctokitLike,
  parseRepo,
  slugify,
} from "./index.js";

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

  it("parses owner/repo and rejects bad input", () => {
    expect(parseRepo("octocat/hello-world")).toEqual({ owner: "octocat", repo: "hello-world" });
    expect(() => parseRepo("no-slash")).toThrow();
    expect(() => parseRepo("too/many/parts")).toThrow();
  });
});

describe("commitFilesWith", () => {
  const params = {
    installationId: 1,
    owner: "octocat",
    repo: "solutions",
    slug: "two-sum",
    message: "Add Two Sum",
    files: [{ path: "solution.py", content: "print(1)" }],
  };

  const putBody = (request: OctokitLike["request"]): Record<string, unknown> => {
    const call = vi.mocked(request).mock.calls.find(([route]) => route.startsWith("PUT"));
    if (!call) throw new Error("no PUT request was made");
    return call[1];
  };

  it("creates a new file without a sha (404 lookup)", async () => {
    const request = vi.fn(async (route: string, _params: Record<string, unknown>) => {
      if (route.startsWith("GET")) throw Object.assign(new Error("not found"), { status: 404 });
      return { data: {} };
    });

    await commitFilesWith({ request }, params);

    const put = putBody(request);
    expect(put.path).toBe("two-sum/solution.py");
    expect(put.content).toBe(Buffer.from("print(1)", "utf8").toString("base64"));
    expect(put).not.toHaveProperty("sha");
  });

  it("updates an existing file by passing its blob sha", async () => {
    const request = vi.fn(async (route: string, _params: Record<string, unknown>) => {
      if (route.startsWith("GET")) return { data: { sha: "abc123" } };
      return { data: {} };
    });

    await commitFilesWith({ request }, params);

    expect(putBody(request).sha).toBe("abc123");
  });
});

describe("listInstallationReposWith", () => {
  it("maps the installation repositories to owner/repo/fullName", async () => {
    const request = vi.fn(async () => ({
      data: {
        repositories: [
          { name: "solutions", owner: { login: "octocat" }, full_name: "octocat/solutions" },
          { name: "dsa", owner: { login: "octocat" }, full_name: "octocat/dsa" },
        ],
      },
    }));

    const repos = await listInstallationReposWith({ request });

    expect(repos).toEqual([
      { owner: "octocat", repo: "solutions", fullName: "octocat/solutions" },
      { owner: "octocat", repo: "dsa", fullName: "octocat/dsa" },
    ]);
    expect(request).toHaveBeenCalledWith(
      "GET /installation/repositories",
      expect.objectContaining({ per_page: 100 }),
    );
  });

  it("returns an empty list when there are no repositories", async () => {
    const request = vi.fn(async () => ({ data: {} }));
    expect(await listInstallationReposWith({ request })).toEqual([]);
  });
});

describe("getFileContentWith", () => {
  it("decodes base64 file contents to utf-8", async () => {
    const request = vi.fn(async (_route: string, _params: Record<string, unknown>) => ({
      data: { content: Buffer.from("# Two Sum", "utf8").toString("base64"), encoding: "base64" },
    }));

    const content = await getFileContentWith({ request }, "octocat", "solutions", "two-sum/question.md");

    expect(content).toBe("# Two Sum");
    expect(request).toHaveBeenCalledWith(
      "GET /repos/{owner}/{repo}/contents/{path}",
      expect.objectContaining({ path: "two-sum/question.md" }),
    );
  });

  it("throws when the path is a directory (array response)", async () => {
    const request = vi.fn(async () => ({ data: [{ name: "solution.py" }] }));

    await expect(
      getFileContentWith({ request }, "octocat", "solutions", "two-sum"),
    ).rejects.toThrow(/Expected a file/);
  });
});
