import { describe, expect, it } from "vitest";
import { isMissingContentScriptError } from "./messages.js";

describe("isMissingContentScriptError", () => {
  it("matches the browser error thrown when a tab has no content script listener", () => {
    const err = new Error("Could not establish connection. Receiving end does not exist.");
    expect(isMissingContentScriptError(err)).toBe(true);
  });

  it("does not match unrelated errors", () => {
    expect(isMissingContentScriptError(new Error("network timeout"))).toBe(false);
  });

  it("does not match non-Error values", () => {
    expect(isMissingContentScriptError("Could not establish connection")).toBe(false);
  });
});
