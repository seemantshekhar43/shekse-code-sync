import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

const app = await NestFactory.create(AppModule);
app.enableCors();
const port = Number(process.env.API_PORT) || 3001;
await app.listen(port);
// eslint-disable-next-line no-console
console.log(`API listening on :${port}`);
