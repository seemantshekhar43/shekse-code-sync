import { Injectable } from "@nestjs/common";
import { prisma } from "@scs/db";

@Injectable()
export class UsersService {
  async upsertByEmail(email: string, name: string | null): Promise<{ id: string }> {
    return prisma.user.upsert({
      where: { email },
      update: { name: name ?? undefined },
      create: { email, name },
      select: { id: true },
    });
  }

  async get(userId: string): Promise<{ tokenVersion: number; githubRepo: string | null }> {
    return prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { tokenVersion: true, githubRepo: true },
    });
  }

  async setInstallation(
    userId: string,
    githubInstallationId: string,
    githubRepo: string,
  ): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { githubInstallationId, githubRepo },
    });
  }

  /**
   * Clears the stored installation and bumps `tokenVersion` (invalidating
   * every previously-minted extension token), returning the installation id
   * that was in place beforehand so the caller can best-effort revoke it on
   * GitHub's side.
   */
  async disconnect(userId: string): Promise<{ previousInstallationId: string | null }> {
    const user = await prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { githubInstallationId: true },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { githubInstallationId: null, githubRepo: null, tokenVersion: { increment: 1 } },
    });
    return { previousInstallationId: user.githubInstallationId };
  }
}
