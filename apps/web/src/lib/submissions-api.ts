import { type SubmissionSummary, SubmissionSummary as SummarySchema } from "@scs/types";

const apiBase = () => process.env.API_BASE_URL ?? "http://localhost:3001";

/** Fetch a user's submissions, optionally filtered/sorted for the Problems screen. */
export async function getSubmissions(
  token: string,
  query?: Record<string, string | undefined>,
): Promise<SubmissionSummary[]> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  try {
    const res = await fetch(`${apiBase()}/submissions${qs ? `?${qs}` : ""}`, {
      cache: "no-store",
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return SummarySchema.array().parse(await res.json());
  } catch {
    // API not reachable yet (e.g. during local scaffold) - render empty.
    return [];
  }
}

export interface SubmissionCode {
  language: string;
  code: string;
  analysis: { timeComplexity: string; spaceComplexity: string } | null;
}

/** Fetch a submission's captured code (+ AI complexity, once enriched), read back from GitHub. Null if unavailable. */
export async function getSubmissionCode(
  token: string,
  submissionId: string,
): Promise<SubmissionCode | null> {
  try {
    const res = await fetch(`${apiBase()}/submissions/${submissionId}/code`, {
      cache: "no-store",
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return (await res.json()) as SubmissionCode;
  } catch {
    return null;
  }
}
