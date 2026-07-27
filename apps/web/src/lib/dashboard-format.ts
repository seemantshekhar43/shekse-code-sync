export const pillClass: Record<string, string> = {
  easy: "text-green bg-green-soft",
  medium: "text-medium bg-medium/10",
  hard: "text-hard bg-hard/10",
};

export function safeHttpUrl(link: string): string | null {
  try {
    const url = new URL(link);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

/** "2m ago" / "3h ago" / "yesterday" / locale date, matching the mockup's recency labels. */
export function relativeSolved(date: Date): string {
  const ms = Date.now() - date.getTime();
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const chars = parts.length > 1 ? [parts[0], parts[parts.length - 1]] : [parts[0]];
  return chars.map((p) => p[0]?.toUpperCase() ?? "").join("");
}
