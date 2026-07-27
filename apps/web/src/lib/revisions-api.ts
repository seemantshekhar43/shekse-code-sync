import { RevisionQueueItem as QueueItemSchema, type RevisionQueueItem } from "@scs/types";

const apiBase = () => process.env.API_BASE_URL ?? "http://localhost:3001";

/** Fetch the signed-in user's currently-due revision queue. */
export async function getRevisionQueue(token: string): Promise<RevisionQueueItem[]> {
  return fetchQueue(token, "queue");
}

/** Fetch every marked-for-revision submission, regardless of due date. */
export async function getFullRevisionQueue(token: string): Promise<RevisionQueueItem[]> {
  return fetchQueue(token, "full-queue");
}

async function fetchQueue(token: string, path: "queue" | "full-queue"): Promise<RevisionQueueItem[]> {
  try {
    const res = await fetch(`${apiBase()}/revisions/${path}`, {
      cache: "no-store",
      headers: { authorization: `Bearer ${token}` },
    });
    if (!res.ok) return [];
    return QueueItemSchema.array().parse(await res.json());
  } catch {
    // API not reachable yet (e.g. during local scaffold) - render empty.
    return [];
  }
}
