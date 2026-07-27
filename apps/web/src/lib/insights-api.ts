import { type InsightsSummary, InsightsSummary as InsightsSummarySchema } from "@scs/types";

const apiBase = () => process.env.API_BASE_URL ?? "http://localhost:3001";

const empty = (year: number): InsightsSummary => ({
  today: 0,
  thisWeek: 0,
  lastWeek: 0,
  thisMonth: 0,
  lastMonth: 0,
  patternsTouched: 0,
  patternCoverage: [],
  weakestPatterns: [],
  difficultyMix: { easy: 0, medium: 0, hard: 0 },
  currentStreak: 0,
  longestStreak: 0,
  calendarYear: year,
  calendarTotal: 0,
  activeDays: 0,
  days: [],
});

/** Fetch the signed-in user's aggregate practice stats for the Insights screen. */
export async function getInsightsSummary(token: string, year: number): Promise<InsightsSummary> {
  try {
    const res = await fetch(`${apiBase()}/insights?year=${year}`, {
      cache: "no-store",
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) return empty(year);
    return InsightsSummarySchema.parse(await res.json());
  } catch {
    // API not reachable yet (e.g. during local scaffold) - render empty.
    return empty(year);
  }
}
