import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { CaptureSubmission, type SubmissionSummary } from "@scs/types";
import { CurrentUserId, ScsAuthGuard } from "../auth/scs-auth.guard.js";
import { SubmissionsService } from "./submissions.service.js";

@Controller("submissions")
@UseGuards(ScsAuthGuard)
export class SubmissionsController {
  constructor(private readonly submissions: SubmissionsService) {}

  @Get()
  async list(@CurrentUserId() userId: string): Promise<SubmissionSummary[]> {
    return this.submissions.list(userId);
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
