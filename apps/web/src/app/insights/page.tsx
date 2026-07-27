import { auth } from "../../auth";
import { getHeaderData } from "../../lib/header-data";
import { getInsightsSummary } from "../../lib/insights-api";
import { generateObservations } from "../../lib/insights-observations";
import { DashboardHeader } from "../DashboardHeader";
import { InsightsScreen } from "./InsightsScreen";

export default async function InsightsPage() {
  const session = await auth();
  if (!session?.userId) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-8 py-24">
        <p className="text-[15px] text-muted">Sign in from the overview to see your insights.</p>
        <a href="/" className="mt-3 text-sm font-semibold text-green underline">
          Go to overview
        </a>
      </main>
    );
  }

  const headerData = await getHeaderData(session);
  const summary = await getInsightsSummary(headerData.token, new Date().getUTCFullYear());
  const observations = generateObservations(summary);

  return (
    <main className="min-h-screen bg-paper">
      <DashboardHeader
        active="/insights"
        displayName={headerData.displayName}
        githubHandle={headerData.githubHandle}
        githubRepo={headerData.githubRepo}
        manageUrl={headerData.manageUrl}
        connectUrl={headerData.connectUrl}
        token={headerData.token}
      />
      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="font-serif text-[28px] font-semibold leading-tight">
          Where your <span className="text-green">[practice]</span> is actually going.
        </h1>
        <p className="mb-7 mt-2 max-w-xl text-[14.5px] text-muted">
          Coverage across the patterns you&apos;ve drilled, your pace over time, and a few honest observations.
        </p>

        <div className="mb-8 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          <div className="rounded-card border border-border bg-surface px-4 py-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[.12em] text-faint">Today</div>
            <div className="font-serif text-2xl font-semibold">{summary.today}</div>
          </div>
          <div className="rounded-card border border-border bg-surface px-4 py-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[.12em] text-faint">This week</div>
            <div className="font-serif text-2xl font-semibold">{summary.thisWeek}</div>
            <div className="mt-1 text-[11px] font-semibold text-green">vs {summary.lastWeek} last week</div>
          </div>
          <div className="rounded-card border border-border bg-surface px-4 py-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[.12em] text-faint">This month</div>
            <div className="font-serif text-2xl font-semibold">{summary.thisMonth}</div>
            <div className="mt-1 text-[11px] font-semibold text-green">vs {summary.lastMonth} last month</div>
          </div>
          <div className="rounded-card border border-border bg-surface px-4 py-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[.12em] text-faint">
              Patterns touched
            </div>
            <div className="font-serif text-2xl font-semibold">{summary.patternsTouched}</div>
          </div>
        </div>

        <InsightsScreen summary={summary} observations={observations} />
      </div>
    </main>
  );
}
