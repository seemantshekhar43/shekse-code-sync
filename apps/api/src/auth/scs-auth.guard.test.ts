import type { ExecutionContext } from "@nestjs/common";
import { UnauthorizedException } from "@nestjs/common";
import { SignJWT } from "jose";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@scs/db", () => ({
  prisma: { user: { findUniqueOrThrow: vi.fn().mockResolvedValue({ tokenVersion: 0 }) } },
}));

import { prisma } from "@scs/db";
import { ScsAuthGuard } from "./scs-auth.guard.js";

const SECRET = "test-secret-value";

function ctxWithAuth(header?: string): { ctx: ExecutionContext; req: { userId?: string } } {
  const req: { headers: Record<string, string>; userId?: string } = {
    headers: header ? { authorization: header } : {},
  };
  const ctx = {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
  return { ctx, req };
}

async function mint(sub: string, ver = 0, secret = SECRET): Promise<string> {
  return new SignJWT({ ver })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(sub)
    .sign(new TextEncoder().encode(secret));
}

describe("ScsAuthGuard", () => {
  const guard = new ScsAuthGuard();

  beforeEach(() => {
    process.env.SCS_TOKEN_SECRET = SECRET;
    vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue({ tokenVersion: 0 } as never);
  });

  it("resolves the userId from a valid bearer token", async () => {
    const { ctx, req } = ctxWithAuth(`Bearer ${await mint("user_123")}`);
    await expect(guard.canActivate(ctx)).resolves.toBe(true);
    expect(req.userId).toBe("user_123");
  });

  it("rejects a missing token", async () => {
    const { ctx } = ctxWithAuth();
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects a non-bearer scheme", async () => {
    const { ctx } = ctxWithAuth("Basic abc");
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects a token signed with a different secret", async () => {
    const { ctx } = ctxWithAuth(`Bearer ${await mint("user_123", 0, "wrong-secret")}`);
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects a token whose version no longer matches the user's current tokenVersion", async () => {
    vi.mocked(prisma.user.findUniqueOrThrow).mockResolvedValue({ tokenVersion: 1 } as never);
    const { ctx } = ctxWithAuth(`Bearer ${await mint("user_123", 0)}`);
    await expect(guard.canActivate(ctx)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
