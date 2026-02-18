# Multi-stage Dockerfile for NestJS (build + run)
FROM node:20-alpine AS builder
WORKDIR /app

# Use legacy peer deps during build to avoid ERESOLVE failures for swagger/etc
ENV NPM_CONFIG_LEGACY_PEER_DEPS=true

# Install dependencies (including dev deps for build)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy sources and build
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy production dependencies and build output
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Install pg client so we can wait for DB readiness
RUN apk add --no-cache postgresql-client

# Add a small helper to wait for Postgres to be available
COPY wait-for-db.sh /wait-for-db.sh
RUN chmod +x /wait-for-db.sh

EXPOSE 3000
CMD ["sh", "-c", "/wait-for-db.sh && node dist/main.js"]
