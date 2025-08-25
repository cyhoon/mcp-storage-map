FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY yarn.lock* ./

RUN npm pkg delete scripts.prepare

RUN npm ci

RUN npm pkg set scripts.prepare="npm run build"

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY yarn.lock* ./

RUN npm pkg delete scripts.prepare

RUN npm ci --omit=dev && \
    npm cache clean --force

COPY --from=builder /app/build ./build

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

RUN chown -R nodejs:nodejs /app

USER nodejs

ENTRYPOINT ["node", "/app/build/index.js"]
