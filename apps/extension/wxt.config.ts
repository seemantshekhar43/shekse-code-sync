import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: ({ mode }) => ({
    name: "ShekseCodeSync",
    description: "Capture your LeetCode submissions to ShekseCodeSync.",
    icons: {
      16: "icon/16.png",
      48: "icon/48.png",
      128: "icon/128.png",
    },
    permissions: ["storage", "activeTab"],
    // leetcode.com: content-script GraphQL pull.
    // api-codesync.shekse.com: prod API host, live via a Cloudflare Tunnel.
    // localhost: dev-only API POST, excluded from production builds so the
    // published extension doesn't carry an unused host permission.
    host_permissions: [
      "https://leetcode.com/*",
      "https://api-codesync.shekse.com/*",
      ...(mode === "production" ? [] : ["http://localhost:3001/*"]),
    ],
  }),
});
