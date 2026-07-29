"use client";

import { useState } from "react";

export function TokenCopyField({ token }: { token: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked - the user can still select the field manually.
    }
  }

  return (
    <div className="flex gap-1.5">
      <input
        readOnly
        value={token}
        onFocus={(e) => e.currentTarget.select()}
        className="min-w-0 flex-1 rounded-card border border-border bg-surface px-2.5 py-1.5 font-mono text-[11.5px] text-muted"
      />
      <button
        type="button"
        onClick={copy}
        className="flex-none rounded-card border border-border bg-surface-2 px-2.5 py-1.5 text-[11.5px] font-semibold text-ink"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
