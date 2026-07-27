import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { RecordRevisionAttempt, type RevisionAttemptResult, type RevisionQueueItem } from "@scs/types";
import { CurrentUserId, ScsAuthGuard } from "../auth/scs-auth.guard.js";
import { RevisionsService } from "./revisions.service.js";

@Controller("revisions")
@UseGuards(ScsAuthGuard)
export class RevisionsController {
  constructor(private readonly revisions: RevisionsService) {}

  @Get("queue")
  async queue(@CurrentUserId() userId: string): Promise<RevisionQueueItem[]> {
    return this.revisions.queue(userId);
  }

  @Post()
  async record(
    @CurrentUserId() userId: string,
    @Body() body: unknown,
  ): Promise<RevisionAttemptResult> {
    const input = RecordRevisionAttempt.parse(body);
    return this.revisions.recordAttempt(userId, input.submissionId, input.selfRating);
  }
}
