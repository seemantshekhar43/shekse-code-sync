import { prisma } from "@scs/db";
import { jwtVerify } from "jose";

/**
 * ShekseCodeSync token: a JWT the web app mints for a logged-in user and the
 * extension stores. The API verifies it here to resolve the real `userId`.
 * Signed HS256 with the shared `SCS_TOKEN_SECRET` (same value on web + api).
 *
 * The token's `ver` claim must match the user's current `tokenVersion` row -
 * this is what lets disconnect (or any future "revoke my token" action) bump
 * `tokenVersion` and invalidate every previously-issued token immediately,
 * without rotating the shared secret for every user.
 */
export async function verifyScsToken(token: string): Promise<string> {
  const secret = process.env.SCS_TOKEN_SECRET;
  if (!secret) {
    throw new Error("SCS_TOKEN_SECRET is not set");
  }
  const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
    algorithms: ["HS256"],
  });
  const userId = payload.sub;
  if (typeof userId !== "string" || userId.length === 0) {
    throw new Error("Token has no subject");
  }
  const tokenVersion = payload.ver;
  if (typeof tokenVersion !== "number") {
    throw new Error("Token has no version");
  }
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { tokenVersion: true },
  });
  if (user.tokenVersion !== tokenVersion) {
    throw new Error("Token has been revoked");
  }
  return userId;
}
