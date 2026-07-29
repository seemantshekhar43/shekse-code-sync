import { auth } from "../../auth";
import { getHeaderData } from "../../lib/header-data";
import {
  EXTENSION_CI_BUILD_URL,
  EXTENSION_REPO_URL,
  getLatestExtensionRelease,
} from "../../lib/extension-release";
import { DashboardHeader } from "../DashboardHeader";
import { TokenCopyField } from "./TokenCopyField";

const steps = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="5" y="7" width="14" height="12" rx="1" />
        <path d="M12 10v5m0 0l-2.5-2.5M12 15l2.5-2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Unzip the download",
    body: "Extract the .zip somewhere you'll remember.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="12" cy="12" r="6.5" />
        <path d="M12 8.5v4l2.5 1.5" strokeLinecap="round" />
      </svg>
    ),
    title: "Open chrome://extensions",
    body: (
      <>
        Enable <strong className="text-ink">Developer mode</strong> in the top right corner.
      </>
    ),
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="4" y="6" width="16" height="11" rx="1" />
        <path d="M8 17v2h8v-2" />
        <path d="M12 9v4.5m0 0l-2-2m2 2l2-2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Load unpacked",
    body: (
      <>
        Click <strong className="text-ink">Load unpacked</strong> and select the unzipped folder.
      </>
    ),
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 5l1.9 3.9 4.3.6-3.1 3 .7 4.3L12 14.8l-3.8 2 .7-4.3-3.1-3 4.3-.6z" strokeLinejoin="round" />
      </svg>
    ),
    title: "Pin the extension",
    body: "Click the puzzle-piece icon in Chrome's toolbar and pin ShekseCodeSync.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="4.5" y="8.5" width="15" height="7" rx="3.5" />
        <circle cx="9" cy="12" r="1.4" fill="currentColor" stroke="none" />
      </svg>
    ),
    title: "Paste your token",
    body: "Open the popup and paste the token below to connect your account.",
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 13l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "You're syncing",
    body: "Solve on LeetCode as usual - accepted submissions sync automatically.",
  },
];

export default async function ExtensionPage() {
  const session = await auth();
  if (!session?.userId) {
    return (
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-8 py-24">
        <p className="text-[15px] text-muted">Sign in from the overview to get the extension.</p>
        <a href="/" className="mt-3 text-sm font-semibold text-green underline">
          Go to overview
        </a>
      </main>
    );
  }

  const [headerData, release] = await Promise.all([
    getHeaderData(session),
    getLatestExtensionRelease(),
  ]);

  return (
    <main className="min-h-screen bg-paper">
      <DashboardHeader
        active="/extension"
        displayName={headerData.displayName}
        githubHandle={headerData.githubHandle}
        githubRepo={headerData.githubRepo}
        manageUrl={headerData.manageUrl}
        connectUrl={headerData.connectUrl}
        token={headerData.token}
      />
      <div className="mx-auto max-w-5xl px-6 py-8">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.12em] text-green">
          Get the extension
        </p>
        <h1 className="font-serif text-[28px] font-semibold leading-tight">
          Capture every submission <span className="text-green">[in one click]</span>.
        </h1>
        <p className="mb-7 mt-2 max-w-xl text-[14.5px] text-muted">
          Not yet on the Chrome Web Store - install the packaged build from GitHub Releases and
          connect it with your account token.
        </p>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-card border border-border bg-surface px-5 py-4">
          <div className="min-w-0">
            <div className="mb-1 font-mono text-[11.5px] text-faint">
              {release ? `LATEST RELEASE · v${release.version}` : "NO RELEASE PUBLISHED YET"}
            </div>
            <div className="truncate font-serif text-lg font-semibold">
              {release?.assetName ?? "Build from the tip of main instead"}
            </div>
          </div>
          <div className="flex flex-none gap-2.5">
            <a
              href={EXTENSION_CI_BUILD_URL}
              className="rounded-btn border border-border px-3.5 py-2.5 text-[13px] font-semibold text-muted"
            >
              Unreleased build (main)
            </a>
            {release ? (
              <a
                href={release.downloadUrl}
                className="rounded-btn bg-green px-4 py-2.5 text-[13px] font-semibold text-white"
              >
                Download .zip
              </a>
            ) : (
              <a
                href={EXTENSION_REPO_URL}
                className="rounded-btn bg-green px-4 py-2.5 text-[13px] font-semibold text-white"
              >
                View on GitHub
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.title} className="rounded-card border border-border px-[18px] py-4">
              <div className="mb-3 flex h-[42px] w-[42px] items-center justify-center rounded-full bg-green-soft font-mono text-[13px] font-bold text-green">
                {i + 1}
              </div>
              <div className="mb-3 text-green">{step.icon}</div>
              <h4 className="mb-1 text-[13.5px] font-semibold">{step.title}</h4>
              <p className="text-xs text-muted">{step.body}</p>
              {step.title === "Paste your token" ? (
                <div className="mt-3">
                  <TokenCopyField token={headerData.token} />
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-start gap-2 border-t border-border pt-[18px] text-xs text-muted">
          <span className="mt-0.5 flex-none text-medium">●</span>
          <span>
            Not a store install, so updates aren&apos;t automatic - repeat these steps with the newer
            .zip when a new version ships.
          </span>
        </div>
      </div>
    </main>
  );
}
