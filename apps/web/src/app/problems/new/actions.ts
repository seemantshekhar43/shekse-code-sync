"use server";

import { redirect } from "next/navigation";
import type { CaptureSubmission } from "@scs/types";
import { auth } from "../../../auth";
import { mintScsToken } from "../../../lib/scs-token";

const apiBase = () => process.env.API_BASE_URL ?? "http://localhost:3001";

export interface AddProblemState {
  error?: string;
}

/** Submits a manually-entered problem as a CaptureSubmission, the same contract the extension uses. */
export async function createSubmission(formData: FormData): Promise<AddProblemState> {
  const session = await auth();
  if (!session?.userId) {
    return { error: "Your session expired - sign in again from the overview." };
  }

  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  const payload: CaptureSubmission = {
    title: String(formData.get("title") ?? ""),
    questionLink: String(formData.get("questionLink") ?? ""),
    platform: String(formData.get("platform") ?? "manual") as CaptureSubmission["platform"],
    level: String(formData.get("level") ?? "medium") as CaptureSubmission["level"],
    statement: String(formData.get("statement") ?? ""),
    tags,
    topics: tags,
    companies: [],
    solution: {
      language: String(formData.get("language") ?? "java"),
      code: String(formData.get("code") ?? ""),
    },
    status: "accepted",
    solvedAt: new Date(String(formData.get("solvedAt") ?? new Date().toISOString())),
  };

  const token = await mintScsToken(session.userId);
  const res = await fetch(`${apiBase()}/submissions`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    return { error: "Couldn't save that submission - check the fields and try again." };
  }

  redirect("/problems");
}
