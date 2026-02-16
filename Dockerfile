FROM node:24-alpine

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.18.0 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including tsx)
RUN pnpm install --frozen-lockfile && \
    pnpm store prune

# Copy source code and config
COPY tsconfig.json ./
COPY src ./src

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

RUN chown -R nodejs:nodejs /app

USER nodejs

# Use tsx to run TypeScript directly
ENTRYPOINT ["pnpm", "start"]
