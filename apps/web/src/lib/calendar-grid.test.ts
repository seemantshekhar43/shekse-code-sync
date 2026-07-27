import { describe, expect, it } from "vitest";
import { buildCalendarCells, intensityLevel, monthLabelColumns } from "./calendar-grid";

describe("buildCalendarCells", () => {
  it("covers every day of the year exactly once", () => {
    const cells = buildCalendarCells(2026);
    expect(cells).toHaveLength(365);
    expect(cells[0].date).toBe("2026-01-01");
    expect(cells.at(-1)?.date).toBe("2026-12-31");
  });

  it("places Jan 1 (a Thursday in 2026) in row 4", () => {
    const cells = buildCalendarCells(2026);
    expect(cells[0].row).toBe(4); // Sun=0 ... Thu=4
    expect(cells[0].col).toBe(0);
  });
});

describe("monthLabelColumns", () => {
  it("returns 12 months with non-decreasing columns", () => {
    const months = monthLabelColumns(2026);
    expect(months).toHaveLength(12);
    expect(months[0].month).toBe("Jan");
    for (let i = 1; i < months.length; i++) {
      expect(months[i].col).toBeGreaterThanOrEqual(months[i - 1].col);
    }
  });
});

describe("intensityLevel", () => {
  it("caps at 4", () => {
    expect(intensityLevel(0)).toBe(0);
    expect(intensityLevel(2)).toBe(2);
    expect(intensityLevel(9)).toBe(4);
  });
});
