import type {
  EnrichmentStatus,
  Level,
  Platform,
  SubmissionStatus,
  SubmissionSummary,
} from "@scs/types";

/** Structural shape of the DB row we map from (subset of the Prisma model). */
export interface SubmissionRow {
  id: string;
  title: string;
  slug: string;
  questionLink: string;
  platform: Platform;
  level: Level;
  language: string;
  status: SubmissionStatus;
  tags: string[];
  topics: string[];
  isMarkedForRevision: boolean;
  enrichment: EnrichmentStatus;
  repoPath: string | null;
  solvedAt: Date;
  analysis: { pattern: string } | null;
}

/** Map a DB row (with optional analysis) to the dashboard summary DTO. */
export function toSummary(row: SubmissionRow): SubmissionSummary {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    questionLink: row.questionLink,
    platform: row.platform,
    level: row.level,
    language: row.language,
    status: row.status,
    tags: row.tags,
    topics: row.topics,
    isMarkedForRevision: row.isMarkedForRevision,
    enrichment: row.enrichment,
    pattern: row.analysis?.pattern ?? null,
    synced: row.repoPath !== null,
    solvedAt: row.solvedAt,
  };
}
