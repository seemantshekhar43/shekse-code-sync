"use server";

import { revalidatePath } from "next/cache";
import { auth } from "../auth";
import { mintScsToken } from "../lib/scs-token";

const apiBase = () => process.env.API_BASE_URL ?? "http://localhost:3001";

/** Records a self-rated revision attempt, which reschedules the submission's next `dueAt`. */
export async function recordRevisionAttempt(submissionId: string, selfRating: number): Promise<void> {
  const session = await auth();
  if (!session?.userId) return;
  const token = await mintScsToken(session.userId);
  const res = await fetch(`${apiBase()}/revisions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ submissionId, selfRating }),
  });
  if (!res.ok) {
    throw new Error(`Failed to record revision attempt (${res.status})`);
  }
  revalidatePath("/");
}

/** Marks or unmarks a submission for revision (Problems screen toggle). */
export async function setRevisionFlag(submissionId: string, isMarkedForRevision: boolean): Promise<void> {
  const session = await auth();
  if (!session?.userId) return;
  const token = await mintScsToken(session.userId);
  const res = await fetch(`${apiBase()}/submissions/${submissionId}/revision-flag`, {
    method: "PATCH",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ isMarkedForRevision }),
  });
  if (!res.ok) {
    throw new Error(`Failed to update revision flag (${res.status})`);
  }
  revalidatePath("/problems");
  revalidatePath("/");
}
