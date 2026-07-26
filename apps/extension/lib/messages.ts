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
