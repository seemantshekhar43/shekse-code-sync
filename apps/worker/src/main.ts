import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

const app = await NestFactory.createApplicationContext(AppModule);
await app.init();
// eslint-disable-next-line no-console
console.log("Worker process started, listening for enrichment jobs");
