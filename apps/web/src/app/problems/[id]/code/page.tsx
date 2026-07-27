import { notFound } from "next/navigation";
import { auth } from "../../../../auth";
import { mintScsToken } from "../../../../lib/scs-token";
import { getSubmissionCode } from "../../../../lib/submissions-api";
import { DashboardHeader } from "../../../DashboardHeader";
import { CopyCodeButton } from "./CopyCodeButton";

export default async function SubmissionCodePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.userId) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-8 py-24">
        <p className="text-[15px] text-muted">Sign in from the overview to view captured code.</p>
        <a href="/" className="mt-3 text-sm font-semibold text-green underline">
          Go to overview
        </a>
      </main>
    );
  }

  const token = await mintScsToken(session.userId);
  const result = await getSubmissionCode(token, params.id);
  if (!result) notFound();

  const displayName = session.user?.name ?? session.githubLogin ?? "You";

  return (
    <main className="mx-auto max-w-5xl px-8 py-12">
      <div className="rounded-shell border border-border bg-paper shadow-shell">
        <DashboardHeader active="/problems" displayName={displayName} />
        <div className="flex items-center justify-between px-6 pb-1 pt-6">
          <div>
            <a href="/problems" className="text-xs font-medium text-muted hover:text-green">
              &larr; Back to Problems
            </a>
            <h1 className="mt-1 font-serif text-xl font-semibold">Captured solution</h1>
          </div>
          <span className="rounded-md bg-surface-2 px-2 py-1 font-mono text-[11px] text-muted">
            {result.language}
          </span>
        </div>

        {result.analysis ? (
          <div className="flex gap-3 px-6 pt-4">
            <div className="rounded-card border border-border bg-surface px-3.5 py-2.5">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-faint">
                Time complexity
              </div>
              <div className="mt-0.5 font-mono text-[13px] font-semibold text-ink">
                {result.analysis.timeComplexity}
              </div>
            </div>
            <div className="rounded-card border border-border bg-surface px-3.5 py-2.5">
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-faint">
                Space complexity
              </div>
              <div className="mt-0.5 font-mono text-[13px] font-semibold text-ink">
                {result.analysis.spaceComplexity}
              </div>
            </div>
          </div>
        ) : (
          <p className="px-6 pt-4 text-[11.5px] italic text-faint">
            AI complexity analysis hasn&apos;t finished yet - check back shortly.
          </p>
        )}

        <div className="px-6 pb-7 pt-4">
          <div className="mb-2 flex justify-end">
            <CopyCodeButton code={result.code} />
          </div>
          <pre className="overflow-x-auto rounded-card border border-border bg-surface p-4 font-mono text-[12.5px] leading-relaxed text-ink">
            <code>{result.code}</code>
          </pre>
          <p className="mt-3 text-[11.5px] text-faint">
            Read-only, fetched from your GitHub repo. Edit the file on GitHub - it stays the source
            of truth.
          </p>
        </div>
      </div>
    </main>
  );
}
