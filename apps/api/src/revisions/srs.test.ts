import { describe, expect, it } from "vitest";
import { scheduleNext } from "./srs.js";

const now = new Date("2026-07-27T00:00:00.000Z");

describe("scheduleNext", () => {
  it("schedules a first-ever attempt one day out on a passing rating", () => {
    const result = scheduleNext(null, 4, now);
    expect(result.intervalDays).toBe(1);
    expect(result.dueAt).toEqual(new Date("2026-07-28T00:00:00.000Z"));
  });

  it("schedules the second passing attempt six days out", () => {
    const result = scheduleNext({ ease: 2.5, intervalDays: 1 }, 4, now);
    expect(result.intervalDays).toBe(6);
  });

  it("multiplies interval by ease for subsequent passing attempts", () => {
    const result = scheduleNext({ ease: 2.5, intervalDays: 6 }, 4, now);
    expect(result.intervalDays).toBe(Math.round(6 * 2.5));
  });

  it("resets the interval to one day on a lapse (rating below 3)", () => {
    const result = scheduleNext({ ease: 2.5, intervalDays: 20 }, 1, now);
    expect(result.intervalDays).toBe(1);
    expect(result.dueAt).toEqual(new Date("2026-07-28T00:00:00.000Z"));
  });

  it("raises ease on a perfect rating and never drops it below the floor", () => {
    const higher = scheduleNext({ ease: 2.5, intervalDays: 6 }, 5, now);
    expect(higher.ease).toBeGreaterThan(2.5);

    const floored = scheduleNext({ ease: 1.3, intervalDays: 6 }, 0, now);
    expect(floored.ease).toBeGreaterThanOrEqual(1.3);
  });
});
