import { type SubmissionSummary, SubmissionSummary as SummarySchema } from "@scs/types";
import { auth, signIn, signOut } from "../auth";
import { mintScsToken } from "../lib/scs-token";
import { TokenField } from "./TokenField";

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

const levelColor: Record<string, string> = {
  easy: "text-green-600",
  medium: "text-amber-600",
  hard: "text-red-600",
};

function safeHttpUrl(link: string): string | null {
  try {
    const url = new URL(link);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const session = await auth();

  if (!session?.userId) {
    return (
      <main className="mx-auto max-w-4xl p-10">
        <h1 className="text-3xl font-bold">ShekseCodeSync</h1>
        <p className="mt-2 text-gray-600">Sign in to see your solved problems.</p>
        <form
          action={async () => {
            "use server";
            await signIn("github");
          }}
        >
          <button
            type="submit"
            className="mt-8 rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white"
          >
            Sign in with GitHub
          </button>
        </form>
      </main>
    );
  }

  const token = await mintScsToken(session.userId);
  const submissions = await getSubmissions(token);

  return (
    <main className="mx-auto max-w-4xl p-10">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">ShekseCodeSync</h1>
        <form
          action={async () => {
            "use server";
            await signOut();
          }}
        >
          <button type="submit" className="text-sm text-gray-500 hover:underline">
            Sign out{session.user?.name ? ` (${session.user.name})` : ""}
          </button>
        </form>
      </div>
      <p className="mt-2 text-gray-600">Your solved problems.</p>

      <section className="mt-6 rounded border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-700">Extension token</h2>
        <p className="mt-1 text-xs text-gray-500">
          Paste this into the ShekseCodeSync extension to sync captures to your account.
        </p>
        <TokenField token={token} />
      </section>

      {submissions.length === 0 ? (
        <p className="mt-8 rounded border border-dashed border-gray-300 p-8 text-center text-gray-500">
          No submissions yet. Solve a problem on LeetCode or add one manually.
        </p>
      ) : (
        <table className="mt-8 w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2">Title</th>
              <th className="py-2">Platform</th>
              <th className="py-2">Level</th>
              <th className="py-2">Pattern</th>
              <th className="py-2">Solved</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((s) => (
              <tr key={s.id} className="border-b">
                <td className="py-2 font-medium">
                  {(() => {
                    const href = safeHttpUrl(s.questionLink);
                    return href ? (
                      <a href={href} className="hover:underline" target="_blank" rel="noreferrer">
                        {s.title}
                      </a>
                    ) : (
                      <span>{s.title}</span>
                    );
                  })()}
                </td>
                <td className="py-2 text-gray-600">{s.platform}</td>
                <td className={`py-2 font-medium ${levelColor[s.level] ?? ""}`}>{s.level}</td>
                <td className="py-2 text-gray-600">{s.pattern ?? "-"}</td>
                <td className="py-2 text-gray-500">{s.solvedAt.toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}
