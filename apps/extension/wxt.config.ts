import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "ShekseCodeSync",
    description: "Capture your LeetCode / NeetCode submissions to ShekseCodeSync.",
    permissions: ["storage"],
    host_permissions: ["https://leetcode.com/*", "https://neetcode.io/*"],
  },
});
