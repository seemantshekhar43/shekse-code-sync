"use client";

import { useState } from "react";

/** Read-only token display with a copy-to-clipboard button. */
export function TokenField({ token }: { token: string }) {
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
    <div className="mt-2 flex gap-2">
      <input
        readOnly
        value={token}
        onFocus={(e) => e.currentTarget.select()}
        className="flex-1 rounded border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-xs"
      />
      <button
        type="button"
        onClick={copy}
        className="rounded bg-gray-900 px-3 py-1 text-xs font-medium text-white"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
