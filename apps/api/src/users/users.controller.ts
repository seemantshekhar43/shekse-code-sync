import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { InternalAuthGuard } from "../auth/internal-auth.guard.js";
import { UsersService } from "./users.service.js";

/**
 * Internal, service-to-service surface `web` calls directly (never exposed
 * to the extension or browser) so Postgres never has to be reachable from
 * wherever `web` is hosted - only `api` needs a network path to the DB.
 */
@Controller("internal/users")
@UseGuards(InternalAuthGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Post("upsert-by-email")
  async upsertByEmail(
    @Body() body: { email: string; name: string | null },
  ): Promise<{ id: string }> {
    return this.users.upsertByEmail(body.email, body.name);
  }

  @Get(":id")
  async get(
    @Param("id") id: string,
  ): Promise<{ tokenVersion: number; githubRepo: string | null }> {
    return this.users.get(id);
  }

  @Patch(":id/installation")
  async setInstallation(
    @Param("id") id: string,
    @Body() body: { githubInstallationId: string; githubRepo: string },
  ): Promise<Record<string, never>> {
    await this.users.setInstallation(id, body.githubInstallationId, body.githubRepo);
    return {};
  }

  @Post(":id/disconnect")
  async disconnect(@Param("id") id: string): Promise<{ previousInstallationId: string | null }> {
    return this.users.disconnect(id);
  }
}
