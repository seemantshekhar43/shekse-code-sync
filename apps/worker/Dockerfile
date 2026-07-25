# Runs the enrichment worker from TypeScript source via tsx.
FROM node:22-slim
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @scs/db generate

CMD ["pnpm", "--filter", "@scs/worker", "exec", "tsx", "src/main.ts"]
