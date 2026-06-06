# Deploy — Cloudflare Workers + GitHub Actions

Substitui o EasyPanel. Fluxo: **push na `main` → GitHub Actions → Cloudflare Worker `freela-os`**.

## 1. Cloudflare (uma vez)

### 1.1 API Token

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) → **My Profile** → **API Tokens**
2. **Create Token** → template **Edit Cloudflare Workers**
3. Escopo: sua conta (e zona `upservicos.com` se o domínio estiver na Cloudflare)
4. Copie o token → secret `CLOUDFLARE_API_TOKEN` no GitHub

### 1.2 Account ID

1. Dashboard → **Workers & Pages** → canto direito **Account ID**
2. Copie → secret `CLOUDFLARE_ACCOUNT_ID` no GitHub

### 1.3 Domínio customizado (após primeiro deploy)

1. **Workers & Pages** → Worker **`freela-os`**
2. **Settings** → **Domains & Routes** → **Add Custom Domain**
3. Adicione `upservicos.com` (e `www` se quiser)
4. O domínio precisa estar na mesma conta Cloudflare (DNS gerenciado por lá)

### 1.4 Cron (billing)

Já configurado em [`wrangler.jsonc`](../wrangler.jsonc): `0 12 * * *` (09:00 BRT).  
Dispara o handler `scheduled` em [`src/server.ts`](../src/server.ts).

### 1.5 Webhook Woovi

URL de produção:

```
POST https://upservicos.com/api/webhooks/woovi
```

## 2. GitHub — Secrets (Settings → Secrets and variables → Actions)

| Secret | Obrigatório | Uso |
| --- | --- | --- |
| `CLOUDFLARE_API_TOKEN` | Sim | Deploy via Wrangler |
| `CLOUDFLARE_ACCOUNT_ID` | Sim | Deploy via Wrangler |
| `VITE_SUPABASE_URL` | Sim | Build (Vite) + runtime Worker |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Sim | Build (Vite) + runtime Worker |
| `SUPABASE_SERVICE_ROLE_KEY` | Sim | Billing / webhooks no servidor |
| `WOOVI_APP_ID` | Sim | API Woovi |
| `BILLING_CRON_SECRET` | Sim | Protege `/api/cron/billing` |
| `ADMIN_WHATSAPP_ALLOWLIST` | Sim (admin) | Login do painel `/admin` — 11 dígitos, vírgula |

Opcional: `WOOVI_WEBHOOK_AUTHORIZATION` — só se configurar header no painel Woovi.

**Variável pública** (não é secret): `PUBLIC_APP_URL` está em `wrangler.jsonc` → `vars.PUBLIC_APP_URL` (`https://upservicos.com`). Altere lá se o domínio mudar.

## 3. GitHub — Actions

O workflow está em [`.github/workflows/deploy-cloudflare.yml`](../.github/workflows/deploy-cloudflare.yml).

- Dispara em **push na `main`** ou manualmente (**Actions** → **Deploy to Cloudflare Workers** → **Run workflow**)
- Passos: `npm ci` → `npm run build` → `wrangler deploy` → sincroniza secrets no Worker

### Remover EasyPanel

1. Apague o projeto no EasyPanel
2. Em **GitHub** → repositório → **Settings** → **Webhooks**: remova o webhook do EasyPanel
3. Confirme que só o workflow **Deploy to Cloudflare Workers** está ativo

## 4. Deploy manual (opcional)

```bash
# Login (uma vez na máquina)
npx wrangler login

# Build + deploy
npm run deploy

# Secrets (uma vez, ou quando mudar)
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put WOOVI_APP_ID
npx wrangler secret put BILLING_CRON_SECRET
npx wrangler secret put ADMIN_WHATSAPP_ALLOWLIST
npx wrangler secret put VITE_SUPABASE_URL
npx wrangler secret put VITE_SUPABASE_PUBLISHABLE_KEY
```

## 5. Testes pós-deploy

```bash
# Webhook Woovi (teste do painel)
curl -X POST "https://upservicos.com/api/webhooks/woovi" \
  -H "Content-Type: application/json" \
  -d '{"evento":"teste_webhook"}'
# → {"ok":true,"test":true}

# Página do plano
curl -s -o /dev/null -w "%{http_code}\n" "https://upservicos.com/plano"
# → 200

# Cron manual
curl "https://upservicos.com/api/cron/billing?secret=SEU_BILLING_CRON_SECRET"
# → {"ok":true,"processed":1,...}
```

## 6. MCP Cloudflare no Cursor

O MCP retornou **403 (não autenticado)** neste ambiente. Para usar o MCP:

1. Autentique o plugin Cloudflare no Cursor (login na conta)
2. Depois você pode listar Workers e builds pelo painel MCP

O deploy em si é feito pelo **GitHub Actions** + **Wrangler**; o MCP é opcional para monitorar.

## 7. SQL Supabase

Antes do primeiro uso do billing, rode no Supabase:

`docs/migrations/2026-06-05-empresa-billing.sql`

Mais detalhes de billing: [BILLING.md](./BILLING.md).
