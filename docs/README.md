# Up Serviços — Documentação

Sistema interno para gerenciar **orçamentos, pedidos, clientes, serviços e financeiro** de freelancer, com Kanban e geração de PDF profissional.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | TanStack Start + React 19 + TypeScript |
| Build | Vite 7 |
| UI | Tailwind CSS v4 + shadcn/ui |
| Dados | Supabase (PostgreSQL) + TanStack Query |
| Kanban | @dnd-kit |
| PDF | [pdfmake](https://pdfmake.github.io/docs/0.3/) (client-side) |
| Deploy alvo | GitHub → **EasyPanel** (SSR via Cloudflare Workers runtime no build) |

> **Sem login.** Uso pessoal. RLS do Supabase liberada para `anon` — veja [supabase.md](./supabase.md#segurança).

## Variáveis de ambiente

**Nada de URL ou chave do Supabase fica fixo no código.** Use o arquivo `.env` local ou o painel do EasyPanel.

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `VITE_SUPABASE_URL` | Sim | URL do projeto (Supabase → Settings → API) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Sim | Chave **publishable** (pública, segura no front) |

Copie `.env.example` → `.env` e preencha antes de `npm run dev` ou `npm run build`.

> **Importante (Vite):** variáveis `VITE_*` são embutidas no bundle no momento do **build**. No EasyPanel, configure-as **antes** do comando de build, não só no container em execução.

## Como rodar localmente

```bash
cp .env.example .env
# edite .env com suas credenciais Supabase

npm install
npm run dev
```

Banco de dados (primeira vez): [supabase.md](./supabase.md).

## Scripts

| Comando | Uso |
|---------|-----|
| `npm run dev` | Desenvolvimento |
| `npm run build` | Build de produção |
| `npm run preview` | Preview local pós-build |
| `npm run lint` | ESLint + Prettier |

## Estrutura do projeto

```
src/
  routes/                 # páginas (file-based routing)
    index.tsx             # Dashboard
    kanban.tsx
    clientes.tsx
    servicos.tsx
    orcamentos.index.tsx
    orcamentos.$id.tsx    # edição + PDF
    financeiro.tsx
    empresa.tsx
  components/
    app-shell.tsx         # layout (sidebar, logo, favicon)
    pdf-preview.tsx
    crud-dialog.tsx
    ui/                   # shadcn
  integrations/supabase/
    client.ts             # client Supabase (lê VITE_*)
  lib/
    types.ts              # tipos + calcTotal, formatBRL, etc.
    repository.ts         # acesso Supabase
    store.ts              # hooks TanStack Query
    validators.ts         # máscaras CPF, telefone, %, CEP
    viacep.ts
    orcamento-draft.ts    # rascunho em sessionStorage
  hooks/
    use-empresa-branding.ts
docs/
  README.md               # este arquivo
  deploy.md               # GitHub + EasyPanel
  supabase.md
  banco-de-dados.md
  modulos.md
  migrations/             # SQL incremental
public/
  favicon.svg
```

## Funcionalidades principais

- **Empresa:** cadastro único, logo (sidebar + favicon), condições padrão
- **Orçamentos / pedidos:** itens, desconto em **%**, PDF com percentual e valor em R$
- **Kanban:** arrastar status; aprovação gera lançamento no financeiro
- **Financeiro:** automático a partir dos pedidos (sem lançamento manual)
- **Clientes / serviços:** CRUD com validações e ViaCEP

Detalhes por módulo: [modulos.md](./modulos.md).

## Deploy

Fluxo recomendado: repositório no **GitHub** → app no **EasyPanel**.

Guia passo a passo: **[deploy.md](./deploy.md)**.

## Documentos relacionados

- [supabase.md](./supabase.md) — schema, RLS, migrações
- [banco-de-dados.md](./banco-de-dados.md) — tabelas e campos
- [modulos.md](./modulos.md) — regras de negócio por tela
- [pdf.md](./pdf.md) — layout do PDF (se existir)
