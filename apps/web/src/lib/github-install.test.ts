import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@scs/github", () => ({
  getInstallationAccount: vi.fn(),
  listInstallationRepos: vi.fn(),
  uninstallInstallation: vi.fn(),
}));

vi.mock("./internal-api.js", () => ({
  setInstallation: vi.fn(),
  disconnectUser: vi.fn(),
}));

vi.mock("./scs-token.js", () => ({
  verifyInstallState: vi.fn(),
}));

import { getInstallationAccount, listInstallationRepos, uninstallInstallation } from "@scs/github";
import {
  disconnectInstallation,
  persistInstallation,
  resolveInstallationForUser,
} from "./github-install.js";
import { disconnectUser, setInstallation } from "./internal-api.js";
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

    expect(setInstallation).toHaveBeenCalledWith("u1", "149148749", "octocat/solutions");
  });
});

describe("disconnectInstallation", () => {
  it("revokes the installation after clearing the stored association", async () => {
    vi.mocked(disconnectUser).mockResolvedValue({ previousInstallationId: "149148749" });

    await disconnectInstallation("u1");

    expect(disconnectUser).toHaveBeenCalledWith("u1");
    expect(uninstallInstallation).toHaveBeenCalledWith(149148749);
  });

  it("does not throw when GitHub revocation fails", async () => {
    vi.mocked(disconnectUser).mockResolvedValue({ previousInstallationId: "149148749" });
    vi.mocked(uninstallInstallation).mockRejectedValueOnce(new Error("already uninstalled"));

    await expect(disconnectInstallation("u1")).resolves.toBeUndefined();
  });

  it("skips the GitHub call when there was no installation to revoke", async () => {
    vi.mocked(disconnectUser).mockResolvedValue({ previousInstallationId: null });

    await disconnectInstallation("u1");

    expect(uninstallInstallation).not.toHaveBeenCalled();
  });
});
