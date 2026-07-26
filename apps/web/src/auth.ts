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
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID ?? "",
      clientSecret: process.env.AUTH_GITHUB_SECRET ?? "",
    }),
  ],
  callbacks: {
    async jwt({ token, profile }) {
      // Runs with `profile` only on initial sign-in; resolve our User row then.
      if (profile?.email) {
        const user = await prisma.user.upsert({
          where: { email: profile.email },
          update: { name: (profile.name as string | undefined) ?? undefined },
          create: {
            email: profile.email,
            name: (profile.name as string | undefined) ?? null,
          },
          select: { id: true },
        });
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.userId) {
        session.userId = token.userId as string;
      }
      return session;
    },
  },
});
