# Builds and serves the Next.js dashboard.
FROM node:22-slim
RUN corepack enable
WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @scs/web build

EXPOSE 3000
CMD ["pnpm", "--filter", "@scs/web", "start"]
