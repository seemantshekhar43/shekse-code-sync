import { type SubmissionSummary, SubmissionSummary as SummarySchema } from "@scs/types";

async function getSubmissions(): Promise<SubmissionSummary[]> {
  const base = process.env.API_BASE_URL ?? "http://localhost:3001";
  try {
    const res = await fetch(`${base}/submissions`, { cache: "no-store" });
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
  const submissions = await getSubmissions();

  return (
    <main className="mx-auto max-w-4xl p-10">
      <h1 className="text-3xl font-bold">ShekseCodeSync</h1>
      <p className="mt-2 text-gray-600">Your solved problems.</p>

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
