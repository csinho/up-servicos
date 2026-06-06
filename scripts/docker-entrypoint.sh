#!/bin/sh
set -e

PORT="${PORT:-3000}"

if [ ! -f dist/server/index.js ]; then
  echo "ERRO: dist/server/index.js não encontrado."
  exit 1
fi

if [ ! -f dist/server/wrangler.json ]; then
  echo "ERRO: dist/server/wrangler.json ausente."
  exit 1
fi

ENTRY=$(grep -oE 'worker-entry-[^"]+\.js' dist/server/index.js | head -1)
if [ -n "$ENTRY" ] && [ ! -f "dist/server/assets/$ENTRY" ]; then
  echo "ERRO: index.js referencia assets/$ENTRY mas o arquivo não existe."
  echo "Arquivos em dist/server/assets:"
  ls -la dist/server/assets/ | head -20
  exit 1
fi

cd dist/server

# Wrangler local lê .dev.vars — monta a partir das env do container (EasyPanel)
{
  [ -n "$VITE_SUPABASE_URL" ] && echo "VITE_SUPABASE_URL=$VITE_SUPABASE_URL"
  [ -n "$VITE_SUPABASE_PUBLISHABLE_KEY" ] && echo "VITE_SUPABASE_PUBLISHABLE_KEY=$VITE_SUPABASE_PUBLISHABLE_KEY"
  [ -n "$SUPABASE_SERVICE_ROLE_KEY" ] && echo "SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY"
  [ -n "$WOOVI_APP_ID" ] && echo "WOOVI_APP_ID=$WOOVI_APP_ID"
  [ -n "$WOOVI_CLIENT_ID" ] && echo "WOOVI_CLIENT_ID=$WOOVI_CLIENT_ID"
  [ -n "$WOOVI_CLIENT_SECRET" ] && echo "WOOVI_CLIENT_SECRET=$WOOVI_CLIENT_SECRET"
  [ -n "$PUBLIC_APP_URL" ] && echo "PUBLIC_APP_URL=$PUBLIC_APP_URL"
  [ -n "$BILLING_CRON_SECRET" ] && echo "BILLING_CRON_SECRET=$BILLING_CRON_SECRET"
  [ -n "$WOOVI_API_URL" ] && echo "WOOVI_API_URL=$WOOVI_API_URL"
} > .dev.vars

echo "Iniciando Up Serviços na porta $PORT (worker: ${ENTRY:-index.js})..."

exec npx wrangler dev index.js \
  --config wrangler.json \
  --ip 0.0.0.0 \
  --port "$PORT" \
  --local-protocol=http \
  --local
