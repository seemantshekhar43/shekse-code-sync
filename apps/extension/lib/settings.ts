import { browser } from "wxt/browser";

/** User-configurable extension settings, persisted in browser.storage.local. */
export interface Settings {
  apiBaseUrl: string;
  token: string;
}

export const DEFAULT_SETTINGS: Settings = {
  apiBaseUrl: import.meta.env.PROD ? "https://api-codesync.shekse.com" : "http://localhost:3001",
  token: "",
};

export async function getSettings(): Promise<Settings> {
  const stored = await browser.storage.local.get("settings");
  return { ...DEFAULT_SETTINGS, ...((stored.settings as Partial<Settings>) ?? {}) };
}

export async function saveSettings(settings: Settings): Promise<void> {
  await browser.storage.local.set({ settings });
}
