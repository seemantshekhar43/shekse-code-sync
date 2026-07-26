import { SignJWT } from "jose";

/**
 * Mint a ShekseCodeSync token for the extension: a JWT carrying the user's id
 * as `sub`, signed HS256 with the shared `SCS_TOKEN_SECRET`. Long-lived because
 * it is pasted into the extension; revocation is by rotating the secret.
 */
export async function mintScsToken(userId: string): Promise<string> {
  const secret = process.env.SCS_TOKEN_SECRET;
  if (!secret) {
    throw new Error("SCS_TOKEN_SECRET is not set");
  }
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(new TextEncoder().encode(secret));
}
