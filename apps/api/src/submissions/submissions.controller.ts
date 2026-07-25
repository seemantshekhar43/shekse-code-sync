import { Body, Controller, Post } from "@nestjs/common";
import { CaptureSubmission } from "@scs/types";
import { SubmissionsService } from "./submissions.service.js";

@Controller("submissions")
export class SubmissionsController {
  constructor(private readonly submissions: SubmissionsService) {}

  @Post()
  async capture(@Body() body: unknown): Promise<{ id: string }> {
    const input = CaptureSubmission.parse(body);
    // TODO: resolve userId from the authenticated ShekseCodeSync token.
    const userId = "demo-user";
    return this.submissions.capture(userId, input);
  }
}
