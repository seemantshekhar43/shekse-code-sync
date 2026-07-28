"use client";

import { useEffect, useRef, useState } from "react";
import { initials } from "../lib/dashboard-format";

export function AvatarMenu({
  displayName,
  githubHandle,
  githubRepo,
  manageUrl,
  connectUrl,
  token,
  signOutAction,
  disconnectAction,
}: {
  displayName: string;
  githubHandle: string | null;
  githubRepo: string | null;
  manageUrl?: string;
  connectUrl?: string;
  token: string;
  signOutAction: () => Promise<void>;
  disconnectAction: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [disconnected, setDisconnected] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  async function copyToken() {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard blocked - the user can still select the field manually.
    }
  }

  async function confirmDisconnect() {
    setDisconnecting(true);
    try {
      await disconnectAction();
      setDisconnected(true);
      setConfirmingDisconnect(false);
    } finally {
      setDisconnecting(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={displayName}
        aria-expanded={open}
        className={`flex h-[30px] w-[30px] items-center justify-center rounded-full bg-green text-xs font-semibold text-white ${
          open ? "ring-2 ring-green-soft" : ""
        }`}
      >
        {initials(displayName)}
      </button>

      {open ? (
        <div className="absolute right-0 top-[38px] z-10 w-80 rounded-shell border border-border bg-paper shadow-shell">
          <div className="flex items-center gap-2.5 border-b border-border px-4 py-4">
            <div className="flex h-[38px] w-[38px] flex-none items-center justify-center rounded-full bg-green text-[13px] font-semibold text-white">
              {initials(displayName)}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[13.5px] font-semibold">{displayName}</div>
              {githubHandle ? (
                <div className="truncate font-mono text-xs text-muted">@{githubHandle}</div>
              ) : null}
            </div>
          </div>

          <div className="border-b border-border px-4 py-3.5">
            <h4 className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.11em] text-faint">
              GitHub repo
            </h4>
            {githubRepo && !disconnected ? (
              confirmingDisconnect ? (
                <div className="flex flex-col gap-2.5">
                  <p className="text-xs text-ink">
                    Disconnect <span className="font-mono font-semibold">{githubRepo}</span>? Captures
                    will stop syncing until you reconnect.
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmingDisconnect(false)}
                      disabled={disconnecting}
                      className="rounded-btn border border-border bg-surface-2 px-2.5 py-1.5 text-xs font-semibold text-ink disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={confirmDisconnect}
                      disabled={disconnecting}
                      className="rounded-btn bg-hard px-2.5 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                    >
                      {disconnecting ? "Disconnecting..." : "Disconnect"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="h-[6px] w-[6px] flex-none rounded-full bg-green" />
                    <span className="truncate font-mono text-xs font-medium">{githubRepo}</span>
                  </div>
                  <div className="flex gap-4">
                    {manageUrl ? (
                      <a href={manageUrl} className="text-xs font-semibold text-green">
                        Manage
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => setConfirmingDisconnect(true)}
                      className="text-xs font-semibold text-hard"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div>
                <p className="mb-2 text-xs text-muted">
                  No repo connected yet - captures won&apos;t commit anywhere.
                </p>
                {connectUrl ? (
                  <a
                    href={connectUrl}
                    className="inline-block rounded-btn bg-green px-2.5 py-1.5 text-xs font-semibold text-white"
                  >
                    Connect GitHub repo
                  </a>
                ) : null}
              </div>
            )}
          </div>

          <div className="border-b border-border px-4 py-3.5">
            <h4 className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.11em] text-faint">
              Extension token
            </h4>
            <p className="mb-2 text-xs text-muted">
              Paste into the browser extension to sync captures.
            </p>
            <div className="flex gap-1.5">
              <input
                readOnly
                value={token}
                onFocus={(e) => e.currentTarget.select()}
                className="min-w-0 flex-1 rounded-card border border-border bg-surface px-2 py-1.5 font-mono text-[11.5px] text-muted"
              />
              <button
                type="button"
                onClick={copyToken}
                className="flex-none rounded-card border border-border bg-surface-2 px-2.5 py-1.5 text-[11.5px] font-semibold text-ink"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <div className="px-4 py-3">
            <form action={signOutAction}>
              <button type="submit" className="py-1 text-[13px] font-semibold text-hard">
                Sign out
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
