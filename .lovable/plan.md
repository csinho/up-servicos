# Integração com Supabase externo

Vamos conectar o sistema ao seu projeto Supabase (`tdtmxddukuqsxsiiwzqp`) usando a publishable key, substituir o `localStorage` por chamadas reais ao banco e migrar o seed como dados iniciais.

## 1. Configuração do cliente

Criar `src/integrations/supabase/client.ts` apontando para sua URL e publishable key (chave pública — pode ficar no código). Sem login: a API anônima fará leitura e escrita direto, já que é um sistema de uso pessoal.

```
SUPABASE_URL = https://tdtmxddukuqsxsiiwzqp.supabase.co
SUPABASE_PUBLISHABLE_KEY = sb_publishable_sV6Tal25v-z7Def-bEPV1A_v5IpDrpr
```

## 2. SQL para você rodar no Supabase

Vou gerar **um único script SQL** (`docs/setup-supabase.sql`) com:

- `CREATE TABLE` das 7 tabelas (empresas, clientes, servicos, orcamentos, orcamento_itens, financeiro, historico_status) conforme `docs/banco-de-dados.md`.
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` em todas.
- Policies permissivas para o role `anon` (SELECT/INSERT/UPDATE/DELETE) — adequado para sistema interno sem login.
- `INSERT` com os dados do seed atual (empresa, 2 clientes, 12 serviços, 2 orçamentos com itens, 3 lançamentos financeiros).
- Índices em FKs principais (`cliente_id`, `orcamento_id`, `status`).

Você cola no **SQL Editor → New query → Run**.

## 3. Camada de repositório

Criar `src/lib/repository.ts` com funções tipadas para cada tabela:

- `empresaRepo`: `get()`, `upsert(empresa)`
- `clientesRepo`: `list()`, `upsert(cliente)`, `remove(id)`
- `servicosRepo`: `list()`, `upsert(servico)`, `remove(id)`
- `orcamentosRepo`: `list()` (com join de itens e histórico), `get(id)`, `upsert(orcamento)` (transação: upsert orcamento + delete/insert itens + insert histórico), `remove(id)`, `move(id, status)` (atualiza status, adiciona histórico, cria conta a receber automaticamente quando aprovado)
- `financeiroRepo`: `list()`, `upsert(f)`, `remove(id)`

Mapeamento: o tipo `Orcamento.itens[]` vira linhas em `orcamento_itens` (campo `ordem` para preservar posição). `Orcamento.historico[]` vira linhas em `historico_status`.

## 4. Refazer o store

Reescrever `src/lib/store.ts` usando **TanStack Query** (`useQuery` + `useMutation`) em vez de Zustand+persist:

- Hook `useEmpresa()`, `useClientes()`, `useServicos()`, `useOrcamentos()`, `useOrcamento(id)`, `useFinanceiro()`
- Hook de mutations `useUpsertCliente()`, `useRemoveCliente()`, etc., todas com `invalidateQueries` apropriado
- Manter os helpers puros `gerarNumeroOrcamento()` e `novoItem()`

Como já temos `QueryClient` no router context (`src/router.tsx`), só vamos adicionar o `QueryClientProvider` no `__root.tsx` se ainda não estiver.

## 5. Atualizar todas as páginas

Substituir o uso de `useApp()` por hooks de Query nas 8 telas. **Sem mudança visual** — apenas troca de fonte de dados:

- `index.tsx` (dashboard): consome `useOrcamentos()` + `useFinanceiro()` para os cards
- `kanban.tsx`: usa `useOrcamentos()` + `useMoveOrcamento()` no `onDragEnd`
- `clientes.tsx`, `servicos.tsx`: list + upsert + remove
- `orcamentos.index.tsx`: list + criar novo
- `orcamentos.$id.tsx`: get + upsert (salvar) com loading/erro
- `financeiro.tsx`: list + marcar como pago + criar/editar/remover
- `empresa.tsx`: get + upsert
- Loading states com skeleton; erros via `toast` (sonner já instalado)

## 6. Limpeza

- Apagar `src/lib/seed.ts` (dados agora vivem no banco)
- Remover dependência `zustand` do `package.json`
- Atualizar `docs/supabase.md` com instruções do novo fluxo
- Atualizar `docs/README.md` mencionando que está conectado ao Supabase real

## Detalhes técnicos

- **Chave usada:** publishable key (segura no client). Não precisaremos da service_role pois o sistema é só seu uso e RLS está liberada para `anon`.
- **Conta a receber automática:** quando `moveOrcamento(id, "em_producao")` for chamado, o repositório também insere a linha em `financeiro` com `tipo='receber'`, `status='pendente'`, valor = total do orçamento.
- **Numeração de orçamento:** continua client-side via `gerarNumeroOrcamento()` (busca prefixo `ORC-YYYYMMDD-` e incrementa). Coluna `numero` tem `UNIQUE` — em caso de colisão (rara), nova tentativa.
- **PDF:** sem alteração; lê do mesmo objeto `Orcamento` que vier da query.
- **Tipos:** mantemos `src/lib/types.ts` como fonte da verdade — o repositório mapeia para/da estrutura achatada do banco.

## Arquivos

**Criar**: `src/integrations/supabase/client.ts`, `src/lib/repository.ts`, `docs/setup-supabase.sql`
**Reescrever**: `src/lib/store.ts` (vira hooks de Query), todas as 8 rotas, `docs/supabase.md`, `docs/README.md`
**Apagar**: `src/lib/seed.ts`
**Editar**: `package.json` (remover zustand), `src/routes/__root.tsx` (garantir `QueryClientProvider`)

## Como você vai usar depois

1. Abre o SQL Editor do seu projeto Supabase
2. Cola e roda o `docs/setup-supabase.sql`
3. Recarrega o preview — os dados de seed já estarão lá e qualquer alteração persiste no banco
