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

/** AI-derived enrichment produced by the worker. */
export const Analysis = z.object({
  timeComplexity: z.string(), // e.g. "O(n log n)"
  spaceComplexity: z.string(),
  pattern: z.string(), // e.g. "sliding-window"
  optimizationNotes: z.string(),
});
export type Analysis = z.infer<typeof Analysis>;
