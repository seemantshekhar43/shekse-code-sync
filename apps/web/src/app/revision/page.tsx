import { auth } from "../../auth";
import { getHeaderData } from "../../lib/header-data";
import { averageEase, segmentQueue } from "../../lib/revision-segments";
import { getFullRevisionQueue } from "../../lib/revisions-api";
import { DashboardHeader } from "../DashboardHeader";
import { RevisionScreen } from "./RevisionScreen";

export default async function RevisionPage() {
  const session = await auth();
  if (!session?.userId) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-8 py-24">
        <p className="text-[15px] text-muted">Sign in from the overview to see your revision queue.</p>
        <a href="/" className="mt-3 text-sm font-semibold text-green underline">
          Go to overview
        </a>
      </main>
    );
  }

  const headerData = await getHeaderData(session);
  const queue = await getFullRevisionQueue(headerData.token);

  const now = new Date();
  const segments = segmentQueue(queue, now);
  const avgEase = averageEase(queue);

  return (
    <main className="min-h-screen bg-paper">
      <DashboardHeader
        active="/revision"
        displayName={headerData.displayName}
        githubHandle={headerData.githubHandle}
        githubRepo={headerData.githubRepo}
        manageUrl={headerData.manageUrl}
        connectUrl={headerData.connectUrl}
        token={headerData.token}
      />
      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="font-serif text-[28px] font-semibold leading-tight">
          Your <span className="text-green">[revision queue]</span>, in order.
        </h1>
        <p className="mb-7 mt-2 max-w-xl text-[14.5px] text-muted">
          Rate each problem honestly - the interval before you see it again is scheduled from your rating,
          not the clock.
        </p>

        <div className="mb-8 grid grid-cols-2 gap-3.5 sm:grid-cols-4">
          <div className="rounded-card border border-border bg-surface px-4 py-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[.12em] text-faint">Due now</div>
            <div className="font-serif text-2xl font-semibold text-hard">{segments.dueNow.length}</div>
          </div>
          <div className="rounded-card border border-border bg-surface px-4 py-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[.12em] text-faint">Due soon</div>
            <div className="font-serif text-2xl font-semibold text-medium">{segments.dueSoon.length}</div>
          </div>
          <div className="rounded-card border border-border bg-surface px-4 py-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[.12em] text-faint">Upcoming</div>
            <div className="font-serif text-2xl font-semibold">{segments.upcoming.length}</div>
          </div>
          <div className="rounded-card border border-border bg-surface px-4 py-4">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[.12em] text-faint">Avg. ease</div>
            <div className="font-serif text-2xl font-semibold text-green">{avgEase ?? "-"}</div>
          </div>
        </div>

        <RevisionScreen segments={segments} now={now} />
      </div>
    </main>
  );
}
