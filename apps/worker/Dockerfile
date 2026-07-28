# Runs the worker from TypeScript source via @swc-node/register - the same
# runtime `pnpm --filter @scs/worker dev` uses locally, minus --watch (keeps
# the monorepo's shared TS packages, which resolve to raw ./src/index.ts,
# consumable without a separate build/bundle step per workspace package).
FROM node:22-slim
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @scs/db generate

CMD ["pnpm", "--filter", "@scs/worker", "exec", "node", "--import", "@swc-node/register/esm-register", "src/main.ts"]
