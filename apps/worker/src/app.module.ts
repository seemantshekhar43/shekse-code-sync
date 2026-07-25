import { Module } from "@nestjs/common";
import { EnrichmentWorker } from "./enrichment/enrichment.worker.js";

@Module({
  providers: [EnrichmentWorker],
})
export class AppModule {}
