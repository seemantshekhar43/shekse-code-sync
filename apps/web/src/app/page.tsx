import { auth, signIn } from "../auth";
import { getHeaderData } from "../lib/header-data";
import { pillClass, relativeSolved, safeHttpUrl } from "../lib/dashboard-format";
import { getRevisionQueue } from "../lib/revisions-api";
import { getSubmissions } from "../lib/submissions-api";
import { DashboardHeader } from "./DashboardHeader";
import { RevisionQueueRail } from "./RevisionQueueRail";

const installBanner: Record<string, { text: string; ok: boolean }> = {
  connected: { text: "GitHub repo connected. Captures will commit there.", ok: true },
  no_repos: { text: "The installation had no accessible repositories.", ok: false },
  missing_installation: { text: "No installation id in the GitHub redirect.", ok: false },
  forbidden: {
    text: "That GitHub App installation isn't on your account, so it wasn't connected.",
    ok: false,
  },
  org_unsupported: {
    text: "Organization installations aren't supported yet. Install on a repo you own.",
    ok: false,
  },
  error: { text: "Couldn't reach GitHub to finish connecting. Please try again.", ok: false },
};

/** Count of consecutive days (ending today or yesterday) with at least one solve. */
function computeStreak(dates: Date[]): number {
  if (dates.length === 0) return 0;
  const days = new Set(dates.map((d) => d.toDateString()));
  const cursor = new Date();
  if (!days.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(cursor.toDateString())) return 0;
  }
  let streak = 0;
  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: { github?: string };
}) {
  const session = await auth();

  if (!session?.userId) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-8 py-24">
        <div className="mb-2 flex items-center gap-2">
          <span className="h-[9px] w-[9px] rounded-full bg-green shadow-[0_0_0_3px_var(--green-soft)]" />
          <span className="font-serif text-base font-semibold">ShekseCodeSync</span>
        </div>
        <h1 className="font-serif text-4xl font-semibold leading-tight tracking-tight">
          A quiet, typographic home for <span className="text-green">[every problem you solve]</span>.
        </h1>
        <p className="mt-3 max-w-md text-[17px] text-muted">
          Sign in to capture, revise, and see insights on your DSA practice.
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("github");
          }}
        >
          <button
            type="submit"
            className="mt-8 rounded-btn bg-green px-4 py-3 text-sm font-semibold text-white"
          >
            Sign in with GitHub
          </button>
        </form>
      </main>
    );
  }

  const headerData = await getHeaderData(session);
  const [submissions, revisionQueue] = await Promise.all([
    getSubmissions(headerData.token),
    getRevisionQueue(headerData.token),
  ]);
  const banner = searchParams.github ? installBanner[searchParams.github] : undefined;

  const patterns = new Set(submissions.map((s) => s.pattern).filter(Boolean));
  const streak = computeStreak(submissions.map((s) => s.solvedAt));
  const recent = [...submissions]
    .sort((a, b) => b.solvedAt.getTime() - a.solvedAt.getTime())
    .slice(0, 8);
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="min-h-screen bg-paper">
      <DashboardHeader active="/" {...headerData} />

      <div className="mx-auto max-w-5xl px-6 py-8">
        {banner ? (
          <p
            className={`mb-4 rounded-card border px-3 py-2 text-sm ${
              banner.ok
                ? "border-green-soft bg-green-soft text-green"
                : "border-hard/20 bg-hard/10 text-hard"
            }`}
          >
            {banner.text}
          </p>
        ) : null}
        <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-muted">
          {today}
        </div>
        <h2 className="mb-5 font-serif text-[28px] font-semibold leading-tight">
          You&apos;ve solved <span className="text-green">{submissions.length} problems</span>
          {revisionQueue.length > 0 ? `, and ${revisionQueue.length} are due for revision.` : "."}
        </h2>
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-card border border-border bg-surface px-4 py-4">
            <div className="font-serif text-3xl font-semibold leading-none">
              {submissions.length}
            </div>
            <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">
              Solved
            </div>
          </div>
          <div className="rounded-card border border-border bg-surface px-4 py-4">
            <div className="font-serif text-3xl font-semibold leading-none">{streak}</div>
            <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">
              Day streak
            </div>
          </div>
          <div className="rounded-card border border-border bg-surface px-4 py-4">
            <div className="font-serif text-3xl font-semibold leading-none">
              {patterns.size}
            </div>
            <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">
              Patterns
            </div>
          </div>
          <div className="rounded-card border border-border bg-surface px-4 py-4">
            <div className="font-serif text-3xl font-semibold leading-none text-medium">
              {revisionQueue.length}
            </div>
            <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">
              Due today
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-[1fr_300px]">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold">Recent submissions</h3>
              <a
                href="/problems/new"
                className="rounded-btn bg-green px-3 py-1.5 text-xs font-semibold text-white"
              >
                Add problem
              </a>
            </div>
            {recent.length === 0 ? (
              <p className="rounded-card border border-dashed border-border p-8 text-center text-sm text-muted">
                No submissions yet. Solve a problem on LeetCode or add one manually.
              </p>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="border-b border-border pb-2.5 pr-4 text-left text-[10.5px] font-semibold uppercase tracking-[0.09em] text-faint">
                      Problem
                    </th>
                    <th className="border-b border-border pb-2.5 pr-4 text-left text-[10.5px] font-semibold uppercase tracking-[0.09em] text-faint">
                      Difficulty
                    </th>
                    <th className="border-b border-border pb-2.5 pr-4 text-left text-[10.5px] font-semibold uppercase tracking-[0.09em] text-faint">
                      Pattern
                    </th>
                    <th className="border-b border-border pb-2.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.09em] text-faint">
                      Solved
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((s) => {
                    const href = safeHttpUrl(s.questionLink);
                    return (
                      <tr key={s.id}>
                        <td className="border-b border-border py-3 pr-4 text-[13.5px] font-semibold">
                          {href ? (
                            <a href={href} target="_blank" rel="noreferrer" className="hover:underline">
                              {s.title}
                            </a>
                          ) : (
                            s.title
                          )}
                        </td>
                        <td className="border-b border-border py-3 pr-4">
                          <span
                            className={`rounded-pill px-2 py-0.5 text-[11px] font-semibold ${pillClass[s.level]}`}
                          >
                            {s.level[0].toUpperCase() + s.level.slice(1)}
                          </span>
                        </td>
                        <td className="border-b border-border py-3 pr-4 text-xs text-muted">
                          {s.pattern ?? "-"}
                        </td>
                        <td className="border-b border-border py-3 font-mono text-xs text-faint">
                          {relativeSolved(s.solvedAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div>
            <div className="mb-3">
              <h3 className="font-serif text-lg font-semibold">Revision queue</h3>
            </div>
            <RevisionQueueRail items={revisionQueue} />
            <div className="mt-4 rounded-card border border-green-soft bg-green-soft px-4 py-3.5">
              <div className="mb-1.5 flex items-center gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-green">
                  AI Insight
                </span>
                <span className="rounded-pill bg-surface px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-[0.05em] text-muted">
                  Coming soon
                </span>
              </div>
              <p className="text-[13px] leading-relaxed text-ink">
                AI-generated insights aren&apos;t enabled yet - check back soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
