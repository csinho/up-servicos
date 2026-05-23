# Deploy — GitHub + EasyPanel

Este projeto usa **TanStack Start** com build voltado a **SSR** (servidor no bundle de produção). O fluxo abaixo cobre publicação via **GitHub** e **EasyPanel**.

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

### 6. Domínio e HTTPS

No EasyPanel, associe domínio e ative TLS. Teste as rotas: `/`, `/orcamentos`, `/empresa`.

## Checklist pós-deploy

- [ ] Dashboard carrega sem erro de variável (`VITE_SUPABASE_*`)
- [ ] Listagem de clientes/orçamentos responde (Supabase acessível)
- [ ] Salvar empresa com logo atualiza sidebar e favicon
- [ ] Gerar PDF de um orçamento
- [ ] Mover card no Kanban para *Em produção* cria lançamento no financeiro

## Erros comuns

### `VITE_SUPABASE_URL não está definida`

- Variável não foi definida **antes** do `npm run build` no EasyPanel
- Solução: adicione as duas `VITE_*`, dispare **Rebuild**

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
