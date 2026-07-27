"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

const FILTER_KEYS = ["platform", "level", "pattern", "language", "synced", "q"] as const;

const FILTER_LABELS: Record<(typeof FILTER_KEYS)[number], string> = {
  platform: "Platform",
  level: "Difficulty",
  pattern: "Pattern",
  language: "Language",
  synced: "Sync",
  q: "Search",
};

export function FilterBar({
  patterns,
  languages,
}: {
  patterns: string[];
  languages: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();
  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setSearchValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  function onSearchChange(value: string) {
    setSearchValue(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => updateParam("q", value), 300);
  }

  const activeChips = FILTER_KEYS.filter((key) => searchParams.get(key)).map((key) => ({
    key,
    label: FILTER_LABELS[key],
    value: searchParams.get(key) as string,
  }));

  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5 px-6 pb-1 pt-5">
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-btn border border-border bg-surface px-3 py-2 text-[13px] text-muted">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="text"
            placeholder="Search by title..."
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full bg-transparent text-ink outline-none placeholder:text-muted"
          />
        </div>
        <select
          className="rounded-btn border border-border bg-surface px-2.5 py-2 text-[13px] text-ink"
          value={searchParams.get("platform") ?? ""}
          onChange={(e) => updateParam("platform", e.target.value)}
        >
          <option value="">Platform: All</option>
          <option value="leetcode">LeetCode</option>
          <option value="neetcode">NeetCode</option>
          <option value="manual">Manual</option>
        </select>
        <select
          className="rounded-btn border border-border bg-surface px-2.5 py-2 text-[13px] text-ink"
          value={searchParams.get("level") ?? ""}
          onChange={(e) => updateParam("level", e.target.value)}
        >
          <option value="">Difficulty: All</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        <select
          className="rounded-btn border border-border bg-surface px-2.5 py-2 text-[13px] text-ink"
          value={searchParams.get("pattern") ?? ""}
          onChange={(e) => updateParam("pattern", e.target.value)}
        >
          <option value="">Pattern: All</option>
          {patterns.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          className="rounded-btn border border-border bg-surface px-2.5 py-2 text-[13px] text-ink"
          value={searchParams.get("language") ?? ""}
          onChange={(e) => updateParam("language", e.target.value)}
        >
          <option value="">Language: All</option>
          {languages.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select
          className="rounded-btn border border-border bg-surface px-2.5 py-2 text-[13px] text-ink"
          value={searchParams.get("synced") ?? ""}
          onChange={(e) => updateParam("synced", e.target.value)}
        >
          <option value="">Sync: All</option>
          <option value="true">Synced</option>
          <option value="false">Pending</option>
        </select>
      </div>

      {activeChips.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 px-6 pt-2.5">
          {activeChips.map((chip) => (
            <span
              key={chip.key}
              className="inline-flex items-center gap-1.5 rounded-pill bg-green-soft py-1 pl-3 pr-2 text-xs font-semibold text-green"
            >
              {chip.label}: {chip.key === "synced" ? (chip.value === "true" ? "Synced" : "Pending") : chip.value}
              <button
                type="button"
                onClick={() => updateParam(chip.key, "")}
                className="text-sm leading-none text-green"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      ) : null}
    </>
  );
}
