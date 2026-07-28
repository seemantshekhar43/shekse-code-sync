import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { HealthController } from "./health/health.controller.js";
import { InsightsModule } from "./insights/insights.module.js";
import { QueueModule } from "./queue/queue.module.js";
import { RevisionsModule } from "./revisions/revisions.module.js";
import { SubmissionsModule } from "./submissions/submissions.module.js";
import { UsersModule } from "./users/users.module.js";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    QueueModule,
    SubmissionsModule,
    RevisionsModule,
    InsightsModule,
    UsersModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
