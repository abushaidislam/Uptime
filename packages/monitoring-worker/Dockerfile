# Production Dockerfile for StatusVault Monitoring Worker
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tooling/typescript ./tooling/typescript
COPY tooling/eslint ./tooling/eslint
COPY tooling/prettier ./tooling/prettier
COPY packages/monitoring-worker ./packages/monitoring-worker
COPY packages/supabase ./packages/supabase

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build the worker
WORKDIR /app/packages/monitoring-worker
RUN pnpm build

# Production image
FROM node:22-alpine AS runner

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/monitoring-worker/dist ./packages/monitoring-worker/dist
COPY --from=builder /app/packages/monitoring-worker/package.json ./packages/monitoring-worker/
COPY --from=builder /app/packages/supabase ./packages/supabase

# Set environment
ENV NODE_ENV=production

WORKDIR /app/packages/monitoring-worker

CMD ["node", "dist/worker.js"]
