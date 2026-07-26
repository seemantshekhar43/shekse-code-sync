import { beforeAll, describe, expect, it } from "vitest";
import { mintInstallState, mintScsToken, verifyInstallState } from "./scs-token.js";

beforeAll(() => {
  process.env.SCS_TOKEN_SECRET = "test-secret-for-install-state";
});

describe("install-state nonce", () => {
  it("round-trips: a nonce minted for a user verifies back to that user's id", async () => {
    const state = await mintInstallState("user_abc");
    expect(await verifyInstallState(state)).toBe("user_abc");
  });

  it("rejects a tampered nonce (returns null)", async () => {
    const state = await mintInstallState("user_abc");
    const tampered = `${state.slice(0, -2)}xx`;
    expect(await verifyInstallState(tampered)).toBeNull();
  });

  it("rejects a nonce signed with a different secret", async () => {
    const state = await mintInstallState("user_abc");
    process.env.SCS_TOKEN_SECRET = "a-different-secret";
    try {
      expect(await verifyInstallState(state)).toBeNull();
    } finally {
      process.env.SCS_TOKEN_SECRET = "test-secret-for-install-state";
    }
  });

  it("rejects a plain extension token (wrong audience) as an install nonce", async () => {
    const scsToken = await mintScsToken("user_abc");
    expect(await verifyInstallState(scsToken)).toBeNull();
  });
});
