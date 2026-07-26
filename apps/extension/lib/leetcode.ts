import { CaptureSubmission, type Level } from "@scs/types";

/** Shape of a problem as returned by LeetCode's `question` GraphQL query. */
export interface LeetCodeQuestion {
  questionId: string;
  title: string;
  titleSlug: string;
  difficulty: string; // "Easy" | "Medium" | "Hard"
  content: string; // HTML statement
  topicTags: { name: string; slug: string }[];
}

/** An accepted submission's data, merged from the list + details queries. */
export interface LeetCodeSubmission {
  id: string;
  statusDisplay: string; // "Accepted"
  lang: string; // LeetCode language slug, e.g. "python3"
  runtime: string; // "64 ms" | "N/A"
  memory: string; // "17.2 MB" | "N/A"
  timestamp: number; // unix seconds
  code: string;
}

/** LeetCode language slug -> the normalized key our repo/file logic expects. */
const LANGUAGE_ALIASES: Record<string, string> = {
  python3: "python",
  python: "python",
  "c++": "cpp",
  cpp: "cpp",
  golang: "go",
  go: "go",
  javascript: "javascript",
  typescript: "typescript",
  csharp: "csharp",
  "c#": "csharp",
};

export function mapLanguage(lang: string): string {
  const key = lang.trim().toLowerCase();
  return LANGUAGE_ALIASES[key] ?? key;
}

export function mapDifficulty(difficulty: string): Level {
  switch (difficulty.trim().toLowerCase()) {
    case "easy":
      return "easy";
    case "medium":
      return "medium";
    case "hard":
      return "hard";
    default:
      throw new Error(`Unknown LeetCode difficulty "${difficulty}"`);
  }
}

/** Parse a LeetCode runtime string ("64 ms") to whole milliseconds. */
export function parseRuntimeMs(runtime: string): number | undefined {
  const match = /([\d.]+)\s*ms/i.exec(runtime);
  return match ? Math.round(Number(match[1])) : undefined;
}

/** Parse a LeetCode memory string ("17.2 MB" / "1024 KB") to whole kilobytes. */
export function parseMemoryKb(memory: string): number | undefined {
  const match = /([\d.]+)\s*(gb|mb|kb)/i.exec(memory);
  if (!match) return undefined;
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  const kb = unit === "gb" ? value * 1024 * 1024 : unit === "mb" ? value * 1024 : value;
  return Math.round(kb);
}

/**
 * Build (and validate) the shared CaptureSubmission payload from a LeetCode
 * question + its accepted submission. Throws if the result is malformed.
 */
export function buildCapture(
  question: LeetCodeQuestion,
  submission: LeetCodeSubmission,
): CaptureSubmission {
  return CaptureSubmission.parse({
    title: `${question.questionId}. ${question.title}`,
    questionLink: `https://leetcode.com/problems/${question.titleSlug}/`,
    platform: "leetcode",
    level: mapDifficulty(question.difficulty),
    statement: question.content,
    tags: [],
    topics: question.topicTags.map((t) => t.slug),
    companies: [],
    solution: { language: mapLanguage(submission.lang), code: submission.code },
    status: "accepted",
    runtimeMs: parseRuntimeMs(submission.runtime),
    memoryKb: parseMemoryKb(submission.memory),
    solvedAt: new Date(submission.timestamp * 1000),
  });
}

// --- GraphQL access (runs in the content script, same-origin with cookies) ---

const GRAPHQL_ENDPOINT = "https://leetcode.com/graphql";

const QUESTION_QUERY = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionId
      title
      titleSlug
      difficulty
      content
      topicTags { name slug }
    }
  }`;

const SUBMISSIONS_QUERY = `
  query submissionList($offset: Int!, $limit: Int!, $questionSlug: String!) {
    questionSubmissionList(offset: $offset, limit: $limit, questionSlug: $questionSlug) {
      submissions { id statusDisplay lang runtime memory timestamp }
    }
  }`;

const SUBMISSION_DETAILS_QUERY = `
  query submissionDetails($submissionId: Int!) {
    submissionDetails(submissionId: $submissionId) {
      code
      lang { name }
      runtimeDisplay
      memoryDisplay
      timestamp
    }
  }`;

async function graphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`LeetCode GraphQL request failed (${res.status})`);
  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
  if (json.errors?.length) throw new Error(json.errors[0].message);
  if (!json.data) throw new Error("LeetCode GraphQL returned no data");
  return json.data;
}

/**
 * Pull the most recent accepted submission for a problem and assemble a
 * CaptureSubmission. Throws a friendly error if nothing has been accepted yet.
 */
export async function pullCapture(titleSlug: string): Promise<CaptureSubmission> {
  const { question } = await graphql<{ question: LeetCodeQuestion | null }>(QUESTION_QUERY, {
    titleSlug,
  });
  if (!question) throw new Error(`Problem "${titleSlug}" not found on LeetCode.`);

  const { questionSubmissionList } = await graphql<{
    questionSubmissionList: { submissions: Omit<LeetCodeSubmission, "code">[] };
  }>(SUBMISSIONS_QUERY, { offset: 0, limit: 20, questionSlug: titleSlug });

  const accepted = questionSubmissionList.submissions.find(
    (s) => s.statusDisplay === "Accepted",
  );
  if (!accepted) {
    throw new Error("No accepted submission found for this problem yet. Solve it first.");
  }

  const { submissionDetails } = await graphql<{
    submissionDetails: {
      code: string;
      lang: { name: string };
      runtimeDisplay: string;
      memoryDisplay: string;
      timestamp: number;
    };
  }>(SUBMISSION_DETAILS_QUERY, { submissionId: Number(accepted.id) });

  return buildCapture(question, {
    ...accepted,
    code: submissionDetails.code,
    lang: submissionDetails.lang.name,
    runtime: submissionDetails.runtimeDisplay,
    memory: submissionDetails.memoryDisplay,
    timestamp: submissionDetails.timestamp || accepted.timestamp,
  });
}

/** Extract a LeetCode problem slug from a tab URL, or null if it isn't one. */
export function slugFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  const match = /^https:\/\/leetcode\.com\/problems\/([^/?#]+)/.exec(url);
  return match ? match[1] : null;
}
