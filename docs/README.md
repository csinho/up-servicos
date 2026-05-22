# Freela OS — Documentação

Sistema interno para gerenciar **orçamentos, pedidos, clientes, serviços e financeiro** de freelancer, com Kanban e geração de PDF profissional.

## Stack

- TanStack Start + React + TypeScript + Vite
- Tailwind CSS v4 + shadcn/ui
- Zustand (estado global) com persistência em `localStorage`
- @dnd-kit (Kanban arrastável)
- @react-pdf/renderer (geração de PDF do orçamento)

> **Sem login.** Sistema de uso pessoal. Toda a persistência inicial é no navegador (`localStorage`), com camada preparada para migração para Supabase.

## Como rodar

O ambiente já está configurado pelo Lovable. Em desenvolvimento local:

```bash
bun install
bun run dev
```

## Estrutura

```
src/
  routes/
    __root.tsx              # shell + providers
    index.tsx               # /  Dashboard
    kanban.tsx              # /kanban
    clientes.tsx            # /clientes
    servicos.tsx            # /servicos
    orcamentos.index.tsx    # /orcamentos
    orcamentos.$id.tsx      # /orcamentos/:id  (edição + PDF)
    financeiro.tsx          # /financeiro
    empresa.tsx             # /empresa
  components/
    app-shell.tsx           # sidebar + topbar
    pdf-preview.tsx         # documento PDF + preview/download
    ui/                     # shadcn/ui
  lib/
    types.ts                # tipos + helpers (formatBRL, calcTotal)
    seed.ts                 # dados mockados iniciais
    store.ts                # zustand store (camada repositório)
docs/
  README.md
  modulos.md
  banco-de-dados.md
  supabase.md
  pdf.md
```

## Próximos passos sugeridos

1. Substituir logo padrão pela sua em **Empresa**.
2. Cadastrar seus clientes reais (ou importar via JSON manualmente).
3. Ajustar serviços e valores em **Serviços**.
4. Criar seu primeiro orçamento e gerar o PDF.
5. Quando estiver pronto para nuvem: ativar **Lovable Cloud (Supabase)** e seguir `docs/supabase.md`.
