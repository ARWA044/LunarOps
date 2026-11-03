
# Stage 1: Install dependencies
FROM node:22-trixie-slim AS deps

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Build Next.js
FROM node:22-trixie-slim AS builder

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Stage 3: Minimal production runtime
FROM gcr.io/distroless/nodejs22-debian13:nonroot AS runner

WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

# Copy only standalone runtime files
COPY --from=builder --chown=65532:65532 /app/.next/standalone ./

# Copy Next.js static assets
COPY --from=builder --chown=65532:65532 /app/.next/static ./.next/static

EXPOSE 3000

# Distroless Node.js images already use node as entrypoint
CMD ["server.js"]
