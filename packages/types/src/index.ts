import { z } from "zod";

/** Platforms we capture from. */
export const Platform = z.enum(["leetcode", "neetcode", "manual"]);
export type Platform = z.infer<typeof Platform>;

/** Problem difficulty. */
export const Level = z.enum(["easy", "medium", "hard"]);
export type Level = z.infer<typeof Level>;

/** Outcome of a submission. */
export const SubmissionStatus = z.enum(["accepted", "wrong", "tle", "runtime_error"]);
export type SubmissionStatus = z.infer<typeof SubmissionStatus>;

/** A single solution in one language. */
export const Solution = z.object({
  language: z.string(), // e.g. "python", "java" - drives the file extension
  code: z.string(),
});
export type Solution = z.infer<typeof Solution>;

/**
 * The core payload the plugin (or manual form) sends to the API.
 * This is the single source of truth shared across extension, api, worker, and web.
 */
export const CaptureSubmission = z.object({
  title: z.string(),
  questionLink: z.string().url(),
  platform: Platform,
  level: Level,
  statement: z.string(), // markdown question body
  tags: z.array(z.string()).default([]),
  topics: z.array(z.string()).default([]),
  companies: z.array(z.string()).default([]),
  solution: Solution,
  status: SubmissionStatus,
  runtimeMs: z.number().int().nonnegative().optional(),
  memoryKb: z.number().int().nonnegative().optional(),
  solvedAt: z.coerce.date(),
});
export type CaptureSubmission = z.infer<typeof CaptureSubmission>;

/** Enrichment lifecycle of a submission's AI analysis. */
export const EnrichmentStatus = z.enum(["pending", "done", "failed"]);
export type EnrichmentStatus = z.infer<typeof EnrichmentStatus>;

/** Row shape returned by the list endpoint and rendered on the dashboard. */
export const SubmissionSummary = z.object({
  id: z.string(),
  title: z.string(),
  slug: z.string(),
  questionLink: z.string(),
  platform: Platform,
  level: Level,
  language: z.string(),
  status: SubmissionStatus,
  tags: z.array(z.string()),
  topics: z.array(z.string()),
  isMarkedForRevision: z.boolean(),
  enrichment: EnrichmentStatus,
  pattern: z.string().nullable(),
  /** Whether the problem's files have actually been committed to the user's GitHub repo. */
  synced: z.boolean(),
  solvedAt: z.coerce.date(),
});
export type SubmissionSummary = z.infer<typeof SubmissionSummary>;

/** Sortable columns on the Problems screen. */
export const SubmissionSortBy = z.enum(["title", "solvedAt"]);
export type SubmissionSortBy = z.infer<typeof SubmissionSortBy>;

/** Query params for filtering/sorting `GET /submissions`. All optional; an absent query returns everything, newest first, for backward compatibility with the overview. */
export const SubmissionQuery = z.object({
  platform: Platform.optional(),
  level: Level.optional(),
  pattern: z.string().optional(),
  language: z.string().optional(),
  synced: z
    .enum(["true", "false"])
    .transform((v) => v === "true")
    .optional(),
  q: z.string().optional(),
  sortBy: SubmissionSortBy.default("solvedAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
export type SubmissionQuery = z.infer<typeof SubmissionQuery>;

/** AI-derived enrichment produced by the worker. */
export const Analysis = z.object({
  timeComplexity: z.string(), // e.g. "O(n log n)"
  spaceComplexity: z.string(),
  pattern: z.string(), // e.g. "sliding-window"
  optimizationNotes: z.string(),
});
export type Analysis = z.infer<typeof Analysis>;

/** Toggle a submission's revision flag (Problems screen mark/unmark action). */
export const SetRevisionFlag = z.object({
  isMarkedForRevision: z.boolean(),
});
export type SetRevisionFlag = z.infer<typeof SetRevisionFlag>;

/** Self-graded recall quality for a revision attempt, Anki/SM-2 style: 0 = blackout, 5 = perfect. */
export const RevisionRating = z.number().int().min(0).max(5);
export type RevisionRating = z.infer<typeof RevisionRating>;

/** Body for `POST /revisions` - record a rated revision attempt. */
export const RecordRevisionAttempt = z.object({
  submissionId: z.string(),
  selfRating: RevisionRating,
});
export type RecordRevisionAttempt = z.infer<typeof RecordRevisionAttempt>;

/** The SRS state produced by rating a revision attempt. */
export const RevisionAttemptResult = z.object({
  ease: z.number(),
  intervalDays: z.number().int(),
  dueAt: z.coerce.date(),
});
export type RevisionAttemptResult = z.infer<typeof RevisionAttemptResult>;

/** One item on the revision queue: a submission marked for revision. */
export const RevisionQueueItem = z.object({
  submissionId: z.string(),
  title: z.string(),
  questionLink: z.string(),
  pattern: z.string().nullable(),
  level: Level,
  /** Null means never rated - first attempt is immediately due. */
  dueAt: z.coerce.date().nullable(),
  /** SM-2 state from the latest attempt; null when never rated. */
  ease: z.number().nullable(),
  intervalDays: z.number().int().nullable(),
});
export type RevisionQueueItem = z.infer<typeof RevisionQueueItem>;

/** One pattern's solve count and last-solved date, for the Insights coverage chart. */
export const PatternCoverage = z.object({
  pattern: z.string(),
  count: z.number().int(),
  lastSolvedAt: z.coerce.date(),
});
export type PatternCoverage = z.infer<typeof PatternCoverage>;

/** One solved submission on a calendar day, for the Insights day-detail drill-down. */
export const CalendarDaySubmission = z.object({
  id: z.string(),
  title: z.string(),
  level: Level,
  synced: z.boolean(),
});
export type CalendarDaySubmission = z.infer<typeof CalendarDaySubmission>;

/** One day's activity in the Insights calendar heatmap. */
export const CalendarDay = z.object({
  date: z.string(), // YYYY-MM-DD (UTC)
  count: z.number().int(),
  submissions: z.array(CalendarDaySubmission),
});
export type CalendarDay = z.infer<typeof CalendarDay>;

/** Aggregate practice stats for the Insights screen. */
export const InsightsSummary = z.object({
  today: z.number().int(),
  thisWeek: z.number().int(),
  lastWeek: z.number().int(),
  thisMonth: z.number().int(),
  lastMonth: z.number().int(),
  patternsTouched: z.number().int(),
  patternCoverage: z.array(PatternCoverage),
  weakestPatterns: z.array(z.string()),
  difficultyMix: z.object({ easy: z.number().int(), medium: z.number().int(), hard: z.number().int() }),
  currentStreak: z.number().int(),
  longestStreak: z.number().int(),
  calendarYear: z.number().int(),
  calendarTotal: z.number().int(),
  activeDays: z.number().int(),
  days: z.array(CalendarDay),
});
export type InsightsSummary = z.infer<typeof InsightsSummary>;
