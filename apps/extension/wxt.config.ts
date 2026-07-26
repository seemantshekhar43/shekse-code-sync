import { defineConfig } from "wxt";

export default defineConfig({
  modules: ["@wxt-dev/module-react"],
  manifest: {
    name: "ShekseCodeSync",
    description: "Capture your LeetCode submissions to ShekseCodeSync.",
    permissions: ["storage", "tabs"],
    // leetcode.com: content-script GraphQL pull. localhost: dev API POST.
    // Point the popup's API URL elsewhere and add that host here to deploy.
    host_permissions: ["https://leetcode.com/*", "http://localhost:3001/*"],
  },
});
