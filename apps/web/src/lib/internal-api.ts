/**
 * Client for `api`'s `/internal/users/*` routes - the only path `web` uses to
 * read or write user rows. `web` never imports `@scs/db`/Prisma directly, so
 * Postgres only ever needs to be reachable from wherever `api` runs, not from
 * wherever `web` runs.
 */
async function internalFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const baseUrl = process.env.API_BASE_URL;
  const secret = process.env.INTERNAL_API_SECRET;
  if (!baseUrl) throw new Error("API_BASE_URL is not set");
  if (!secret) throw new Error("INTERNAL_API_SECRET is not set");

  const res = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-internal-secret": secret,
      ...init?.headers,
    },
  });
  if (!res.ok) {
    throw new Error(`internal API ${path} failed with ${res.status}`);
  }
  return (await res.json()) as T;
}

export async function upsertUserByEmail(
  email: string,
  name: string | null,
): Promise<{ id: string }> {
  return internalFetch("/internal/users/upsert-by-email", {
    method: "POST",
    body: JSON.stringify({ email, name }),
  });
}

export async function getUser(
  userId: string,
): Promise<{ tokenVersion: number; githubRepo: string | null }> {
  return internalFetch(`/internal/users/${userId}`);
}

export async function setInstallation(
  userId: string,
  githubInstallationId: string,
  githubRepo: string,
): Promise<void> {
  await internalFetch(`/internal/users/${userId}/installation`, {
    method: "PATCH",
    body: JSON.stringify({ githubInstallationId, githubRepo }),
  });
}

export async function disconnectUser(
  userId: string,
): Promise<{ previousInstallationId: string | null }> {
  return internalFetch(`/internal/users/${userId}/disconnect`, { method: "POST" });
}
