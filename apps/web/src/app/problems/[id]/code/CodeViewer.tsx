"use client";

import { CodeEditor } from "../../../CodeEditor";

/** Read-only CodeMirror surface for a captured submission's code. */
export function CodeViewer({ code, language }: { code: string; language: string }) {
  return (
    <div>
      <div className="flex items-center justify-between rounded-t-btn border border-border bg-surface-2 px-3 py-2">
        <span className="rounded-md border border-border bg-surface px-2 py-0.5 font-mono text-[11px] font-semibold text-muted">
          {language}
        </span>
      </div>
      <CodeEditor value={code} language={language} readOnly minHeight="180px" />
    </div>
  );
}
