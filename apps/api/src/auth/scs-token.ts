import { jwtVerify } from "jose";

/**
 * ShekseCodeSync token: a JWT the web app mints for a logged-in user and the
 * extension stores. The API verifies it here to resolve the real `userId`.
 * Signed HS256 with the shared `SCS_TOKEN_SECRET` (same value on web + api).
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
  return userId;
}
