import type { CaptureSubmission } from "@scs/types";

/** POST a capture to the ShekseCodeSync API, authenticated with the user's token. */
export async function postCapture(
  baseUrl: string,
  token: string,
  payload: CaptureSubmission,
): Promise<{ id: string }> {
  const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/submissions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`API responded ${res.status}${detail ? `: ${detail}` : ""}`);
  }
  return (await res.json()) as { id: string };
}
