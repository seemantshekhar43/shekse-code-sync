import { aiProvider } from "@scs/ai";
import { prisma } from "@scs/db";
import { readSubmissionFiles } from "@scs/github";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EnrichmentWorker } from "./enrichment.worker.js";

vi.mock("@scs/db", () => ({
  prisma: {
    submission: { findUnique: vi.fn(), update: vi.fn() },
    analysis: { upsert: vi.fn() },
  },
}));

vi.mock("@scs/ai", () => ({ aiProvider: { analyze: vi.fn() } }));

vi.mock("@scs/github", () => ({
  readSubmissionFiles: vi.fn(),
  parseRepo: (full: string) => {
    const [owner, repo] = full.split("/");
    return { owner, repo };
  },
}));

const analysis = {
  timeComplexity: "O(n)",
  spaceComplexity: "O(n)",
  pattern: "hash-map",
  optimizationNotes: "Already optimal.",
};

const wiredSubmission = {
  id: "sub_1",
  title: "1. Two Sum",
  slug: "two-sum",
  language: "python",
  user: { githubInstallationId: "42", githubRepo: "octocat/solutions" },
};

describe("EnrichmentWorker.enrich", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.submission.update).mockResolvedValue({} as never);
    vi.mocked(prisma.analysis.upsert).mockResolvedValue({} as never);
  });

  it("reads source from GitHub, analyzes, and marks done", async () => {
    vi.mocked(prisma.submission.findUnique).mockResolvedValue(wiredSubmission as never);
    vi.mocked(readSubmissionFiles).mockResolvedValue({ statement: "# Two Sum", code: "pass" });
    vi.mocked(aiProvider.analyze).mockResolvedValue(analysis);

    await new EnrichmentWorker().enrich("sub_1");

    expect(readSubmissionFiles).toHaveBeenCalledWith({
      installationId: 42,
      owner: "octocat",
      repo: "solutions",
      slug: "two-sum",
      language: "python",
    });
    expect(aiProvider.analyze).toHaveBeenCalledWith({
      title: "1. Two Sum",
      statement: "# Two Sum",
      language: "python",
      code: "pass",
    });
    expect(prisma.analysis.upsert).toHaveBeenCalledWith({
      where: { submissionId: "sub_1" },
      create: { submissionId: "sub_1", ...analysis },
      update: analysis,
    });
    expect(prisma.submission.update).toHaveBeenCalledWith({
      where: { id: "sub_1" },
      data: { enrichment: "done" },
    });
  });

  it("marks failed (no analysis) when the user has no GitHub source", async () => {
    vi.mocked(prisma.submission.findUnique).mockResolvedValue({
      ...wiredSubmission,
      user: { githubInstallationId: null, githubRepo: null },
    } as never);

    await new EnrichmentWorker().enrich("sub_1");

    expect(readSubmissionFiles).not.toHaveBeenCalled();
    expect(aiProvider.analyze).not.toHaveBeenCalled();
    expect(prisma.submission.update).toHaveBeenCalledWith({
      where: { id: "sub_1" },
      data: { enrichment: "failed" },
    });
  });

  it("no-ops when the submission is gone", async () => {
    vi.mocked(prisma.submission.findUnique).mockResolvedValue(null as never);

    await new EnrichmentWorker().enrich("missing");

    expect(prisma.submission.update).not.toHaveBeenCalled();
    expect(aiProvider.analyze).not.toHaveBeenCalled();
  });

  it("propagates GitHub/AI errors so BullMQ can retry", async () => {
    vi.mocked(prisma.submission.findUnique).mockResolvedValue(wiredSubmission as never);
    vi.mocked(readSubmissionFiles).mockRejectedValue(new Error("GitHub 502"));

    await expect(new EnrichmentWorker().enrich("sub_1")).rejects.toThrow("GitHub 502");
    expect(prisma.submission.update).not.toHaveBeenCalled();
  });
});

describe("EnrichmentWorker.process (BullMQ retry semantics)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.submission.update).mockResolvedValue({} as never);
  });

  // process() is the private BullMQ handler; drive it directly with a fake Job.
  const runProcess = (
    worker: EnrichmentWorker,
    job: { data: { submissionId: string }; opts: { attempts?: number }; attemptsMade: number },
  ): Promise<void> =>
    (worker as unknown as { process(job: unknown): Promise<void> }).process(job);

  it("rethrows without marking failed on a non-final attempt", async () => {
    const worker = new EnrichmentWorker();
    vi.spyOn(worker, "enrich").mockRejectedValue(new Error("GitHub 502"));

    await expect(
      runProcess(worker, { data: { submissionId: "sub_1" }, opts: { attempts: 5 }, attemptsMade: 0 }),
    ).rejects.toThrow("GitHub 502");

    // attempt 1 of 5 -> retry, do NOT persist failed yet.
    expect(prisma.submission.update).not.toHaveBeenCalled();
  });

  it("marks failed on the final attempt before rethrowing", async () => {
    const worker = new EnrichmentWorker();
    vi.spyOn(worker, "enrich").mockRejectedValue(new Error("GitHub 502"));

    await expect(
      runProcess(worker, { data: { submissionId: "sub_1" }, opts: { attempts: 5 }, attemptsMade: 4 }),
    ).rejects.toThrow("GitHub 502");

    // attempt 5 of 5 -> record the terminal failure, then rethrow.
    expect(prisma.submission.update).toHaveBeenCalledWith({
      where: { id: "sub_1" },
      data: { enrichment: "failed" },
    });
  });
});
