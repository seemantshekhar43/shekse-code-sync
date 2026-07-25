export default defineContentScript({
  matches: ["https://leetcode.com/*", "https://neetcode.io/*"],
  main() {
    // eslint-disable-next-line no-console
    console.log("ShekseCodeSync content script active");
    // TODO: detect an accepted submission (GraphQL/DOM) and POST a
    // CaptureSubmission payload to the API.
  },
});
