import { jwtVerify, SignJWT } from "jose";

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

const INSTALL_STATE_AUDIENCE = "scs:install-state";

/**
 * Mint a short-lived signed `state` nonce for the GitHub App install link. It
 * binds the install redirect to the user who initiated it (CSRF defense in
 * depth on top of the mandatory installation-account ownership check).
 */
export async function mintInstallState(userId: string): Promise<string> {
  const secret = process.env.SCS_TOKEN_SECRET;
  if (!secret) {
    throw new Error("SCS_TOKEN_SECRET is not set");
  }
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setAudience(INSTALL_STATE_AUDIENCE)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(new TextEncoder().encode(secret));
}

/** Verify an install `state` nonce, returning the userId it was minted for, or null. */
export async function verifyInstallState(token: string): Promise<string | null> {
  const secret = process.env.SCS_TOKEN_SECRET;
  if (!secret) {
    throw new Error("SCS_TOKEN_SECRET is not set");
  }
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret), {
      audience: INSTALL_STATE_AUDIENCE,
    });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
