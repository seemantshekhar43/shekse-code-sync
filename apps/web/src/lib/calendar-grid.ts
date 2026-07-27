const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface CalendarCell {
  date: string; // YYYY-MM-DD (UTC)
  col: number;
  row: number;
}

function toDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** GitHub-style weekly grid: one cell per day of the year, column = week index, row = weekday (Sun=0). */
export function buildCalendarCells(year: number): CalendarCell[] {
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const gridStart = new Date(jan1.getTime() - jan1.getUTCDay() * DAY_MS);
  const dec31 = new Date(Date.UTC(year, 11, 31));

  const cells: CalendarCell[] = [];
  for (let d = new Date(jan1); d <= dec31; d = new Date(d.getTime() + DAY_MS)) {
    const daysFromStart = Math.round((d.getTime() - gridStart.getTime()) / DAY_MS);
    cells.push({ date: toDateKey(d), col: Math.floor(daysFromStart / 7), row: d.getUTCDay() });
  }
  return cells;
}

/** Column each month's first day falls in, for placing month labels above the grid. */
export function monthLabelColumns(year: number): { month: string; col: number }[] {
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const gridStart = new Date(jan1.getTime() - jan1.getUTCDay() * DAY_MS);

  return MONTH_NAMES.map((month, i) => {
    const monthStart = new Date(Date.UTC(year, i, 1));
    const col = Math.floor((monthStart.getTime() - gridStart.getTime()) / DAY_MS / 7);
    return { month, col };
  });
}

/** Bucket 0-4 for sequential color intensity; 0 = no activity. */
export function intensityLevel(count: number): 0 | 1 | 2 | 3 | 4 {
  return Math.min(count, 4) as 0 | 1 | 2 | 3 | 4;
}
