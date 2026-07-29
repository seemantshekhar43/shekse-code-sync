import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "ShekseCodeSync",
    description: "Capture your LeetCode submissions to ShekseCodeSync.",
    icons: {
      16: "icon/16.png",
      48: "icon/48.png",
      128: "icon/128.png",
    },
    permissions: ["storage", "tabs"],
    // leetcode.com: content-script GraphQL pull. localhost: dev API POST.
    // api.codesync.shekse.com: prod API host, once DNS/deploy is live.
    host_permissions: [
      "https://leetcode.com/*",
      "http://localhost:3001/*",
      "https://api.codesync.shekse.com/*",
    ],
  },
});
