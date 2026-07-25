# Runs the API from TypeScript source via tsx (keeps the monorepo's shared
# TS packages consumable without a separate build/bundle step).
FROM node:22-slim
RUN apt-get update && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @scs/db generate

EXPOSE 3001
CMD ["pnpm", "--filter", "@scs/api", "exec", "tsx", "src/main.ts"]
