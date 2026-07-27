import { commitFiles, readSubmissionFiles } from "@scs/github";
import type { CaptureSubmission } from "@scs/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@scs/db";
import { SubmissionsService } from "./submissions.service.js";

vi.mock("@scs/db", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    submission: { upsert: vi.fn(), findFirst: vi.fn() },
  },
}));

vi.mock("@scs/github", async (importActual) => {
  const actual = await importActual<typeof import("@scs/github")>();
  return { ...actual, commitFiles: vi.fn(), readSubmissionFiles: vi.fn() };
});

const input: CaptureSubmission = {
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
};

function makeService() {
  const queue = { enqueueEnrichment: vi.fn().mockResolvedValue(undefined) };
  const service = new SubmissionsService(queue as never);
  return { service, queue };
}

describe("SubmissionsService.capture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(commitFiles).mockResolvedValue(undefined);
    vi.mocked(prisma.submission.upsert).mockResolvedValue({ id: "sub_1" } as never);
  });

  it("commits to GitHub when the user has an installation wired", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      githubInstallationId: "42",
      githubRepo: "octocat/solutions",
    } as never);
    const { service, queue } = makeService();

    const result = await service.capture("demo-user", input);

    expect(commitFiles).toHaveBeenCalledOnce();
    expect(commitFiles).toHaveBeenCalledWith(
      expect.objectContaining({
        installationId: 42,
        owner: "octocat",
        repo: "solutions",
        slug: "two-sum",
        message: "Add Two Sum",
      }),
    );
    expect(queue.enqueueEnrichment).toHaveBeenCalledWith({ submissionId: "sub_1" });
    expect(result).toEqual({ id: "sub_1" });
  });

  it("skips the repo write when no installation is wired, and leaves repoPath unset", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      githubInstallationId: null,
      githubRepo: null,
    } as never);
    const { service, queue } = makeService();

    await service.capture("demo-user", input);

    expect(commitFiles).not.toHaveBeenCalled();
    expect(prisma.submission.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ repoPath: null }) }),
    );
    expect(queue.enqueueEnrichment).toHaveBeenCalledOnce();
  });

  it("sets repoPath when the GitHub commit succeeds", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      githubInstallationId: "42",
      githubRepo: "octocat/solutions",
    } as never);
    const { service } = makeService();

    await service.capture("demo-user", input);

    expect(prisma.submission.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ repoPath: "two-sum" }) }),
    );
  });

  it("does not index when the GitHub commit fails (GitHub is source of truth)", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      githubInstallationId: "42",
      githubRepo: "octocat/solutions",
    } as never);
    vi.mocked(commitFiles).mockRejectedValue(new Error("push failed"));
    const { service, queue } = makeService();

    await expect(service.capture("demo-user", input)).rejects.toThrow("push failed");
    expect(prisma.submission.upsert).not.toHaveBeenCalled();
    expect(queue.enqueueEnrichment).not.toHaveBeenCalled();
  });
});

describe("SubmissionsService.getCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reads the code back from GitHub when the submission is synced, with no analysis yet", async () => {
    vi.mocked(prisma.submission.findFirst).mockResolvedValue({
      slug: "two-sum",
      language: "python",
      repoPath: "two-sum",
      analysis: null,
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      githubInstallationId: "42",
      githubRepo: "octocat/solutions",
    } as never);
    vi.mocked(readSubmissionFiles).mockResolvedValue({ statement: "# Two Sum", code: "print(1)" });
    const { service } = makeService();

    const result = await service.getCode("demo-user", "sub_1");

    expect(readSubmissionFiles).toHaveBeenCalledWith({
      installationId: 42,
      owner: "octocat",
      repo: "solutions",
      slug: "two-sum",
      language: "python",
    });
    expect(result).toEqual({ language: "python", code: "print(1)", analysis: null });
  });

  it("includes the AI-derived complexity for the same submission once enrichment is done", async () => {
    vi.mocked(prisma.submission.findFirst).mockResolvedValue({
      slug: "two-sum",
      language: "python",
      repoPath: "two-sum",
      analysis: { timeComplexity: "O(n)", spaceComplexity: "O(n)" },
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      githubInstallationId: "42",
      githubRepo: "octocat/solutions",
    } as never);
    vi.mocked(readSubmissionFiles).mockResolvedValue({ statement: "# Two Sum", code: "print(1)" });
    const { service } = makeService();

    const result = await service.getCode("demo-user", "sub_1");

    expect(result.analysis).toEqual({ timeComplexity: "O(n)", spaceComplexity: "O(n)" });
  });

  it("rejects when the submission hasn't synced to GitHub yet", async () => {
    vi.mocked(prisma.submission.findFirst).mockResolvedValue({
      slug: "two-sum",
      language: "python",
      repoPath: null,
    } as never);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      githubInstallationId: "42",
      githubRepo: "octocat/solutions",
    } as never);
    const { service } = makeService();

    await expect(service.getCode("demo-user", "sub_1")).rejects.toThrow(/not synced/);
    expect(readSubmissionFiles).not.toHaveBeenCalled();
  });

  it("rejects when the submission doesn't belong to the requesting user", async () => {
    vi.mocked(prisma.submission.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      githubInstallationId: "42",
      githubRepo: "octocat/solutions",
    } as never);
    const { service } = makeService();

    await expect(service.getCode("demo-user", "sub_1")).rejects.toThrow();
    expect(readSubmissionFiles).not.toHaveBeenCalled();
  });
});
