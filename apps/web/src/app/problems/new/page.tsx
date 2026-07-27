import { auth } from "../../../auth";
import { DashboardHeader } from "../../DashboardHeader";
import { AddProblemForm } from "./AddProblemForm";

export default async function AddProblemPage() {
  const session = await auth();
  if (!session?.userId) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-8 py-24">
        <p className="text-[15px] text-muted">Sign in from the overview to add a problem.</p>
        <a href="/" className="mt-3 text-sm font-semibold text-green underline">
          Go to overview
        </a>
      </main>
    );
  }

  const displayName = session.user?.name ?? session.githubLogin ?? "You";

  return (
    <main className="mx-auto max-w-3xl px-8 py-12">
      <div className="rounded-shell border border-border bg-paper shadow-shell">
        <DashboardHeader active="/problems" displayName={displayName} />

        <div className="px-6 pb-1 pt-8">
          <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-muted">
            Manual entry
          </div>
          <h1 className="font-serif text-[22px] font-semibold leading-tight">Add a problem</h1>
          <p className="mt-1.5 text-[13px] text-muted">
            Fill in what you solved - this creates the same kind of submission the browser
            extension captures automatically.
          </p>
        </div>

        <AddProblemForm />
      </div>
    </main>
  );
}
