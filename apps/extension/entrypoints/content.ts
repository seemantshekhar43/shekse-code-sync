import { pullCapture } from "../lib/leetcode.js";
import { CAPTURE_REQUEST, type CaptureRequest, type CaptureResponse } from "../lib/messages.js";

export default defineContentScript({
  matches: ["https://leetcode.com/*"],
  main() {
    // The content script runs same-origin with leetcode.com, so its GraphQL
    // fetches carry the user's session cookies. The popup asks it to pull the
    // current problem's latest accepted submission.
    browser.runtime.onMessage.addListener((message: unknown) => {
      const request = message as CaptureRequest;
      if (request?.type !== CAPTURE_REQUEST) return undefined;
      return pullCapture(request.slug)
        .then((payload): CaptureResponse => ({ ok: true, payload }))
        .catch((err): CaptureResponse => ({ ok: false, error: (err as Error).message }));
    });
  },
});
