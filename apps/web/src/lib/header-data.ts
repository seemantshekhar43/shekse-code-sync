import { prisma } from "@scs/db";
import type { Session } from "next-auth";
import { mintInstallState, mintScsToken } from "./scs-token";

export type HeaderData = {
  displayName: string;
  githubHandle: string | null;
  token: string;
  githubRepo: string | null;
  manageUrl?: string;
  connectUrl?: string;
};

/**
 * Shared avatar-menu data (account identity, GitHub repo status, extension
 * token) every dashboard page needs to render `DashboardHeader`.
 */
export async function getHeaderData(session: Session): Promise<HeaderData> {
  const userId = session.userId!;
  const [token, installState, user] = await Promise.all([
    mintScsToken(userId),
    mintInstallState(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { githubRepo: true } }),
  ]);

  const appSlug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG;
  const installUrl = appSlug
    ? `https://github.com/apps/${appSlug}/installations/new?state=${encodeURIComponent(installState)}`
    : undefined;

  return {
    displayName: session.user?.name ?? session.githubLogin ?? "You",
    githubHandle: session.githubLogin ?? null,
    token,
    githubRepo: user?.githubRepo ?? null,
    manageUrl: user?.githubRepo ? installUrl : undefined,
    // Always set (not just when disconnected server-side): disconnecting is a
    // client-side state flip in AvatarMenu, with no page reload, so the
    // fallback empty state needs a connect link ready even while this
    // server-rendered prop still reflects the pre-disconnect connected state.
    connectUrl: installUrl,
  };
}
