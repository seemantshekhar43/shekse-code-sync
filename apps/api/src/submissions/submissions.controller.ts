import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CaptureSubmission, SubmissionQuery, type SubmissionSummary } from "@scs/types";
import { CurrentUserId, ScsAuthGuard } from "../auth/scs-auth.guard.js";
import { SubmissionsService } from "./submissions.service.js";

@Controller("submissions")
@UseGuards(ScsAuthGuard)
export class SubmissionsController {
  constructor(private readonly submissions: SubmissionsService) {}

  @Get()
  async list(
    @CurrentUserId() userId: string,
    @Query() query: Record<string, string>,
  ): Promise<SubmissionSummary[]> {
    const hasFilters = Object.keys(query).length > 0;
    return this.submissions.list(userId, hasFilters ? SubmissionQuery.parse(query) : undefined);
  }

  @Get(":id/code")
  async code(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
  ): Promise<{ language: string; code: string }> {
    return this.submissions.getCode(userId, id);
  }

  @Post()
  async capture(
    @CurrentUserId() userId: string,
    @Body() body: unknown,
  ): Promise<{ id: string }> {
    const input = CaptureSubmission.parse(body);
    return this.submissions.capture(userId, input);
  }
}
