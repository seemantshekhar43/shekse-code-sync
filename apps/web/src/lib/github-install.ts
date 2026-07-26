import { prisma } from "@scs/db";
import {
  getInstallationAccount,
  type InstallationRepo,
  listInstallationRepos,
} from "@scs/github";
import { verifyInstallState } from "./scs-token";

/**
 * Persist a user's GitHub App installation + target repo, resolved from the
 * post-install redirect. `fullName` is "owner/repo".
 */
export async function persistInstallation(
  userId: string,
  installationId: number,
  fullName: string,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      githubInstallationId: String(installationId),
      githubRepo: fullName,
    },
  });
}

/** Failure reasons map 1:1 to the `/?github=` banner keys on the dashboard. */
export type InstallRejection = "forbidden" | "org_unsupported" | "error";

export type ResolvedInstallation =
  | { ok: true; repos: InstallationRepo[] }
  | { ok: false; reason: InstallRejection };

/**
 * Authorize a GitHub App installation for the signed-in user and resolve its
 * repositories. This is the mandatory gate in front of `persistInstallation`
 * that closes the cross-account installation-hijacking hole:
 *
 * - Optional signed `state` nonce (our own install link) must match the user.
 * - The installation's account MUST be a `User` whose login equals the user's
 *   GitHub login (case-insensitive); orgs are rejected until admin verification
 *   ships. Both checks use the App's own credentials, independent of how the
 *   callback was reached.
 *
 * Live GitHub calls are wrapped so transient failures surface as an `error`
 * banner rather than a raw 500.
 */
export async function resolveInstallationForUser(params: {
  installationId: number;
  userId: string;
  githubLogin: string | undefined;
  state: string | undefined;
}): Promise<ResolvedInstallation> {
  const { installationId, userId, githubLogin, state } = params;

  if (state !== undefined) {
    const stateUserId = await verifyInstallState(state);
    if (stateUserId !== userId) return { ok: false, reason: "forbidden" };
  }

  try {
    const account = await getInstallationAccount(installationId);
    if (account.type !== "User") return { ok: false, reason: "org_unsupported" };
    if (!githubLogin || account.login.toLowerCase() !== githubLogin.toLowerCase()) {
      return { ok: false, reason: "forbidden" };
    }
    const repos = await listInstallationRepos(installationId);
    return { ok: true, repos };
  } catch {
    return { ok: false, reason: "error" };
  }
}
