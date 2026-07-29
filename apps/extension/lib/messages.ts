import type { CaptureSubmission } from "@scs/types";

/** Popup -> content script: pull the current problem's accepted submission. */
export const CAPTURE_REQUEST = "scs:capture-request" as const;

export interface CaptureRequest {
  type: typeof CAPTURE_REQUEST;
  slug: string;
}

export type CaptureResponse =
  | { ok: true; payload: CaptureSubmission }
  | { ok: false; error: string };

/**
 * Manifest V3 only injects static content scripts into tabs navigated after
 * the extension loads, so a LeetCode tab left open across an install/update
 * has no listener - sendMessage then throws this exact browser error.
 */
export function isMissingContentScriptError(err: unknown): boolean {
  return err instanceof Error && err.message.includes("Could not establish connection");
}
