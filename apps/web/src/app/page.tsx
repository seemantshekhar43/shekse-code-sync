import { prisma } from "@scs/db";
import { type SubmissionSummary, SubmissionSummary as SummarySchema } from "@scs/types";
import { auth, signIn, signOut } from "../auth";
import { mintInstallState, mintScsToken } from "../lib/scs-token";
import { TokenField } from "./TokenField";

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

async function getSubmissions(token: string): Promise<SubmissionSummary[]> {
  const base = process.env.API_BASE_URL ?? "http://localhost:3001";
  try {
    const res = await fetch(`${base}/submissions`, {
      cache: "no-store",
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return SummarySchema.array().parse(await res.json());
  } catch {
    // API not reachable yet (e.g. during local scaffold) - render empty.
    return [];
  }
}

const pillClass: Record<string, string> = {
  easy: "text-green bg-green-soft",
  medium: "text-medium bg-medium/10",
  hard: "text-hard bg-hard/10",
};

function safeHttpUrl(link: string): string | null {
  try {
    const url = new URL(link);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

/** "2m ago" / "3h ago" / "yesterday" / locale date, matching the mockup's recency labels. */
function relativeSolved(date: Date): string {
  const ms = Date.now() - date.getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

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

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const chars = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : [parts[0]];
  return chars.map((p) => p[0]?.toUpperCase() ?? "").join("");
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

  const token = await mintScsToken(session.userId);
  const [submissions, user] = await Promise.all([
    getSubmissions(token),
    prisma.user.findUnique({
      where: { id: session.userId },
      select: { githubRepo: true },
    }),
  ]);
  const appSlug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG;
  const installState = await mintInstallState(session.userId);
  const installUrl = appSlug
    ? `https://github.com/apps/${appSlug}/installations/new?state=${encodeURIComponent(installState)}`
    : undefined;
  const banner = searchParams.github ? installBanner[searchParams.github] : undefined;

  const patterns = new Set(submissions.map((s) => s.pattern).filter(Boolean));
  const dueForRevision = submissions.filter((s) => s.isMarkedForRevision);
  const streak = computeStreak(submissions.map((s) => s.solvedAt));
  const recent = [...submissions]
    .sort((a, b) => b.solvedAt.getTime() - a.solvedAt.getTime())
    .slice(0, 8);
  const displayName = session.user?.name ?? session.githubLogin ?? "You";
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="mx-auto max-w-5xl px-8 py-12">
      <div className="rounded-shell border border-border bg-paper shadow-shell">
        <div className="flex items-center justify-between border-b border-border px-6 py-3.5">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 font-serif text-base font-semibold">
              <span className="h-[9px] w-[9px] rounded-full bg-green shadow-[0_0_0_3px_var(--green-soft)]" />
              ShekseCodeSync
            </div>
            <nav className="flex gap-5 text-sm">
              <span className="font-medium text-ink">Overview</span>
              <span className="font-medium text-muted">Problems</span>
              <span className="font-medium text-muted">Revision</span>
              <span className="font-medium text-muted">Insights</span>
            </nav>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut();
            }}
          >
            <button
              type="submit"
              title={`Sign out${displayName ? ` (${displayName})` : ""}`}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-green text-xs font-semibold text-white"
            >
              {initials(displayName)}
            </button>
          </form>
        </div>

        <div className="px-6 pb-1 pt-8">
          <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-muted">
            {today}
          </div>
          <h2 className="mb-5 font-serif text-[28px] font-semibold leading-tight">
            You&apos;ve solved <span className="text-green">{submissions.length} problems</span>
            {dueForRevision.length > 0 ? `, and ${dueForRevision.length} are due for revision.` : "."}
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
                {dueForRevision.length}
              </div>
              <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-muted">
                Due today
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 px-6 pb-7 pt-6 md:grid-cols-[1fr_300px]">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-serif text-lg font-semibold">Recent submissions</h3>
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
            {dueForRevision.length === 0 ? (
              <p className="text-[12.5px] italic text-faint">Nothing marked for revision yet.</p>
            ) : (
              dueForRevision.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="mb-3 rounded-card border border-border bg-surface px-4 py-3.5 last:mb-0"
                >
                  <div className="mb-1 text-[13.5px] font-semibold">{s.title}</div>
                  <div className="text-[11.5px] text-muted">{s.pattern ?? "Uncategorized"}</div>
                </div>
              ))
            )}
            <div className="mt-4 rounded-card border border-green-soft bg-green-soft px-4 py-3.5">
              <div className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.1em] text-green">
                AI Insight
              </div>
              <p className="text-[13px] leading-relaxed text-ink">
                Insights land here once the revision engine ships (see the backlog for the SRS +
                insights work).
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-6 rounded-card border border-border bg-surface px-5 py-4">
        <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-muted">
          GitHub repo
        </h3>
        {banner ? (
          <p
            className={`mt-2 rounded-card border px-3 py-2 text-sm ${
              banner.ok
                ? "border-green-soft bg-green-soft text-green"
                : "border-hard/20 bg-hard/10 text-hard"
            }`}
          >
            {banner.text}
          </p>
        ) : null}
        {user?.githubRepo ? (
          <p className="mt-1.5 text-xs text-muted">
            Syncing to <span className="font-mono text-ink">{user.githubRepo}</span>.{" "}
            {installUrl ? (
              <a href={installUrl} className="text-green underline">
                Manage
              </a>
            ) : null}
          </p>
        ) : (
          <div className="mt-1.5">
            <p className="text-xs text-muted">
              Install the ShekseCodeSync GitHub App on the repo you want your solutions
              committed to.
            </p>
            {installUrl ? (
              <a
                href={installUrl}
                className="mt-2 inline-block rounded-btn bg-green px-3 py-1.5 text-xs font-semibold text-white"
              >
                Connect GitHub repo
              </a>
            ) : (
              <p className="mt-2 text-xs text-medium">
                Set NEXT_PUBLIC_GITHUB_APP_SLUG to enable one-click install.
              </p>
            )}
          </div>
        )}
      </section>

      <section className="mt-4 rounded-card border border-border bg-surface px-5 py-4">
        <h3 className="text-[11.5px] font-semibold uppercase tracking-[0.12em] text-muted">
          Extension token
        </h3>
        <p className="mt-1.5 text-xs text-muted">
          Paste this into the ShekseCodeSync extension to sync captures to your account.
        </p>
        <TokenField token={token} />
      </section>
    </main>
  );
}
