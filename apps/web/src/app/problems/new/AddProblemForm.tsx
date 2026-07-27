"use client";

import { useState, useTransition } from "react";
import { CodeEditor } from "../../CodeEditor";
import { createSubmission } from "./actions";

const platforms = ["leetcode", "neetcode", "manual"] as const;
const levels = ["easy", "medium", "hard"] as const;
const languages = ["java", "python", "typescript", "javascript", "cpp", "go"] as const;

const levelPillClass: Record<(typeof levels)[number], string> = {
  easy: "border-green text-green bg-green-soft",
  medium: "border-medium text-medium bg-medium/10",
  hard: "border-hard text-hard bg-hard/10",
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AddProblemForm() {
  const [platform, setPlatform] = useState<(typeof platforms)[number]>("leetcode");
  const [level, setLevel] = useState<(typeof levels)[number]>("easy");
  const [language, setLanguage] = useState<(typeof languages)[number]>("java");
  const [code, setCode] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState("");
  const [error, setError] = useState<string | undefined>();
  const [pending, startTransition] = useTransition();

  function addTag() {
    const value = tagDraft.trim().replace(/,$/, "");
    if (value && !tags.includes(value)) setTags([...tags, value]);
    setTagDraft("");
  }

  function handleSubmit(formData: FormData) {
    setError(undefined);
    formData.set("platform", platform);
    formData.set("level", level);
    formData.set("language", language);
    formData.set("code", code);
    formData.set("tags", tags.join(","));
    startTransition(async () => {
      const result = await createSubmission(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form action={handleSubmit}>
      <div className="grid grid-cols-1 gap-4 px-6 pb-1 pt-6 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-muted">
            Title
          </label>
          <input
            name="title"
            required
            placeholder="e.g. Longest Substring Without Repeating Characters"
            className="rounded-btn border border-border bg-surface px-3 py-2.5 text-[13.5px] text-ink outline-none placeholder:text-faint"
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-muted">
            Question link
          </label>
          <input
            name="questionLink"
            type="url"
            required
            placeholder="https://leetcode.com/problems/…"
            className="rounded-btn border border-border bg-surface px-3 py-2.5 text-[13.5px] text-ink outline-none placeholder:text-faint"
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-muted">
            Platform
          </label>
          <div className="flex flex-wrap gap-2">
            {platforms.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatform(p)}
                className={`rounded-pill border px-3.5 py-1.5 text-xs font-semibold capitalize ${
                  platform === p
                    ? "border-green bg-green-soft text-green"
                    : "border-border bg-surface text-muted"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-muted">
            Difficulty
          </label>
          <div className="flex flex-wrap gap-2">
            {levels.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLevel(l)}
                className={`rounded-pill border px-3.5 py-1.5 text-xs font-semibold capitalize ${
                  level === l ? levelPillClass[l] : "border-border bg-surface text-muted"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-muted">
            Language
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as (typeof languages)[number])}
            className="rounded-btn border border-border bg-surface px-3 py-2.5 text-[13.5px] text-ink outline-none"
          >
            {languages.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-muted">
            Solved date
          </label>
          <input
            name="solvedAt"
            type="date"
            required
            defaultValue={todayIso()}
            className="rounded-btn border border-border bg-surface px-3 py-2.5 text-[13.5px] text-ink outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-muted">
            Tags / topics
          </label>
          <div className="flex flex-wrap items-center gap-1.5 rounded-btn border border-border bg-surface px-2.5 py-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface-2 px-2.5 py-1 text-[11.5px] font-semibold text-ink"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => setTags(tags.filter((t) => t !== tag))}
                  className="font-bold text-faint"
                >
                  ×
                </button>
              </span>
            ))}
            <input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag();
                }
              }}
              onBlur={addTag}
              placeholder="Type and press Enter…"
              className="min-w-[100px] flex-1 bg-transparent text-[12.5px] outline-none placeholder:text-faint"
            />
          </div>
          <p className="text-[11px] text-faint">
            Press Enter or comma to add a tag. Same field drives topics used in Insights.
          </p>
        </div>

        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-muted">
            Solution code
          </label>
          <div className="flex items-center justify-between rounded-t-btn border border-b-0 border-border bg-surface-2 px-3 py-2">
            <span className="rounded-md border border-border bg-surface px-2 py-0.5 font-mono text-[11px] font-semibold text-muted">
              {language}
            </span>
          </div>
          <CodeEditor value={code} onChange={setCode} language={language} minHeight="200px" />
        </div>
      </div>

      {error ? (
        <p className="mx-6 mt-4 rounded-card border border-hard/30 bg-hard/10 px-3.5 py-2.5 text-[12.5px] text-hard">
          {error}
        </p>
      ) : null}

      <div className="mt-6 flex items-center justify-between border-t border-border px-6 py-5">
        <p className="text-[11.5px] text-faint">
          Submits as a CaptureSubmission to the same POST /submissions the extension uses.
        </p>
        <div className="flex gap-2.5">
          <a
            href="/problems"
            className="rounded-btn border border-border px-4 py-2.5 text-[13px] font-semibold text-muted"
          >
            Cancel
          </a>
          <button
            type="submit"
            disabled={pending}
            className="rounded-btn bg-green px-5 py-2.5 text-[13px] font-semibold text-white disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save problem"}
          </button>
        </div>
      </div>
    </form>
  );
}
