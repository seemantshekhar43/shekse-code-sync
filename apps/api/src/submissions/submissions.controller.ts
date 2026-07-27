import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CaptureSubmission, SetRevisionFlag, SubmissionQuery, type SubmissionSummary } from "@scs/types";
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
  async code(@CurrentUserId() userId: string, @Param("id") id: string) {
    return this.submissions.getCode(userId, id);
  }

  @Patch(":id/revision-flag")
  async setRevisionFlag(
    @CurrentUserId() userId: string,
    @Param("id") id: string,
    @Body() body: unknown,
  ): Promise<{ isMarkedForRevision: boolean }> {
    const input = SetRevisionFlag.parse(body);
    await this.submissions.setRevisionFlag(userId, id, input.isMarkedForRevision);
    return input;
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
