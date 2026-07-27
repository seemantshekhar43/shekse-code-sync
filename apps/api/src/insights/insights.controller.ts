import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import type { InsightsSummary } from "@scs/types";
import { CurrentUserId, ScsAuthGuard } from "../auth/scs-auth.guard.js";
import { InsightsService } from "./insights.service.js";

@Controller("insights")
@UseGuards(ScsAuthGuard)
export class InsightsController {
  constructor(private readonly insights: InsightsService) {}

  @Get()
  async summary(
    @CurrentUserId() userId: string,
    @Query("year") year?: string,
  ): Promise<InsightsSummary> {
    const parsedYear = year ? Number(year) : new Date().getUTCFullYear();
    return this.insights.summary(userId, Number.isInteger(parsedYear) ? parsedYear : new Date().getUTCFullYear());
  }
}
