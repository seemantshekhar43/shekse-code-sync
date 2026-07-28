import { App } from "@octokit/app";
import type { CaptureSubmission } from "@scs/types";

const EXT: Record<string, string> = {
  python: "py",
  java: "java",
  javascript: "js",
  typescript: "ts",
  cpp: "cpp",
  "c++": "cpp",
  c: "c",
  csharp: "cs",
  go: "go",
  rust: "rs",
  kotlin: "kt",
  swift: "swift",
  ruby: "rb",
  scala: "scala",
  php: "php",
};

export function extForLanguage(language: string): string {
  return EXT[language.toLowerCase()] ?? "txt";
}

export function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

let app: App | undefined;

function getApp(): App {
  if (!app) {
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
    if (!appId || !privateKey) {
      throw new Error("GITHUB_APP_ID / GITHUB_APP_PRIVATE_KEY are not set");
    }
    app = new App({ appId, privateKey });
  }
  return app;
}

/** Get an Octokit scoped to a user's GitHub App installation (short-lived token). */
export async function getInstallationOctokit(installationId: number) {
  return getApp().getInstallationOctokit(installationId);
}

export interface InstallationRepo {
  owner: string;
  repo: string;
  fullName: string; // "owner/repo"
}

/** List an installation's accessible repositories using the given octokit client. */
export async function listInstallationReposWith(
  octokit: OctokitLike,
): Promise<InstallationRepo[]> {
  const res = await octokit.request("GET /installation/repositories", {
    per_page: 100,
  });
  const data = res.data as {
    repositories?: Array<{ name: string; owner: { login: string }; full_name: string }>;
  };
  return (data.repositories ?? []).map((r) => ({
    owner: r.owner.login,
    repo: r.name,
    fullName: r.full_name,
  }));
}

/**
 * List the repositories a user's installation can access, via its short-lived
 * installation token. Used by the web install callback to resolve which repo to
 * persist as the user's sync target.
 */
export async function listInstallationRepos(
  installationId: number,
): Promise<InstallationRepo[]> {
  const octokit = (await getInstallationOctokit(installationId)) as OctokitLike;
  return listInstallationReposWith(octokit);
}

export interface InstallationAccount {
  login: string;
  /** "User" or "Organization". */
  type: string;
}

/**
 * Read the account (user or org) a GitHub App installation belongs to, using the
 * given app-authenticated octokit client. Calls the APP-level endpoint, so the
 * client must be the App's own (JWT) octokit, not an installation-scoped one.
 */
export async function getInstallationAccountWith(
  octokit: OctokitLike,
  installationId: number,
): Promise<InstallationAccount> {
  const res = await octokit.request("GET /app/installations/{installation_id}", {
    installation_id: installationId,
  });
  const data = res.data as { account?: { login?: string; type?: string } | null };
  const account = data.account;
  if (!account?.login || !account.type) {
    throw new Error(`Installation ${installationId} has no resolvable account`);
  }
  return { login: account.login, type: account.type };
}

/**
 * Resolve which account a user's installation belongs to. Used by the web install
 * callback to verify the installing user actually owns the installation before
 * persisting it, closing the cross-account installation-hijacking hole.
 */
export async function getInstallationAccount(
  installationId: number,
): Promise<InstallationAccount> {
  const octokit = getApp().octokit as unknown as OctokitLike;
  return getInstallationAccountWith(octokit, installationId);
}

/**
 * Uninstall a GitHub App installation, using the given app-authenticated
 * octokit client. Calls the APP-level endpoint, so the client must be the
 * App's own (JWT) octokit, not an installation-scoped one.
 */
export async function uninstallInstallationWith(
  octokit: OctokitLike,
  installationId: number,
): Promise<void> {
  await octokit.request("DELETE /app/installations/{installation_id}", {
    installation_id: installationId,
  });
}

/**
 * Revoke a user's GitHub App installation entirely, so it no longer shows up
 * under their GitHub account. Used by the disconnect flow; callers should
 * treat a failure here as best-effort and still clear their own stored
 * association, since GitHub may have already dropped the installation.
 */
export async function uninstallInstallation(installationId: number): Promise<void> {
  const octokit = getApp().octokit as unknown as OctokitLike;
  await uninstallInstallationWith(octokit, installationId);
}

/** Split a stored `"owner/repo"` string into its parts. */
export function parseRepo(full: string): { owner: string; repo: string } {
  const [owner, repo, ...rest] = full.split("/");
  if (!owner || !repo || rest.length > 0) {
    throw new Error(`Invalid repo "${full}", expected "owner/repo"`);
  }
  return { owner, repo };
}

export interface RepoFile {
  path: string;
  content: string;
}

export interface CommitFilesParams {
  installationId: number;
  owner: string;
  repo: string;
  slug: string;
  files: RepoFile[];
  message: string;
}

/**
 * Minimal shape of the octokit client we use, so the commit logic can be
 * unit-tested with a fake in place of a real installation client.
 */
export interface OctokitLike {
  request(
    route: string,
    params: Record<string, unknown>,
  ): Promise<{ data: unknown }>;
}

/** Look up an existing file's blob sha, or `undefined` if it doesn't exist yet. */
async function getFileSha(
  octokit: OctokitLike,
  owner: string,
  repo: string,
  path: string,
): Promise<string | undefined> {
  try {
    const res = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
      owner,
      repo,
      path,
    });
    // A file returns an object carrying `sha`; a directory returns an array.
    const data = res.data as { sha?: string } | unknown[];
    return Array.isArray(data) ? undefined : data.sha;
  } catch (err) {
    if ((err as { status?: number }).status === 404) return undefined;
    throw err;
  }
}

/**
 * Commit the files for one problem under `<slug>/` in the user's repo, using the
 * provided octokit client. Each file is upserted: on an existing path we pass its
 * blob `sha` so the Contents API updates instead of rejecting with 422.
 */
export async function commitFilesWith(
  octokit: OctokitLike,
  params: CommitFilesParams,
): Promise<void> {
  for (const file of params.files) {
    const path = `${params.slug}/${file.path}`;
    const sha = await getFileSha(octokit, params.owner, params.repo, path);
    await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
      owner: params.owner,
      repo: params.repo,
      path,
      message: params.message,
      content: Buffer.from(file.content, "utf8").toString("base64"),
      ...(sha ? { sha } : {}),
    });
  }
}

/** Commit a problem's files to the user's repo via their GitHub App installation. */
export async function commitFiles(params: CommitFilesParams): Promise<void> {
  const octokit = (await getInstallationOctokit(params.installationId)) as OctokitLike;
  await commitFilesWith(octokit, params);
}

/** Read and decode a single file's UTF-8 contents from a repo. */
export async function getFileContentWith(
  octokit: OctokitLike,
  owner: string,
  repo: string,
  path: string,
): Promise<string> {
  const res = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
    owner,
    repo,
    path,
  });
  const data = res.data as { content?: string; encoding?: string };
  if (Array.isArray(data) || typeof data.content !== "string") {
    throw new Error(`Expected a file at ${path}, got a directory or missing content`);
  }
  const encoding = data.encoding === "base64" ? "base64" : "utf8";
  return Buffer.from(data.content, encoding).toString("utf8");
}

export interface ReadSubmissionParams {
  installationId: number;
  owner: string;
  repo: string;
  slug: string;
  language: string;
}

/** Read back a problem's statement + solution code from the user's repo. */
export async function readSubmissionFiles(
  params: ReadSubmissionParams,
): Promise<{ statement: string; code: string }> {
  const octokit = (await getInstallationOctokit(params.installationId)) as OctokitLike;
  const [statement, code] = await Promise.all([
    getFileContentWith(octokit, params.owner, params.repo, `${params.slug}/question.md`),
    getFileContentWith(
      octokit,
      params.owner,
      params.repo,
      `${params.slug}/solution.${extForLanguage(params.language)}`,
    ),
  ]);
  return { statement, code };
}

/** Build the GitHub files (question.md, solution.<ext>, meta.json) for a capture. */
export function buildSubmissionFiles(sub: CaptureSubmission): RepoFile[] {
  const meta = {
    title: sub.title,
    questionLink: sub.questionLink,
    platform: sub.platform,
    level: sub.level,
    language: sub.solution.language,
    tags: sub.tags,
    topics: sub.topics,
    companies: sub.companies,
    status: sub.status,
    solvedAt: sub.solvedAt.toISOString(),
  };
  return [
    { path: "question.md", content: sub.statement },
    { path: `solution.${extForLanguage(sub.solution.language)}`, content: sub.solution.code },
    { path: "meta.json", content: JSON.stringify(meta, null, 2) },
  ];
}
