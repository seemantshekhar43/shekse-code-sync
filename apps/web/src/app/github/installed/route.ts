import { listInstallationRepos } from "@scs/github";
import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { persistInstallation } from "../../../lib/github-install";

/**
 * GitHub App post-install redirect (Setup URL). GitHub sends
 * `?installation_id=...&setup_action=install`. We resolve which repo the
 * installation grants access to and persist it against the logged-in user.
 * One repo -> persist automatically; several -> hand off to the picker.
 */
export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const session = await auth();

  if (!session?.userId) {
    // Preserve the installation across sign-in, then land back here.
    const back = `/github/installed${url.search}`;
    return NextResponse.redirect(
      new URL(`/api/auth/signin?callbackUrl=${encodeURIComponent(back)}`, url.origin),
    );
  }

  const installationId = Number(url.searchParams.get("installation_id"));
  if (!Number.isInteger(installationId) || installationId <= 0) {
    return NextResponse.redirect(new URL("/?github=missing_installation", url.origin));
  }

  const repos = await listInstallationRepos(installationId);
  if (repos.length === 0) {
    return NextResponse.redirect(new URL("/?github=no_repos", url.origin));
  }
  if (repos.length === 1) {
    await persistInstallation(session.userId, installationId, repos[0].fullName);
    return NextResponse.redirect(new URL("/?github=connected", url.origin));
  }

  return NextResponse.redirect(
    new URL(`/github/installed/select?installation_id=${installationId}`, url.origin),
  );
}
