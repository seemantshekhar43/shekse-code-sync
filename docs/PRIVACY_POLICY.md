# ShekseCodeSync Privacy Policy

_Last updated: 2026-07-29_

ShekseCodeSync (the "Extension") captures your accepted LeetCode submissions and
syncs them to your own ShekseCodeSync account and GitHub repository. This policy
describes what data the Extension handles and how.

## What the Extension reads

When you accept a submission on `leetcode.com`, the Extension's content script
reads, from LeetCode's own page data:

- The problem: title, slug, difficulty, statement, and topic tags.
- Your submission: language, source code, runtime, memory usage, and the
  accepted timestamp.

The Extension does not read anything else on `leetcode.com` and does not run on
any other site.

## What the Extension stores and sends

- **Locally (`browser.storage.local`)**: your configured ShekseCodeSync API URL
  and your account access token, so the Extension can authenticate without
  asking you to sign in every time.
- **Sent to your ShekseCodeSync API**: the problem and submission data above,
  over HTTPS, authenticated with your token. The API stores this in its
  database and pushes a copy (question + solution) to the GitHub repository
  you connected. If AI enrichment is enabled on your account, your submitted
  code and problem text are also sent to the configured AI provider (Anthropic
  by default) to generate complexity/pattern analysis.

The Extension never sends data to any third party other than the
ShekseCodeSync API you've configured, and it never sells or shares your data.

## What the Extension does not do

- No advertising, tracking pixels, or analytics SDKs.
- No access to browsing history, other tabs, or sites other than
  `leetcode.com`.
- No credentials are collected by the Extension itself; GitHub access is
  authorized separately through your ShekseCodeSync account (a GitHub App
  installation), not through the Extension.

## Data retention and deletion

Your submission data lives in your own GitHub repository (which you control)
and in the ShekseCodeSync database tied to your account. To remove it, delete
the relevant files/commits from your repository and contact the maintainer (or
use in-app account deletion, once available) to remove your database records.

## Permissions justification

- `storage` - persist your API URL and access token locally.
- `tabs` - detect when you're on a LeetCode submission page.
- `host_permissions` for `leetcode.com` - read problem/submission data via
  LeetCode's page.
- `host_permissions` for the ShekseCodeSync API host - send captured
  submissions to your account.

## Contact

Questions about this policy: open an issue on the
[ShekseCodeSync GitHub repository](https://github.com/seemantshekhar43/shekse-code-sync).
