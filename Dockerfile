# Freela OS — build SSR (TanStack Start + Cloudflare worker runtime via Wrangler)

FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci

COPY . .

# EasyPanel: defina VITE_* nas variáveis do app (usadas no build)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_PUBLISHABLE_KEY

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY

RUN test -n "$VITE_SUPABASE_URL" && test -n "$VITE_SUPABASE_PUBLISHABLE_KEY" || \
  (echo "ERRO: defina VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no EasyPanel antes do build." && exit 1)

RUN npm run build

# Garante config do Wrangler (o plugin às vezes não gera no Linux/CI)
RUN test -f dist/server/index.js && test -d dist/client
RUN cp deploy/wrangler.server.json dist/server/wrangler.json

# --- imagem de execução ---
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN apk add --no-cache tini

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev && npm install wrangler@4.94.0

COPY --from=builder /app/dist ./dist

RUN test -f dist/server/wrangler.json && test -f dist/server/index.js && test -d dist/client

COPY deploy/wrangler.server.json ./deploy/wrangler.server.json
COPY scripts/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/usr/local/bin/docker-entrypoint.sh"]
