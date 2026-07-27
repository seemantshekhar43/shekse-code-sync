"use client";

export default function ProblemsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-8 py-24">
      <p className="text-[15px] text-muted">Something went wrong loading your problems.</p>
      <button
        type="button"
        onClick={reset}
        className="mt-3 w-fit rounded-btn bg-green px-4 py-2 text-sm font-semibold text-white"
      >
        Try again
      </button>
    </main>
  );
}
