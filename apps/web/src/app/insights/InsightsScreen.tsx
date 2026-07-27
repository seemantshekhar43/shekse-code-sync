import type { InsightsSummary } from "@scs/types";
import { CalendarHeatmap } from "./CalendarHeatmap";

const levelColor: Record<"easy" | "medium" | "hard", string> = {
  easy: "bg-green",
  medium: "bg-medium",
  hard: "bg-hard",
};

export function InsightsScreen({ summary, observations }: { summary: InsightsSummary; observations: string[] }) {
  const maxCount = summary.patternCoverage[0]?.count ?? 1;
  const { easy, medium, hard } = summary.difficultyMix;
  const totalGraded = easy + medium + hard;

  return (
    <>
      <div className="mb-4">
        <CalendarHeatmap
          year={summary.calendarYear}
          days={summary.days}
          total={summary.calendarTotal}
          activeDays={summary.activeDays}
          currentStreak={summary.currentStreak}
          longestStreak={summary.longestStreak}
        />
      </div>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <div className="rounded-card border border-border bg-surface px-5 py-5">
          <div className="mb-4 flex items-baseline justify-between">
            <span className="text-[13.5px] font-semibold">Pattern coverage</span>
            <span className="text-[11px] text-faint">by solves, all time</span>
          </div>
          {summary.patternCoverage.length === 0 ? (
            <p className="text-[13px] italic text-faint">Solve a few problems to see your pattern coverage.</p>
          ) : (
            summary.patternCoverage.map((p) => (
              <div key={p.pattern} className="mb-2.5 grid grid-cols-[132px_1fr_28px] items-center gap-2.5 last:mb-0">
                <span className="truncate text-[12px] text-muted">{p.pattern}</span>
                <div className="h-4 overflow-hidden rounded bg-surface-2">
                  <div
                    className="h-full rounded bg-green"
                    style={{ width: `${Math.max((p.count / maxCount) * 100, 6)}%` }}
                    title={`${p.count} solve${p.count > 1 ? "s" : ""} · last solved ${p.lastSolvedAt.toLocaleDateString()}`}
                  />
                </div>
                <span className="text-right font-mono text-[11.5px] text-muted">{p.count}</span>
              </div>
            ))
          )}
        </div>

        <div className="rounded-card border border-border bg-surface px-5 py-5">
          <div className="mb-4 flex items-baseline justify-between">
            <span className="text-[13.5px] font-semibold">Difficulty mix</span>
            <span className="text-[11px] text-faint">all time</span>
          </div>
          {totalGraded === 0 ? (
            <p className="text-[13px] italic text-faint">No graded solves yet.</p>
          ) : (
            <>
              <div className="flex h-7 overflow-hidden rounded-md">
                {(
                  [
                    ["easy", easy],
                    ["medium", medium],
                    ["hard", hard],
                  ] as const
                )
                  .filter(([, count]) => count > 0)
                  .map(([level, count], i) => (
                    <div
                      key={level}
                      className={`flex items-center justify-center text-[11px] font-bold text-white ${levelColor[level]} ${i > 0 ? "border-l-2 border-surface" : ""}`}
                      style={{ width: `${(count / totalGraded) * 100}%` }}
                    >
                      {count}
                    </div>
                  ))}
              </div>
              <div className="mt-3 flex gap-4 text-[11.5px] text-muted">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-green" />
                  Easy · {easy}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-medium" />
                  Medium · {medium}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm bg-hard" />
                  Hard · {hard}
                </span>
              </div>
            </>
          )}

          {summary.weakestPatterns.length > 0 && (
            <>
              <div className="mb-2 mt-6 text-[13.5px] font-semibold">Weakest coverage</div>
              <p className="text-[12.5px] leading-relaxed text-muted">
                Patterns you&apos;ve seen fewer than 2 times:{" "}
                <b className="text-ink">{summary.weakestPatterns.join(", ")}</b>.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="rounded-card border border-green-soft bg-green-soft px-5 py-4.5">
        <div className="mb-2.5 text-[11px] font-semibold uppercase tracking-[.12em] text-green">AI insight</div>
        <ul className="list-disc space-y-2 pl-[18px] text-[13px] leading-relaxed">
          {observations.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </>
  );
}
