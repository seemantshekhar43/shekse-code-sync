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
