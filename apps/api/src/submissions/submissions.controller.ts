import { Body, Controller, Get, Post } from "@nestjs/common";
import { CaptureSubmission, type SubmissionSummary } from "@scs/types";
import { SubmissionsService } from "./submissions.service.js";

// TODO: resolve userId from the authenticated ShekseCodeSync token.
const DEMO_USER_ID = "demo-user";

@Controller("submissions")
export class SubmissionsController {
  constructor(private readonly submissions: SubmissionsService) {}

  @Get()
  async list(): Promise<SubmissionSummary[]> {
    return this.submissions.list(DEMO_USER_ID);
  }

  @Post()
  async capture(@Body() body: unknown): Promise<{ id: string }> {
    const input = CaptureSubmission.parse(body);
    return this.submissions.capture(DEMO_USER_ID, input);
  }
}
