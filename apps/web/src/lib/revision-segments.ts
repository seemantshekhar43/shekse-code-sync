import type { RevisionQueueItem } from "@scs/types";

const DUE_SOON_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export type RevisionSegments = {
  dueNow: RevisionQueueItem[];
  dueSoon: RevisionQueueItem[];
  upcoming: RevisionQueueItem[];
};

/** Splits a full (unfiltered) revision queue into due now / due soon (next 3 days) / upcoming. */
export function segmentQueue(items: RevisionQueueItem[], now: Date): RevisionSegments {
  const dueSoonCutoff = new Date(now.getTime() + DUE_SOON_WINDOW_MS);

  const dueNow: RevisionQueueItem[] = [];
  const dueSoon: RevisionQueueItem[] = [];
  const upcoming: RevisionQueueItem[] = [];

  for (const item of items) {
    if (item.dueAt === null || item.dueAt <= now) {
      dueNow.push(item);
    } else if (item.dueAt <= dueSoonCutoff) {
      dueSoon.push(item);
    } else {
      upcoming.push(item);
    }
  }

  return { dueNow, dueSoon, upcoming };
}

/** Average SM-2 ease across rated items, rounded to 1 decimal; null if none have been rated. */
export function averageEase(items: RevisionQueueItem[]): number | null {
  const rated = items.map((i) => i.ease).filter((e): e is number => e !== null);
  if (rated.length === 0) return null;
  return Math.round((rated.reduce((sum, e) => sum + e, 0) / rated.length) * 10) / 10;
}
