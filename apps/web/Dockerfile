# Builds and serves the Next.js dashboard.
FROM node:22-slim
# Prisma's `generate` step detects the OpenSSL variant to bundle its query
# engine for from the machine it runs on - installing openssl before
# `generate` (not after) is what makes it pick the engine that matches this
# same base image at runtime, same as apps/api and apps/worker.
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @scs/db generate
RUN pnpm --filter @scs/web build

EXPOSE 3000
CMD ["pnpm", "--filter", "@scs/web", "start"]
