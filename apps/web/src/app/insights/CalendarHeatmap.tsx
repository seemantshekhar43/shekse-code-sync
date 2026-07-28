"use client";

import { useMemo, useState } from "react";
import type { CalendarDay } from "@scs/types";
import { pillClass } from "../../lib/dashboard-format";
import { buildCalendarCells, intensityLevel, monthLabelColumns } from "../../lib/calendar-grid";

// Tailwind can't derive an opacity-modifier utility (bg-green/30) from a plain
// `var(--green)` color token, so the sequential ramp uses literal rgba steps instead.
const levelClass: Record<number, string> = {
  0: "bg-surface-2",
  1: "bg-[rgba(26,107,90,0.30)]",
  2: "bg-[rgba(26,107,90,0.55)]",
  3: "bg-[rgba(26,107,90,0.80)]",
  4: "bg-green",
};

const dayLabels = ["", "Mon", "", "Wed", "", "Fri", ""];

export function CalendarHeatmap({
  year,
  days,
  total,
  activeDays,
  currentStreak,
  longestStreak,
}: {
  year: number;
  days: CalendarDay[];
  total: number;
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
}) {
  const [selected, setSelected] = useState<CalendarDay | null>(null);
  const dayMap = useMemo(() => new Map(days.map((d) => [d.date, d])), [days]);
  const cells = useMemo(() => buildCalendarCells(year), [year]);
  const months = useMemo(() => monthLabelColumns(year), [year]);
  const columns = Math.max(...cells.map((c) => c.col)) + 1;

  return (
    <div className="rounded-card border border-border bg-surface px-5 py-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2.5">
        <div className="text-[15px]">
          <b className="font-bold">{total}</b> submissions in <b className="font-bold">{year}</b>
        </div>
        <div className="flex gap-5 text-[12.5px] text-muted">
          <span>
            <b className="font-bold text-ink">{activeDays}</b> active days
          </span>
          <span>
            <b className="font-bold text-ink">{currentStreak}</b> current streak
          </span>
          <span>
            <b className="font-bold text-ink">{longestStreak}</b> max streak
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div
          className="grid gap-[3px]"
          style={{
            gridTemplateColumns: `34px repeat(${columns}, 12px)`,
            gridTemplateRows: `16px repeat(7, 12px)`,
            minWidth: 700,
          }}
        >
          {months.map(({ month, col }) => (
            <div
              key={month}
              className="font-mono text-[10px] text-faint"
              style={{ gridColumn: col + 2, gridRow: 1 }}
            >
              {month}
            </div>
          ))}
          {dayLabels.map((label, row) =>
            label ? (
              <div
                key={label}
                className="self-center font-mono text-[10px] text-faint"
                style={{ gridColumn: 1, gridRow: row + 2 }}
              >
                {label}
              </div>
            ) : null,
          )}
          {cells.map((cell) => {
            const day = dayMap.get(cell.date);
            const count = day?.count ?? 0;
            const clickable = count > 0;
            return (
              <button
                key={cell.date}
                type="button"
                disabled={!clickable}
                onClick={() => day && setSelected(day)}
                title={count === 0 ? `No solves · ${cell.date}` : `${count} solve${count > 1 ? "s" : ""} · ${cell.date}`}
                className={`h-3 w-3 rounded-[2.5px] ${levelClass[intensityLevel(count)]} ${
                  clickable ? "cursor-pointer hover:outline hover:outline-2 hover:outline-ink" : "cursor-default"
                }`}
                style={{ gridColumn: cell.col + 2, gridRow: cell.row + 2 }}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-3.5 flex items-center gap-1.5 text-[11px] text-faint">
        <span>Less</span>
        <span className={`h-3 w-3 rounded-[2.5px] ${levelClass[0]}`} />
        <span className={`h-3 w-3 rounded-[2.5px] ${levelClass[1]}`} />
        <span className={`h-3 w-3 rounded-[2.5px] ${levelClass[2]}`} />
        <span className={`h-3 w-3 rounded-[2.5px] ${levelClass[3]}`} />
        <span className={`h-3 w-3 rounded-[2.5px] ${levelClass[4]}`} />
        <span>More</span>
      </div>
      <p className="mt-2.5 text-[11px] italic text-faint">
        Hover a day for its count, click a lit day to see what you solved.
      </p>

      {selected && (
        <div className="mt-3.5 rounded-lg border border-border bg-paper px-3.5 py-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[11.5px] font-semibold text-muted">{selected.date}</span>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-faint hover:text-hard"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
          <ul>
            {selected.submissions.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-2 border-b border-border py-1.5 text-[12.5px] last:border-b-0"
              >
                {s.synced ? (
                  <a href={`/problems/${s.id}/code`} className="hover:underline">
                    {s.title}
                  </a>
                ) : (
                  <span>{s.title}</span>
                )}
                <span className={`shrink-0 rounded-pill px-2 py-0.5 text-[10px] font-semibold ${pillClass[s.level]}`}>
                  {s.level}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
