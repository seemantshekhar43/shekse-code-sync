export const metadata = {
  title: "Privacy Policy - ShekseCodeSync",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-2xl px-6 py-16">
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.12em] text-green">
          Privacy
        </p>
        <h1 className="font-serif text-[28px] font-semibold leading-tight">
          ShekseCodeSync <span className="text-green">[privacy policy]</span>
        </h1>
        <p className="mt-2 text-xs text-faint">Last updated: July 29, 2026</p>

        <div className="mt-8 space-y-6 text-[14.5px] leading-relaxed text-ink">
          <p>
            ShekseCodeSync (the &quot;Extension&quot;) captures your accepted LeetCode
            submissions and syncs them to your own ShekseCodeSync account and GitHub
            repository. This policy describes what data the Extension handles and how.
          </p>

          <section>
            <h2 className="mb-2 font-serif text-lg font-semibold">What the Extension reads</h2>
            <p className="mb-2 text-muted">
              When you accept a submission on <code>leetcode.com</code>, the Extension&apos;s
              content script reads, from LeetCode&apos;s own page data:
            </p>
            <ul className="list-disc space-y-1 pl-5 text-muted">
              <li>The problem: title, slug, difficulty, statement, and topic tags.</li>
              <li>
                Your submission: language, source code, runtime, memory usage, and the
                accepted timestamp.
              </li>
            </ul>
            <p className="mt-2 text-muted">
              The Extension does not read anything else on <code>leetcode.com</code> and does
              not run on any other site.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-lg font-semibold">
              What the Extension stores and sends
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-muted">
              <li>
                <strong className="text-ink">Locally</strong> (browser storage): your
                configured ShekseCodeSync API URL and your account access token, so the
                Extension can authenticate without asking you to sign in every time.
              </li>
              <li>
                <strong className="text-ink">Sent to your ShekseCodeSync API</strong>: the
                problem and submission data above, over HTTPS, authenticated with your token.
                The API stores this in its database and pushes a copy (question + solution)
                to the GitHub repository you connected. If AI enrichment is enabled on your
                account, your submitted code and problem text are also sent to the configured
                AI provider (Anthropic by default) to generate complexity/pattern analysis.
              </li>
            </ul>
            <p className="mt-2 text-muted">
              The Extension never sends data to any third party other than the ShekseCodeSync
              API you&apos;ve configured, and it never sells or shares your data.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-lg font-semibold">
              What the Extension does not do
            </h2>
            <ul className="list-disc space-y-1 pl-5 text-muted">
              <li>No advertising, tracking pixels, or analytics SDKs.</li>
              <li>No access to browsing history, other tabs, or sites other than leetcode.com.</li>
              <li>
                No credentials are collected by the Extension itself; GitHub access is
                authorized separately through your ShekseCodeSync account (a GitHub App
                installation), not through the Extension.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-lg font-semibold">
              Data retention and deletion
            </h2>
            <p className="text-muted">
              Your submission data lives in your own GitHub repository (which you control) and
              in the ShekseCodeSync database tied to your account. To remove it, delete the
              relevant files/commits from your repository and contact the maintainer (or use
              in-app account deletion, once available) to remove your database records.
            </p>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-lg font-semibold">Permissions justification</h2>
            <ul className="list-disc space-y-1 pl-5 text-muted">
              <li>
                <code>storage</code> - persist your API URL and access token locally.
              </li>
              <li>
                <code>tabs</code> - detect when you&apos;re on a LeetCode submission page.
              </li>
              <li>
                Host permission for <code>leetcode.com</code> - read problem/submission data
                via LeetCode&apos;s page.
              </li>
              <li>Host permission for the ShekseCodeSync API host - send captured submissions to your account.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-2 font-serif text-lg font-semibold">Contact</h2>
            <p className="text-muted">
              Questions about this policy: open an issue on the{" "}
              <a
                href="https://github.com/seemantshekhar43/shekse-code-sync"
                className="font-semibold text-green underline"
              >
                ShekseCodeSync GitHub repository
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
