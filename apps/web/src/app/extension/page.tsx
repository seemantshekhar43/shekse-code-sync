import Image from "next/image";
import { auth } from "../../auth";
import { getHeaderData } from "../../lib/header-data";
import { EXTENSION_STORE_URL } from "../../lib/extension-links";
import { DashboardHeader } from "../DashboardHeader";
import { TokenCopyField } from "./TokenCopyField";

const steps = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M12 5l1.9 3.9 4.3.6-3.1 3 .7 4.3L12 14.8l-3.8 2 .7-4.3-3.1-3 4.3-.6z" strokeLinejoin="round" />
      </svg>
    ),
    title: "Add to Chrome",
    body: (
      <>
        Install ShekseCodeSync from the{" "}
        <a href={EXTENSION_STORE_URL} className="font-semibold text-green underline">
          Chrome Web Store
        </a>{" "}
        - one click, no dev mode.
      </>
    ),
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="4.5" y="8.5" width="15" height="7" rx="3.5" />
        <circle cx="9" cy="12" r="1.4" fill="currentColor" stroke="none" />
      </svg>
    ),
    title: "Paste your token",
    body: "Open the extension's Settings and paste the token below to connect your account.",
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

  const headerData = await getHeaderData(session);

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
          ShekseCodeSync is live on the Chrome Web Store - install it, connect your account, and
          every accepted solution commits itself to GitHub.
        </p>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-card border border-border bg-surface px-5 py-4">
          <div className="min-w-0">
            <div className="mb-1 font-mono text-[11.5px] text-faint">CHROME WEB STORE</div>
            <div className="truncate font-serif text-lg font-semibold">ShekseCodeSync</div>
          </div>
          <div className="flex flex-none gap-2.5">
            <a
              href={EXTENSION_STORE_URL}
              className="rounded-btn bg-green px-4 py-2.5 text-[13px] font-semibold text-white"
            >
              Add to Chrome
            </a>
          </div>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="overflow-hidden rounded-card border border-border shadow-sm">
            <Image
              src="/marketing/extension-context.png"
              alt="ShekseCodeSync popup open on a LeetCode problem page, ready to send the accepted solution"
              width={785}
              height={656}
              className="w-full"
              priority
            />
          </div>
          <div className="overflow-hidden rounded-card border border-border shadow-sm">
            <Image
              src="/marketing/extension-sync.png"
              alt="ShekseCodeSync popup after sending a solved problem to GitHub"
              width={760}
              height={560}
              className="w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
                  <div className="mt-3 overflow-hidden rounded-card border border-border">
                    <Image
                      src="/marketing/extension-settings.png"
                      alt="ShekseCodeSync settings popup with the API base URL and account token fields"
                      width={338}
                      height={241}
                      className="w-full"
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>

        <div className="mt-6 flex items-start gap-2 border-t border-border pt-[18px] text-xs text-muted">
          <span className="mt-0.5 flex-none text-medium">●</span>
          <span>Installed from the Chrome Web Store, so updates arrive automatically.</span>
        </div>
      </div>
    </main>
  );
}
