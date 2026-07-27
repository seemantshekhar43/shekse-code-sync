import type { InsightsSummary } from "@scs/types";

/** Rule-based observations derived from the same aggregates the charts render (see #51 for an LLM-generated version). */
export function generateObservations(summary: InsightsSummary): string[] {
  const notes: string[] = [];
  const top = summary.patternCoverage.slice(0, 2);

  if (top.length === 1) {
    notes.push(`You've leaned hardest into ${top[0].pattern} (${top[0].count} solve${top[0].count > 1 ? "s" : ""}) - your strongest coverage so far.`);
  } else if (top.length === 2) {
    notes.push(
      `You've leaned hardest into ${top[0].pattern} (${top[0].count} solve${top[0].count > 1 ? "s" : ""}) and ${top[1].pattern} (${top[1].count}) - your strongest coverage by far.`,
    );
  }

  if (summary.weakestPatterns.length > 0) {
    const list = summary.weakestPatterns.slice(0, 3).join(", ");
    const verb = summary.weakestPatterns.length === 1 ? "has" : "have";
    notes.push(`${list} ${verb} just one solve each; worth another rep before ${summary.weakestPatterns.length === 1 ? "it fades" : "they fade"} from revision.`);
  }

  if (summary.thisWeek !== summary.lastWeek) {
    const direction = summary.thisWeek > summary.lastWeek ? "picked up" : "slowed down";
    notes.push(`Pace ${direction} this week (${summary.thisWeek} vs ${summary.lastWeek} last week).`);
  } else if (summary.thisWeek > 0) {
    notes.push(`Steady pace - ${summary.thisWeek} solves this week, same as last week.`);
  }

  if (notes.length === 0) {
    notes.push("Solve and mark a few problems to start seeing patterns here.");
  }

  return notes;
}
