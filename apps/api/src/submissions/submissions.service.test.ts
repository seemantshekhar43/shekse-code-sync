import { commitFiles } from "@scs/github";
import type { CaptureSubmission } from "@scs/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@scs/db";
import { SubmissionsService } from "./submissions.service.js";

vi.mock("@scs/db", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    submission: { upsert: vi.fn() },
  },
}));

vi.mock("@scs/github", async (importActual) => {
  const actual = await importActual<typeof import("@scs/github")>();
  return { ...actual, commitFiles: vi.fn() };
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

  it("skips the repo write when no installation is wired", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      githubInstallationId: null,
      githubRepo: null,
    } as never);
    const { service, queue } = makeService();

    await service.capture("demo-user", input);

    expect(commitFiles).not.toHaveBeenCalled();
    expect(prisma.submission.upsert).toHaveBeenCalledOnce();
    expect(queue.enqueueEnrichment).toHaveBeenCalledOnce();
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
