"use client";

import { useState } from "react";
import type { RevisionQueueItem } from "@scs/types";
import { pillClass, safeHttpUrl } from "../../lib/dashboard-format";
import type { RevisionSegments } from "../../lib/revision-segments";
import { recordRevisionAttempt, setRevisionFlag } from "../revision-actions";

const ratings: { label: string; value: number; variant?: "again" | "hardish" }[] = [
  { label: "Again", value: 1, variant: "again" },
  { label: "Hard", value: 3, variant: "hardish" },
  { label: "Good", value: 4 },
  { label: "Easy", value: 5 },
];

const dayMs = 24 * 60 * 60 * 1000;

function dueLabel(dueAt: Date | null, now: Date): { text: string; className: string } {
  if (dueAt === null) return { text: "never rated", className: "text-hard font-semibold" };
  const diffDays = Math.round((dueAt.getTime() - now.getTime()) / dayMs);
  if (diffDays <= 0) {
    return diffDays === 0
      ? { text: "due today", className: "text-hard font-semibold" }
      : { text: `overdue ${Math.abs(diffDays)}d`, className: "text-hard font-semibold" };
  }
  return { text: `due in ${diffDays}d`, className: "text-medium font-semibold" };
}

function QueueCard({ item, now, borderClass }: { item: RevisionQueueItem; now: Date; borderClass: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const due = dueLabel(item.dueAt, now);
  const href = safeHttpUrl(item.questionLink);

  async function rate(selfRating: number) {
    setPending(true);
    setError(false);
    try {
      await recordRevisionAttempt(item.submissionId, selfRating);
    } catch {
      setError(true);
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    setPending(true);
    setError(false);
    try {
      await setRevisionFlag(item.submissionId, false);
    } catch {
      setError(true);
      setPending(false);
    }
  }

  return (
    <div className={`rounded-card border bg-surface px-4 py-3.5 ${borderClass}`}>
      <div className="mb-1.5 flex items-start justify-between gap-2">
        <div className="text-[14.5px] font-semibold leading-snug">
          {href ? (
            <a href={href} target="_blank" rel="noreferrer" className="hover:underline">
              {item.title}
            </a>
          ) : (
            item.title
          )}
        </div>
        <span className={`shrink-0 whitespace-nowrap rounded-pill px-2 py-0.5 text-[10.5px] font-semibold ${pillClass[item.level]}`}>
          {item.level}
        </span>
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted">
        <span>{item.pattern ?? "Uncategorized"}</span>
        <span className="text-border">·</span>
        <span className={due.className}>{due.text}</span>
        {item.ease !== null && (
          <>
            <span className="text-border">·</span>
            <span className="font-mono text-faint">
              ease {item.ease} · {item.intervalDays}d interval
            </span>
          </>
        )}
      </div>
      {error && <p className="mb-2 text-[11.5px] text-red-500">Couldn&apos;t save. Try again.</p>}
      <div className="flex gap-1.5">
        {ratings.map((r) => (
          <button
            key={r.value}
            type="button"
            disabled={pending}
            onClick={() => rate(r.value)}
            className={`rounded-btn border border-border bg-paper px-2 py-1 text-[10.5px] font-semibold text-muted disabled:opacity-50 ${
              r.variant === "again"
                ? "hover:border-hard hover:text-hard"
                : r.variant === "hardish"
                  ? "hover:border-medium hover:text-medium"
                  : "hover:border-green hover:text-green"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div className="mt-2 text-right">
        <button
          type="button"
          disabled={pending}
          onClick={remove}
          className="text-[10.5px] text-faint underline decoration-transparent hover:text-hard hover:decoration-hard disabled:opacity-50"
        >
          Remove from queue
        </button>
      </div>
    </div>
  );
}

function UpcomingRow({ item }: { item: RevisionQueueItem }) {
  const [pending, setPending] = useState(false);
  const href = safeHttpUrl(item.questionLink);

  async function remove() {
    setPending(true);
    try {
      await setRevisionFlag(item.submissionId, false);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2.5 text-[13px] last:border-b-0">
      <div className="flex min-w-0 items-center gap-2.5">
        {href ? (
          <a href={href} target="_blank" rel="noreferrer" className="truncate font-medium hover:underline">
            {item.title}
          </a>
        ) : (
          <span className="truncate font-medium">{item.title}</span>
        )}
        <span className="shrink-0 text-[11.5px] text-faint">{item.pattern ?? "Uncategorized"}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2.5">
        <span className="font-mono text-[11.5px] text-muted">{item.dueAt?.toLocaleDateString()}</span>
        <button
          type="button"
          disabled={pending}
          onClick={remove}
          title="Remove from queue"
          className="h-4 w-4 text-faint hover:text-hard disabled:opacity-50"
        >
          &times;
        </button>
      </div>
    </div>
  );
}

function EmptySegment({ text }: { text: string }) {
  return (
    <p className="rounded-card border border-dashed border-border px-5 py-5 text-center text-[13px] italic text-faint">
      {text}
    </p>
  );
}

export function RevisionScreen({ segments, now }: { segments: RevisionSegments; now: Date }) {
  const { dueNow, dueSoon, upcoming } = segments;

  return (
    <>
      <section className="mb-8">
        <div className="mb-3.5 flex items-center gap-2.5">
          <span className="text-[11.5px] font-semibold uppercase tracking-[.12em] text-muted">Due now</span>
          <span className="rounded-pill bg-hard/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-hard">
            {dueNow.length}
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>
        {dueNow.length === 0 ? (
          <EmptySegment text="Nothing due right now." />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dueNow.map((item) => (
              <QueueCard key={item.submissionId} item={item} now={now} borderClass="border-l-2 border-l-hard" />
            ))}
          </div>
        )}
      </section>

      <section className="mb-8">
        <div className="mb-3.5 flex items-center gap-2.5">
          <span className="text-[11.5px] font-semibold uppercase tracking-[.12em] text-muted">Due soon</span>
          <span className="rounded-pill bg-medium/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-medium">
            {dueSoon.length}
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>
        {dueSoon.length === 0 ? (
          <EmptySegment text="Nothing due in the next few days." />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dueSoon.map((item) => (
              <QueueCard key={item.submissionId} item={item} now={now} borderClass="border-l-2 border-l-medium" />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3.5 flex items-center gap-2.5">
          <span className="text-[11.5px] font-semibold uppercase tracking-[.12em] text-muted">Upcoming</span>
          <span className="rounded-pill bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-semibold text-muted">
            {upcoming.length}
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>
        {upcoming.length === 0 ? (
          <EmptySegment text="Nothing scheduled further out yet." />
        ) : (
          <div className="rounded-card border border-border bg-surface px-4">
            {upcoming.map((item) => (
              <UpcomingRow key={item.submissionId} item={item} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
