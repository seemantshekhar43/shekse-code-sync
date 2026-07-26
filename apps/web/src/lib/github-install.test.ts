import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@scs/db", () => ({
  prisma: { user: { update: vi.fn() } },
}));

vi.mock("@scs/github", () => ({
  getInstallationAccount: vi.fn(),
  listInstallationRepos: vi.fn(),
}));

vi.mock("./scs-token.js", () => ({
  verifyInstallState: vi.fn(),
}));

import { prisma } from "@scs/db";
import { getInstallationAccount, listInstallationRepos } from "@scs/github";
import {
  persistInstallation,
  resolveInstallationForUser,
} from "./github-install.js";
import { verifyInstallState } from "./scs-token.js";

const account = (login: string, type = "User") => ({ login, type });
const repo = (fullName: string) => {
  const [owner, name] = fullName.split("/");
  return { owner, repo: name, fullName };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("resolveInstallationForUser", () => {
  it("resolves repos when the installation account matches the user's github login", async () => {
    vi.mocked(getInstallationAccount).mockResolvedValue(account("Octocat"));
    vi.mocked(listInstallationRepos).mockResolvedValue([repo("octocat/solutions")]);

    const res = await resolveInstallationForUser({
      installationId: 149148749,
      userId: "u1",
      githubLogin: "octocat", // case-insensitive match against "Octocat"
      state: undefined,
    });

    expect(res).toEqual({ ok: true, repos: [repo("octocat/solutions")] });
  });

  it("rejects when the installation account belongs to a different github user", async () => {
    vi.mocked(getInstallationAccount).mockResolvedValue(account("someone-else"));

    const res = await resolveInstallationForUser({
      installationId: 1,
      userId: "u1",
      githubLogin: "octocat",
      state: undefined,
    });

    expect(res).toEqual({ ok: false, reason: "forbidden" });
    expect(listInstallationRepos).not.toHaveBeenCalled();
  });

  it("rejects organization installations as unsupported", async () => {
    vi.mocked(getInstallationAccount).mockResolvedValue(account("some-org", "Organization"));

    const res = await resolveInstallationForUser({
      installationId: 1,
      userId: "u1",
      githubLogin: "octocat",
      state: undefined,
    });

    expect(res).toEqual({ ok: false, reason: "org_unsupported" });
  });

  it("rejects when a signed state nonce belongs to a different user (CSRF gate)", async () => {
    vi.mocked(verifyInstallState).mockResolvedValue("attacker");

    const res = await resolveInstallationForUser({
      installationId: 1,
      userId: "victim",
      githubLogin: "octocat",
      state: "signed-nonce-for-attacker",
    });

    expect(res).toEqual({ ok: false, reason: "forbidden" });
    expect(getInstallationAccount).not.toHaveBeenCalled();
  });

  it("surfaces transient GitHub failures as an error banner, not a raw throw", async () => {
    vi.mocked(getInstallationAccount).mockRejectedValue(new Error("502 from GitHub"));

    const res = await resolveInstallationForUser({
      installationId: 1,
      userId: "u1",
      githubLogin: "octocat",
      state: undefined,
    });

    expect(res).toEqual({ ok: false, reason: "error" });
  });
});

describe("persistInstallation", () => {
  it("writes the installation id and repo onto the user row", async () => {
    await persistInstallation("u1", 149148749, "octocat/solutions");

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { githubInstallationId: "149148749", githubRepo: "octocat/solutions" },
    });
  });
});
