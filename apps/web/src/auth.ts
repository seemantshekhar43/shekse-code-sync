import { prisma } from "@scs/db";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

/**
 * Auth.js (NextAuth v5) - multi-user login via GitHub OAuth.
 * Repo writes use a separate GitHub App (see packages/github), not this login.
 *
 * On first sign-in we upsert a `User` row keyed by GitHub email and carry its
 * cuid as `userId` through the JWT session; that id is what the ShekseCodeSync
 * token embeds and the API scopes captures/reads to.
 */
/**
 * GitHub accounts with a private primary email leave `profile.email` null.
 * Resolve the primary verified address from the emails API so those users can
 * still sign in; returns null when none is available (sign-in fails cleanly).
 */
async function resolveGitHubPrimaryEmail(
  accessToken: string | undefined,
): Promise<string | null> {
  if (!accessToken) return null;
  try {
    const res = await fetch("https://api.github.com/user/emails", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "ShekseCodeSync",
      },
    });
    if (!res.ok) return null;
    const emails = (await res.json()) as Array<{
      email: string;
      primary: boolean;
      verified: boolean;
    }>;
    const primary = emails.find((e) => e.primary && e.verified);
    const verified = primary ?? emails.find((e) => e.verified);
    return verified?.email ?? null;
  } catch {
    return null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID ?? "",
      clientSecret: process.env.AUTH_GITHUB_SECRET ?? "",
      authorization: { params: { scope: "read:user user:email" } },
    }),
  ],
  callbacks: {
    async jwt({ token, profile, account }) {
      // Runs with `profile`/`account` only on initial sign-in; resolve our User row then.
      if (profile) {
        const email =
          profile.email ?? (await resolveGitHubPrimaryEmail(account?.access_token));
        if (email) {
          const user = await prisma.user.upsert({
            where: { email },
            update: { name: (profile.name as string | undefined) ?? undefined },
            create: {
              email,
              name: (profile.name as string | undefined) ?? null,
            },
            select: { id: true },
          });
          token.userId = user.id;
        }
        // GitHub login (handle), used to verify App-install ownership later.
        const login = (profile as { login?: unknown }).login;
        if (typeof login === "string") {
          token.githubLogin = login;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.userId = token.userId as string;
      }
      if (token.githubLogin) {
        session.githubLogin = token.githubLogin as string;
      }
      return session;
    },
  },
});
