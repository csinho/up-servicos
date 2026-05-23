#!/bin/sh
set -e

PORT="${PORT:-3000}"

if [ ! -f dist/server/index.js ]; then
  echo "ERRO: dist/server/index.js não encontrado. O estágio de build do Docker falhou ou dist não foi copiado."
  echo "Confira no EasyPanel: variáveis VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no build."
  exit 1
fi

if [ ! -f dist/server/wrangler.json ]; then
  echo "Aviso: wrangler.json ausente; usando deploy/wrangler.server.json"
  cp deploy/wrangler.server.json dist/server/wrangler.json 2>/dev/null || \
    cp /app/deploy/wrangler.server.json dist/server/wrangler.json
fi

cd dist/server

exec npx wrangler dev \
  --config wrangler.json \
  --ip 0.0.0.0 \
  --port "$PORT" \
  --local-protocol=http \
  --local
