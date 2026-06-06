# Deploy — GitHub + Cloudflare Workers

Este projeto usa **TanStack Start** com SSR no **Cloudflare Workers**. O deploy oficial é via **GitHub Actions**.

**Guia completo:** [DEPLOY-CLOUDFLARE.md](./DEPLOY-CLOUDFLARE.md)

---

## Legado — EasyPanel (descontinuado)

O fluxo abaixo era usado com EasyPanel + Docker. Pode ser ignorado se você migrou para Cloudflare.

## O que vai no código vs no painel

| Onde | O quê |
|------|--------|
| **Código (GitHub)** | Lógica do app, sem URL/chave do Supabase |
| **EasyPanel (variáveis)** | `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` |
| **Supabase (SQL)** | Schema, RLS, migrações em `docs/setup-supabase.sql` e `docs/migrations/` |

**Não é necessário deixar credenciais fixas no repositório.** Use `.env` só na máquina local (já está no `.gitignore`).

### Variáveis no EasyPanel

Cadastre no serviço (aba **Environment** / **Build** — conforme o template do painel):

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...   # ou anon key legada
```

Onde obter: Supabase → **Project Settings** → **API** → Project URL e publishable (ou anon) key.

> As variáveis `VITE_*` precisam existir **durante o build** (`npm run build`), porque o Vite as incorpora no JavaScript gerado.

## Pré-requisitos

1. Repositório no GitHub com este projeto
2. Projeto Supabase criado e SQL aplicado ([supabase.md](./supabase.md))
3. Migração de desconto %, se o banco já existia: `docs/migrations/2026-05-22-desconto-percentual.sql`
4. Conta EasyPanel com acesso ao GitHub

## Fluxo GitHub → EasyPanel

### 1. Subir o código

```bash
git add .
git commit -m "Preparar deploy"
git push origin main
```

Não commite `.env` nem chaves.

### 2. Criar app no EasyPanel

1. **New App** → fonte **GitHub** → repositório `freela-os-upcao`
2. Branch: `main`
3. **Construção:** método **Dockerfile**
4. **Arquivo:** `Dockerfile` (raiz do repositório, caminho `/`)

### 3. Variáveis no EasyPanel (obrigatório)

Cadastre **antes do primeiro deploy** (são usadas no `docker build`):

| Variável | Exemplo |
|----------|---------|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_...` |

**Billing Woovi (runtime — servidor, sem `VITE_`):**

| Variável | Exemplo |
|----------|---------|
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (service role) |
| `WOOVI_APP_ID` | AppID da API Woovi |
| `BILLING_CRON_SECRET` | UUID para cron HTTP |
| `PUBLIC_APP_URL` | `https://seu-dominio.com` |

Opcional: `WOOVI_WEBHOOK_AUTHORIZATION` — apenas se configurar header Authorization no webhook Woovi.

Detalhes: [BILLING.md](./BILLING.md).

No EasyPanel, marque-as como variáveis de **build** / ambiente do serviço. O `Dockerfile` valida se existem; sem elas o build falha com mensagem clara.

### 4. O que o Dockerfile faz

1. **Build:** `npm ci` → `npm run build` (gera `dist/client` + `dist/server`)
2. **Run:** Wrangler serve o worker SSR na porta `PORT` (padrão `3000`)

Arquivos:

- `Dockerfile` — imagem multi-stage
- `scripts/docker-entrypoint.sh` — start com `0.0.0.0:$PORT`
- `.dockerignore` — acelera o build

Não é preciso configurar comando de install/build/start manualmente no painel — só o Dockerfile.

### 5. Cloudflare Workers (alternativa, fora do EasyPanel)

Se preferir hospedar só na Cloudflare:

```bash
npm run build
npx wrangler deploy
```

Configure secrets/vars no dashboard Cloudflare se necessário.

### 6. Cron de billing (EasyPanel/Docker)

O container não dispara cron nativo da Cloudflare. Agende um job HTTP externo (EasyPanel Cron ou serviço similar):

```bash
curl "https://SEU-DOMINIO/api/cron/billing?secret=SEU_BILLING_CRON_SECRET"
```

Horário sugerido: `0 12 * * *` UTC (09:00 BRT).

### 7. Domínio e HTTPS

No EasyPanel, associe domínio e ative TLS. Teste as rotas: `/`, `/orcamentos`, `/plano`, `/empresa`.

## Checklist pós-deploy

- [ ] Dashboard carrega sem erro de variável (`VITE_SUPABASE_*`)
- [ ] Listagem de clientes/orçamentos responde (Supabase acessível)
- [ ] Salvar empresa com logo atualiza sidebar e favicon
- [ ] Gerar PDF de um orçamento
- [ ] Mover card no Kanban para *Em produção* cria lançamento no financeiro
- [ ] Página `/plano` carrega status do billing
- [ ] Webhook Woovi de teste retorna `{ "ok": true }`
- [ ] Cron manual `/api/cron/billing?secret=...` retorna `{ "ok": true }`

## Erros comuns

### `VITE_SUPABASE_URL não está definida`

- Variável não foi definida **antes** do `npm run build` no EasyPanel
- Solução: adicione as duas `VITE_*`, dispare **Rebuild**

### Build trava em `building ssr environment` / `transforming...`

- O SSR do Vite ficou mais pesado com o módulo de billing; VPS com pouca RAM mata o processo nessa fase.
- Solução: **Rebuild sem cache** com o `Dockerfile` atual (`NODE_OPTIONS=--max-old-space-size=8192`).
- No EasyPanel, aumente memória do serviço para o build (recomendado **≥ 3 GB**).
- Confirme que `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` estão nas variáveis de **build**.

### Build falha em `test -f dist/server/index.js` / `dist/client`

- O `npm run build` terminou sem gerar a pasta `dist/client` (comum em VPS com pouca RAM).
- Solução: use o `Dockerfile` atualizado, faça push e **Rebuild sem cache**.
- Se persistir, aumente memória do serviço no EasyPanel (≥ 3 GB para o build).

### Billing não funciona após deploy (plano/webhook 404 ou erro 500)

- O deploy antigo ainda está no ar se `/plano` retorna 404.
- Cadastre também as variáveis de **runtime** no EasyPanel (não só build):
  `SUPABASE_SERVICE_ROLE_KEY`, `WOOVI_APP_ID`, `PUBLIC_APP_URL`, `BILLING_CRON_SECRET`
- O `docker-entrypoint.sh` monta `.dev.vars` a partir dessas envs ao subir o container.

### `No such module "assets/worker-entry-….js"`

- O `wrangler.json` de produção estava sem regras `ESModule` (o script antigo substituía o arquivo gerado pelo Vite).
- Solução: push com `scripts/sanitize-wrangler-json.mjs` + **Rebuild** sem cache.

### `Could not read file: dist/server/wrangler.json`

- O build do Docker não gerou/copiou `dist/` (falha no `npm run build` ou variáveis `VITE_*` ausentes no build).
- Solução: confira as duas `VITE_*` no EasyPanel, faça **Rebuild** após o push com o `Dockerfile` atualizado (ele copia `deploy/wrangler.server.json` após o build).

### Falha ao salvar orçamento (coluna `desconto_percentual`)

- Rode a migração SQL em `docs/migrations/2026-05-22-desconto-percentual.sql`

### Página em branco / 500 no SSR

- Confirme que o comando **Start** aponta para o servidor (`wrangler` / worker), não só arquivos estáticos de `dist/client`
- Veja logs do container no EasyPanel

### Dados acessíveis por qualquer pessoa

- RLS está aberta para `anon`. Para URL pública, planeje Auth + policies restritas ([supabase.md](./supabase.md#segurança)).

## Segurança

- **Publishable / anon key** no front é esperado pelo Supabase
- **Nunca** coloque `service_role` no front nem no repositório
- Restrinja quem acessa a URL do app ou endureça RLS quando for expor na internet
