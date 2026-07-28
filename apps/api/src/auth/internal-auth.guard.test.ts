import type { ExecutionContext } from "@nestjs/common";
import { UnauthorizedException } from "@nestjs/common";
import { beforeEach, describe, expect, it } from "vitest";
import { InternalAuthGuard } from "./internal-auth.guard.js";

function ctxWithSecret(header?: string): ExecutionContext {
  const req = { headers: header ? { "x-internal-secret": header } : {} };
  return {
    switchToHttp: () => ({ getRequest: () => req }),
  } as unknown as ExecutionContext;
}

describe("InternalAuthGuard", () => {
  const guard = new InternalAuthGuard();

  beforeEach(() => {
    process.env.INTERNAL_API_SECRET = "test-internal-secret";
  });

  it("allows a request carrying the correct secret", () => {
    expect(guard.canActivate(ctxWithSecret("test-internal-secret"))).toBe(true);
  });

  it("rejects a missing secret", () => {
    expect(() => guard.canActivate(ctxWithSecret())).toThrow(UnauthorizedException);
  });

  it("rejects a wrong secret", () => {
    expect(() => guard.canActivate(ctxWithSecret("wrong"))).toThrow(UnauthorizedException);
  });

  it("rejects every request when INTERNAL_API_SECRET is unset", () => {
    delete process.env.INTERNAL_API_SECRET;
    expect(() => guard.canActivate(ctxWithSecret("anything"))).toThrow(UnauthorizedException);
  });
});
