import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@scs/db", () => ({
  prisma: {
    user: {
      upsert: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from "@scs/db";
import { UsersService } from "./users.service.js";

describe("UsersService", () => {
  const service = new UsersService();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("upserts a user by email", async () => {
    vi.mocked(prisma.user.upsert).mockResolvedValue({ id: "u1" } as never);

    const result = await service.upsertByEmail("a@b.com", "Ada");

    expect(prisma.user.upsert).toHaveBeenCalledWith({
      where: { email: "a@b.com" },
      update: { name: "Ada" },
      create: { email: "a@b.com", name: "Ada" },
      select: { id: true },
    });
    expect(result).toEqual({ id: "u1" });
  });

  it("reads tokenVersion and githubRepo for a user", async () => {
    vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue({
      tokenVersion: 2,
      githubRepo: "octocat/solutions",
    } as never);

    const result = await service.get("u1");

    expect(result).toEqual({ tokenVersion: 2, githubRepo: "octocat/solutions" });
  });

  it("writes the installation id and repo", async () => {
    await service.setInstallation("u1", "149148749", "octocat/solutions");

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { githubInstallationId: "149148749", githubRepo: "octocat/solutions" },
    });
  });

  it("clears the installation, bumps tokenVersion, and returns the previous id", async () => {
    vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue({
      githubInstallationId: "149148749",
    } as never);

    const result = await service.disconnect("u1");

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { githubInstallationId: null, githubRepo: null, tokenVersion: { increment: 1 } },
    });
    expect(result).toEqual({ previousInstallationId: "149148749" });
  });
});
