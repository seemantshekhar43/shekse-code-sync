import { Injectable } from "@nestjs/common";
import { prisma } from "@scs/db";
import type { CalendarDay, InsightsSummary, Level, PatternCoverage } from "@scs/types";

const DAY_MS = 24 * 60 * 60 * 1000;

function utcDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Monday-start week boundary, in UTC. */
function startOfWeek(d: Date): Date {
  const day = d.getUTCDay();
  const diff = (day + 6) % 7; // days since Monday
  return new Date(startOfUtcDay(d).getTime() - diff * DAY_MS);
}

function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

@Injectable()
export class InsightsService {
  async summary(userId: string, year: number): Promise<InsightsSummary> {
    const submissions = await prisma.submission.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        level: true,
        solvedAt: true,
        analysis: { select: { pattern: true } },
      },
    });

    const now = new Date();
    const today = startOfUtcDay(now);
    const thisWeekStart = startOfWeek(now);
    const lastWeekStart = new Date(thisWeekStart.getTime() - 7 * DAY_MS);
    const thisMonthStart = startOfMonth(now);
    const lastMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));

    let todayCount = 0;
    let thisWeek = 0;
    let lastWeek = 0;
    let thisMonth = 0;
    let lastMonth = 0;
    const difficultyMix = { easy: 0, medium: 0, hard: 0 };
    const patternStats = new Map<string, { count: number; lastSolvedAt: Date }>();
    const dayBuckets = new Map<string, { count: number; submissions: { id: string; title: string; level: Level }[] }>();

    for (const s of submissions) {
      const solvedAt = s.solvedAt;
      difficultyMix[s.level] += 1;

      if (solvedAt >= today) todayCount += 1;
      if (solvedAt >= thisWeekStart) thisWeek += 1;
      else if (solvedAt >= lastWeekStart) lastWeek += 1;
      if (solvedAt >= thisMonthStart) thisMonth += 1;
      else if (solvedAt >= lastMonthStart) lastMonth += 1;

      const pattern = s.analysis?.pattern;
      if (pattern) {
        const existing = patternStats.get(pattern);
        if (existing) {
          existing.count += 1;
          if (solvedAt > existing.lastSolvedAt) existing.lastSolvedAt = solvedAt;
        } else {
          patternStats.set(pattern, { count: 1, lastSolvedAt: solvedAt });
        }
      }

      if (solvedAt.getUTCFullYear() === year) {
        const key = utcDateKey(solvedAt);
        const bucket = dayBuckets.get(key) ?? { count: 0, submissions: [] };
        bucket.count += 1;
        bucket.submissions.push({ id: s.id, title: s.title, level: s.level });
        dayBuckets.set(key, bucket);
      }
    }

    const patternCoverage: PatternCoverage[] = [...patternStats.entries()]
      .map(([pattern, stat]) => ({ pattern, count: stat.count, lastSolvedAt: stat.lastSolvedAt }))
      .sort((a, b) => b.count - a.count);
    const weakestPatterns = patternCoverage.filter((p) => p.count < 2).map((p) => p.pattern);

    const days: CalendarDay[] = [...dayBuckets.entries()]
      .map(([date, bucket]) => ({ date, count: bucket.count, submissions: bucket.submissions }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const activeDates = new Set(
      submissions.map((s) => utcDateKey(s.solvedAt)),
    );
    const { currentStreak, longestStreak } = computeStreaks(activeDates, now);

    return {
      today: todayCount,
      thisWeek,
      lastWeek,
      thisMonth,
      lastMonth,
      patternsTouched: patternCoverage.length,
      patternCoverage,
      weakestPatterns,
      difficultyMix,
      currentStreak,
      longestStreak,
      calendarYear: year,
      calendarTotal: days.reduce((sum, d) => sum + d.count, 0),
      activeDays: days.length,
      days,
    };
  }
}

/** Current streak (consecutive active days ending today or yesterday) and the longest ever. */
function computeStreaks(activeDates: Set<string>, now: Date): { currentStreak: number; longestStreak: number } {
  if (activeDates.size === 0) return { currentStreak: 0, longestStreak: 0 };

  const sorted = [...activeDates].sort();
  let longestStreak = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + "T00:00:00.000Z");
    const curr = new Date(sorted[i] + "T00:00:00.000Z");
    if (curr.getTime() - prev.getTime() === DAY_MS) {
      run += 1;
    } else {
      run = 1;
    }
    longestStreak = Math.max(longestStreak, run);
  }

  let cursor = startOfUtcDay(now);
  if (!activeDates.has(utcDateKey(cursor))) {
    cursor = new Date(cursor.getTime() - DAY_MS);
    if (!activeDates.has(utcDateKey(cursor))) return { currentStreak: 0, longestStreak };
  }
  let currentStreak = 0;
  while (activeDates.has(utcDateKey(cursor))) {
    currentStreak += 1;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }

  return { currentStreak, longestStreak };
}
