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
 * Commit the files for one problem under `<slug>/` in the user's repo.
 * NOTE (scaffold): this uses the Contents API create path; updating an existing
 * file requires passing its blob `sha`. Wire that in when the capture flow lands.
 */
export async function commitFiles(params: CommitFilesParams): Promise<void> {
  const octokit = await getInstallationOctokit(params.installationId);
  for (const file of params.files) {
    await octokit.request("PUT /repos/{owner}/{repo}/contents/{path}", {
      owner: params.owner,
      repo: params.repo,
      path: `${params.slug}/${file.path}`,
      message: params.message,
      content: Buffer.from(file.content, "utf8").toString("base64"),
    });
  }
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
