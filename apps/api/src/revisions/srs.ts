export interface SrsState {
  ease: number;
  intervalDays: number;
}

const MIN_EASE = 1.3;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * SM-2 (Anki-style) scheduler. `selfRating` is 0-5 (0 = complete blackout, 5 = perfect
 * recall). A rating below 3 is a lapse: the interval resets to 1 day instead of advancing,
 * though ease still moves by the same formula as a correct answer.
 */
export function scheduleNext(prev: SrsState | null, selfRating: number, now: Date): SrsState & { dueAt: Date } {
  const prevEase = prev?.ease ?? 2.5;
  const prevInterval = prev?.intervalDays ?? 0;

  let intervalDays: number;
  if (selfRating < 3) {
    intervalDays = 1;
  } else if (prevInterval === 0) {
    intervalDays = 1;
  } else if (prevInterval === 1) {
    intervalDays = 6;
  } else {
    intervalDays = Math.round(prevInterval * prevEase);
  }

  const easeDelta = 0.1 - (5 - selfRating) * (0.08 + (5 - selfRating) * 0.02);
  const ease = Math.max(MIN_EASE, prevEase + easeDelta);

  const dueAt = new Date(now.getTime() + intervalDays * DAY_MS);

  return { ease, intervalDays, dueAt };
}
