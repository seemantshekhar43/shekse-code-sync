"use client";

import { useState } from "react";
import type { RevisionQueueItem } from "@scs/types";
import { recordRevisionAttempt } from "./revision-actions";

const ratings: { label: string; value: number }[] = [
  { label: "Again", value: 1 },
  { label: "Hard", value: 3 },
  { label: "Good", value: 4 },
  { label: "Easy", value: 5 },
];

export function RevisionQueueRail({ items }: { items: RevisionQueueItem[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  if (items.length === 0) {
    return <p className="text-[12.5px] italic text-faint">Nothing due for revision right now.</p>;
  }

  async function rate(submissionId: string, selfRating: number) {
    setPendingId(submissionId);
    setErrorId(null);
    try {
      await recordRevisionAttempt(submissionId, selfRating);
    } catch {
      setErrorId(submissionId);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <>
      {items.slice(0, 5).map((item) => (
        <div
          key={item.submissionId}
          className="mb-3 rounded-card border border-border bg-surface px-4 py-3.5 last:mb-0"
        >
          <div className="mb-1 text-[13.5px] font-semibold">{item.title}</div>
          <div className="mb-2.5 text-[11.5px] text-muted">{item.pattern ?? "Uncategorized"}</div>
          {errorId === item.submissionId && (
            <p className="mb-2 text-[11.5px] text-red-500">Couldn&apos;t save your rating. Try again.</p>
          )}
          <div className="flex gap-1.5">
            {ratings.map((r) => (
              <button
                key={r.value}
                type="button"
                disabled={pendingId === item.submissionId}
                onClick={() => rate(item.submissionId, r.value)}
                className="rounded-md border border-border bg-paper px-2 py-1 text-[10.5px] font-semibold text-muted hover:border-green hover:text-green disabled:opacity-50"
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
