# Multi-stage production Dockerfile for BLACKSHIELD Cyber Defense Platform
FROM node:20-slim AS base
RUN apt-get update && apt-get install -y openssl curl bash ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Stage 1: Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma/
COPY scripts ./scripts/
RUN npm install

# Stage 2: Build the Next.js application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ensure public dir exists so the runner stage COPY succeeds even without static assets
RUN mkdir -p /app/public

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Prepare database schema & generate Prisma client
RUN node scripts/prepare-database.js
RUN npm run build
RUN node scripts/copy-standalone.js

# Stage 3: Production runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN groupadd --system --gid 1001 nodejs && useradd --system --uid 1001 nextjs

# Copy runtime assets and dependencies
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/server.js ./server.js
COPY --from=builder /app/node_modules ./node_modules

# 1. Copy standalone build into /app (for 'node server.js')
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 2. Also copy standalone build into /app/.next/standalone (for 'node /app/.next/standalone/server.js')
COPY --from=builder /app/.next/standalone /app/.next/standalone
COPY --from=builder /app/.next/static /app/.next/standalone/.next/static
COPY --from=builder /app/public /app/.next/standalone/public

# Ensure nextjs user owns /app for sqlite db file writing and cache
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

CMD ["node", "scripts/entrypoint.js"]
