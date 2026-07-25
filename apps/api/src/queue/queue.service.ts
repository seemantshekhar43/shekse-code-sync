import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { Queue } from "bullmq";

export const ENRICHMENT_QUEUE = "enrichment";

export interface EnrichmentJob {
  submissionId: string;
}

/** Thin wrapper around the BullMQ enrichment queue (producer side). */
@Injectable()
export class QueueService implements OnModuleDestroy {
  readonly enrichment: Queue<EnrichmentJob>;

  constructor() {
    const url = new URL(process.env.REDIS_URL ?? "redis://localhost:6379");
    this.enrichment = new Queue<EnrichmentJob>(ENRICHMENT_QUEUE, {
      connection: {
        host: url.hostname,
        port: Number(url.port) || 6379,
        password: url.password || undefined,
      },
    });
  }

  async enqueueEnrichment(job: EnrichmentJob): Promise<void> {
    await this.enrichment.add("analyze", job, {
      attempts: 5,
      backoff: { type: "exponential", delay: 5000 },
      removeOnComplete: true,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.enrichment.close();
  }
}
