import { auth } from "../../auth";
import { pillClass, relativeSolved, safeHttpUrl } from "../../lib/dashboard-format";
import { getHeaderData } from "../../lib/header-data";
import { getSubmissions } from "../../lib/submissions-api";
import { DashboardHeader } from "../DashboardHeader";
import { FilterBar } from "./FilterBar";

const PAGE_SIZE = 25;

type SearchParams = Record<string, string | undefined>;

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.userId) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-8 py-24">
        <p className="text-[15px] text-muted">Sign in from the overview to see your problems.</p>
        <a href="/" className="mt-3 text-sm font-semibold text-green underline">
          Go to overview
        </a>
      </main>
    );
  }

  const headerData = await getHeaderData(session);
  const [all, filtered] = await Promise.all([
    getSubmissions(headerData.token),
    getSubmissions(headerData.token, {
      platform: searchParams.platform,
      level: searchParams.level,
      pattern: searchParams.pattern,
      language: searchParams.language,
      synced: searchParams.synced,
      q: searchParams.q,
      sortBy: searchParams.sortBy,
      sortOrder: searchParams.sortOrder,
    }),
  ]);

  const patterns = [...new Set(all.map((s) => s.pattern).filter((p): p is string => Boolean(p)))].sort();
  const languages = [...new Set(all.map((s) => s.language))].sort();
  const pendingSync = all.filter((s) => !s.synced).length;

  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  function pageHref(targetPage: number): string {
    const params = new URLSearchParams(
      Object.entries(searchParams).filter(([, v]) => v) as [string, string][],
    );
    params.set("page", String(targetPage));
    return `/problems?${params.toString()}`;
  }

  const currentSortBy = searchParams.sortBy === "title" ? "title" : "solvedAt";
  const currentSortOrder = searchParams.sortOrder === "asc" ? "asc" : "desc";

  function sortHref(column: "title" | "solvedAt"): string {
    const params = new URLSearchParams(
      Object.entries(searchParams).filter(([, v]) => v) as [string, string][],
    );
    const nextOrder = currentSortBy === column && currentSortOrder === "asc" ? "desc" : "asc";
    params.set("sortBy", column);
    params.set("sortOrder", nextOrder);
    params.delete("page");
    return `/problems?${params.toString()}`;
  }

  const sortColumns: Record<string, "title" | "solvedAt"> = { Problem: "title", Solved: "solvedAt" };

  return (
    <main className="mx-auto max-w-5xl px-8 py-12">
      <div className="rounded-shell border border-border bg-paper shadow-shell">
        <DashboardHeader active="/problems" {...headerData} />

        <div className="flex items-end justify-between gap-4 px-6 pb-1 pt-8">
          <div>
            <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.12em] text-muted">
              All submissions
            </div>
            <h1 className="mb-1 font-serif text-[26px] font-semibold leading-tight">
              Every problem you&apos;ve <span className="text-green">solved and synced</span>.
            </h1>
            <div className="text-[12px] font-medium text-muted">
              {all.length} submissions
              {pendingSync > 0 ? ` · ${pendingSync} pending GitHub sync` : ""}
            </div>
          </div>
          <a
            href="/problems/new"
            className="rounded-btn bg-green px-4 py-2.5 text-[13px] font-semibold text-white"
          >
            Add problem
          </a>
        </div>

        <FilterBar patterns={patterns} languages={languages} />

        <div className="overflow-x-auto px-6 pb-2 pt-4">
          {pageRows.length === 0 ? (
            <p className="rounded-card border border-dashed border-border p-10 text-center text-sm text-muted">
              {all.length === 0
                ? "No submissions yet. Solve a problem on LeetCode or add one manually."
                : "No submissions match these filters."}
            </p>
          ) : (
            <table className="w-full min-w-[860px] border-collapse">
              <thead>
                <tr>
                  {["Problem", "Difficulty", "Pattern", "Language", "Platform", "Sync", "Solved", "Code"].map(
                    (col) => {
                      const sortColumn = sortColumns[col];
                      const isSorted = sortColumn && currentSortBy === sortColumn;
                      return (
                        <th
                          key={col}
                          className="whitespace-nowrap border-b border-border pb-2.5 pr-3.5 text-left text-[10.5px] font-semibold uppercase tracking-[0.09em] text-faint"
                        >
                          {sortColumn ? (
                            <a
                              href={sortHref(sortColumn)}
                              className={`inline-flex items-center gap-1 hover:text-ink ${isSorted ? "text-ink" : ""}`}
                            >
                              {col}
                              <span className="text-[9px]">
                                {isSorted ? (currentSortOrder === "asc" ? "↑" : "↓") : "↕"}
                              </span>
                            </a>
                          ) : (
                            col
                          )}
                        </th>
                      );
                    },
                  )}
                </tr>
              </thead>
              <tbody>
                {pageRows.map((s) => {
                  const href = safeHttpUrl(s.questionLink);
                  return (
                    <tr key={s.id}>
                      <td className="max-w-[280px] border-b border-border py-3 pr-3.5 text-[13.5px] font-semibold">
                        {href ? (
                          <a href={href} target="_blank" rel="noreferrer" className="hover:underline">
                            {s.title}
                          </a>
                        ) : (
                          s.title
                        )}
                      </td>
                      <td className="border-b border-border py-3 pr-3.5">
                        <span className={`rounded-pill px-2 py-0.5 text-[11px] font-semibold ${pillClass[s.level]}`}>
                          {s.level[0].toUpperCase() + s.level.slice(1)}
                        </span>
                      </td>
                      <td className="border-b border-border py-3 pr-3.5 text-[12.5px] text-muted">
                        {s.pattern ?? "-"}
                      </td>
                      <td className="border-b border-border py-3 pr-3.5">
                        <span className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-muted">
                          {s.language}
                        </span>
                      </td>
                      <td className="border-b border-border py-3 pr-3.5 text-[12.5px] text-muted">
                        {s.platform === "leetcode" ? "LeetCode" : s.platform === "neetcode" ? "NeetCode" : "Manual"}
                      </td>
                      <td className="border-b border-border py-3 pr-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                            s.synced ? "text-green" : "text-medium"
                          }`}
                        >
                          <span
                            className={`h-[7px] w-[7px] rounded-full ${s.synced ? "bg-green" : "bg-medium"}`}
                          />
                          {s.synced ? "Synced" : "Pending"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap border-b border-border py-3 pr-3.5 font-mono text-[11.5px] text-faint">
                        {relativeSolved(s.solvedAt)}
                      </td>
                      <td className="border-b border-border py-3">
                        {s.synced ? (
                          <a
                            href={`/problems/${s.id}/code`}
                            className="whitespace-nowrap rounded-md border border-border bg-surface px-2 py-1 text-[11.5px] font-medium text-muted hover:border-green hover:text-green"
                          >
                            {"</> View"}
                          </a>
                        ) : (
                          <span className="text-[11.5px] text-faint">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {filtered.length > 0 ? (
          <div className="flex items-center justify-between px-6 pb-7 pt-3.5 text-[12.5px] text-muted">
            <span>
              Showing {(currentPage - 1) * PAGE_SIZE + 1}-
              {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-1.5">
              <a
                href={pageHref(currentPage - 1)}
                aria-disabled={currentPage <= 1}
                className={`rounded-md border border-border bg-surface px-2.5 py-1 text-[12.5px] ${
                  currentPage <= 1 ? "pointer-events-none opacity-40" : "text-ink"
                }`}
              >
                &larr; Prev
              </a>
              <a
                href={pageHref(currentPage + 1)}
                aria-disabled={currentPage >= totalPages}
                className={`rounded-md border border-border bg-surface px-2.5 py-1 text-[12.5px] ${
                  currentPage >= totalPages ? "pointer-events-none opacity-40" : "text-ink"
                }`}
              >
                Next &rarr;
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </main>
  );
}
