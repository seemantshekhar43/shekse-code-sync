import { useEffect, useState } from "react";
import { browser } from "wxt/browser";
import { postCapture } from "../../lib/api.js";
import { slugFromUrl } from "../../lib/leetcode.js";
import {
  CAPTURE_REQUEST,
  isMissingContentScriptError,
  type CaptureResponse,
} from "../../lib/messages.js";
import { DEFAULT_SETTINGS, getSettings, saveSettings, type Settings } from "../../lib/settings.js";
import "./popup.css";

type Result = { kind: "idle" | "loading" } | { kind: "ok"; text: string } | { kind: "err"; text: string };

export function App() {
  const [slug, setSlug] = useState<string | null>(null);
  const [result, setResult] = useState<Result>({ kind: "idle" });
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [savedTick, setSavedTick] = useState(false);

  useEffect(() => {
    void getSettings().then(setSettings);
    void browser.tabs
      .query({ active: true, currentWindow: true })
      .then(([tab]) => setSlug(slugFromUrl(tab?.url)));
  }, []);

  const problemName = slug ? slug.replace(/-/g, " ") : null;

  async function pullAndSend() {
    setResult({ kind: "loading" });
    try {
      const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
      const currentSlug = slugFromUrl(tab?.url);
      if (!tab?.id || !currentSlug) {
        setResult({ kind: "err", text: "Open a LeetCode problem page, then try again." });
        return;
      }
      let response: CaptureResponse;
      try {
        response = (await browser.tabs.sendMessage(tab.id, {
          type: CAPTURE_REQUEST,
          slug: currentSlug,
        })) as CaptureResponse;
      } catch (err) {
        if (isMissingContentScriptError(err)) {
          setResult({
            kind: "err",
            text: "Couldn't reach the LeetCode tab - reload the page and try again.",
          });
          return;
        }
        throw err;
      }
      if (!response?.ok) {
        setResult({ kind: "err", text: response?.error ?? "Could not read the submission." });
        return;
      }
      const current = await getSettings();
      await postCapture(current.apiBaseUrl, current.token, response.payload);
      setResult({ kind: "ok", text: `Sent "${response.payload.title}" to GitHub.` });
    } catch (err) {
      setResult({ kind: "err", text: (err as Error).message });
    }
  }

  async function onSave() {
    await saveSettings(settings);
    setSavedTick(true);
    setTimeout(() => setSavedTick(false), 1500);
  }

  return (
    <main className="popup">
      <header className="top">
        <span className="brand">
          <span className="dot" />
          ShekseCodeSync
        </span>
        <button className="link" onClick={() => setShowSettings((s) => !s)}>
          {showSettings ? "Done" : "Settings"}
        </button>
      </header>

      {showSettings ? (
        <section className="settings">
          <label>
            API base URL
            <input
              value={settings.apiBaseUrl}
              onChange={(e) => setSettings({ ...settings, apiBaseUrl: e.target.value })}
              placeholder={DEFAULT_SETTINGS.apiBaseUrl}
            />
          </label>
          <label>
            ShekseCodeSync token
            <input
              type="password"
              value={settings.token}
              onChange={(e) => setSettings({ ...settings, token: e.target.value })}
              placeholder="paste your token"
            />
          </label>
          <button className="btn" onClick={onSave}>
            {savedTick ? "Saved ✓" : "Save settings"}
          </button>
        </section>
      ) : (
        <section className="body">
          <div className="eyebrow">Current problem</div>
          <div className="prob">
            {problemName ? (
              <span className="ptitle">{problemName}</span>
            ) : (
              <span className="muted">No LeetCode problem detected in this tab.</span>
            )}
          </div>

          <button
            className="btn"
            disabled={!slug || result.kind === "loading"}
            onClick={pullAndSend}
          >
            {result.kind === "loading" ? "Pulling…" : "Pull & Send to GitHub →"}
          </button>

          {result.kind === "ok" && <p className="msg ok">{result.text}</p>}
          {result.kind === "err" && <p className="msg err">{result.text}</p>}
        </section>
      )}
    </main>
  );
}
