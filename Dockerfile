# Up Serviços — TanStack Start (SSR via Wrangler no container)

FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Vite SSR + billing precisam de RAM (EasyPanel/VPS pequenos travam em "transforming...")
ENV NODE_OPTIONS=--max-old-space-size=8192
ENV CI=true
ENV GENERATE_SOURCEMAP=false

COPY package.json package-lock.json* ./

RUN npm ci

COPY . .

ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY

RUN test -n "$VITE_SUPABASE_URL" && test -n "$VITE_SUPABASE_PUBLISHABLE_KEY" || \
  (echo "ERRO: defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no EasyPanel." && exit 1)

RUN npm run build && node scripts/verify-dist.mjs

# --- execução ---
FROM node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN apt-get update && apt-get install -y --no-install-recommends tini && \
    rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm install wrangler@4.94.0

COPY --from=builder /app/dist ./dist
COPY deploy/wrangler.server.json ./deploy/wrangler.server.json
COPY scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

RUN chmod +x /usr/local/bin/docker-entrypoint.sh && \
    test -f dist/server/wrangler.json && \
    test -f dist/server/index.js && \
    test -d dist/client && \
    test -d dist/server/assets

EXPOSE 3000

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["/usr/local/bin/docker-entrypoint.sh"]
