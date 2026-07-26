import { listInstallationRepos } from "@scs/github";
import { redirect } from "next/navigation";
import { auth } from "../../../../auth";
import { persistInstallation } from "../../../../lib/github-install";

/**
 * Repo picker for the multi-repo install case: the installation grants access
 * to more than one repository, so the user chooses which one to sync to.
 */
export default async function SelectRepoPage({
  searchParams,
}: {
  searchParams: { installation_id?: string };
}) {
  const session = await auth();
  if (!session?.userId) redirect("/");

  const installationId = Number(searchParams.installation_id);
  if (!Number.isInteger(installationId) || installationId <= 0) {
    redirect("/?github=missing_installation");
  }

  const userId = session.userId;
  const repos = await listInstallationRepos(installationId);
  if (repos.length === 0) redirect("/?github=no_repos");
  if (repos.length === 1) {
    await persistInstallation(userId, installationId, repos[0].fullName);
    redirect("/?github=connected");
  }

  async function choose(formData: FormData) {
    "use server";
    const fullName = String(formData.get("repo"));
    if (repos.some((r) => r.fullName === fullName)) {
      await persistInstallation(userId, installationId, fullName);
    }
    redirect("/?github=connected");
  }

  return (
    <main className="mx-auto max-w-lg p-10">
      <h1 className="text-2xl font-bold">Choose a repo to sync to</h1>
      <p className="mt-2 text-sm text-gray-600">
        Your GitHub App installation grants access to several repositories. Pick the one
        ShekseCodeSync should commit your solutions to.
      </p>
      <form action={choose} className="mt-6 space-y-2">
        {repos.map((r) => (
          <label
            key={r.fullName}
            className="flex items-center gap-2 rounded border border-gray-200 px-3 py-2 text-sm"
          >
            <input type="radio" name="repo" value={r.fullName} required />
            <span className="font-mono">{r.fullName}</span>
          </label>
        ))}
        <button
          type="submit"
          className="mt-4 rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white"
        >
          Connect
        </button>
      </form>
    </main>
  );
}
