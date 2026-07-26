import { prisma } from "@scs/db";

/**
 * Persist a user's GitHub App installation + target repo, resolved from the
 * post-install redirect. `fullName` is "owner/repo".
 */
export async function persistInstallation(
  userId: string,
  installationId: number,
  fullName: string,
): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      githubInstallationId: String(installationId),
      githubRepo: fullName,
    },
  });
}
