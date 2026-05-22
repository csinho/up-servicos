
# Sistema Interno para Freelancer

Sistema administrativo de página única (sem login) para gerenciar orçamentos, pedidos, clientes, serviços e financeiro, com Kanban arrastável e geração de PDF profissional inspirada no modelo enviado.

## Stack e Arquitetura

- TanStack Start + React + TypeScript + Tailwind (já configurados)
- shadcn/ui para componentes (cards, tabelas, modais, formulários)
- @dnd-kit para Kanban arrastável
- react-hook-form + zod para formulários
- @react-pdf/renderer para geração do PDF (visualização + download)
- Zustand para estado global + persistência em localStorage (camada de "repositório" isolada para troca futura por Supabase)
- Dados mockados iniciais (clientes, serviços, orçamentos de exemplo)

## Estrutura de Rotas (src/routes/)

```
__root.tsx              Layout com sidebar + topbar
index.tsx               Dashboard
kanban.tsx              Kanban de orçamentos/pedidos
clientes.tsx            Lista + CRUD de clientes
servicos.tsx            Lista + CRUD de serviços
orcamentos.tsx          Lista tabular de orçamentos
orcamentos.$id.tsx      Detalhe / edição de orçamento + preview PDF
financeiro.tsx          Contas a pagar/receber
empresa.tsx             Dados da minha empresa
```

## Módulos

### 1. Dashboard
Cards de indicadores: total em orçamentos abertos, em produção, entregues, a receber, recebido, a pagar; lista dos últimos orçamentos; próximos vencimentos; gráfico simples por status.

### 2. Kanban
4 colunas: Orçamento → Em produção → Vistoria → Entregue. Cards arrastáveis com nome do cliente, projeto, valor, prazo, status financeiro (badge pago/pendente/parcial), data. Ao soltar em "Em produção", marca data de aprovação e oferece criar conta a receber. Click no card abre modal de detalhes.

### 3. Clientes
Tabela com busca; modal de criação/edição com nome, telefone, e-mail, CPF/CNPJ, endereço completo, observações.

### 4. Serviços
Tabela + modal: nome, descrição, valor padrão, unidade (serviço/hora/mensalidade/pacote), ativo/inativo, observações. Lista pré-populada com os serviços do briefing.

### 5. Orçamentos
Tela de criação/edição com:
- Número automático (formato `ORC-AAAAMMDD-NNNNN`)
- Seleção de cliente (combobox)
- Nome e descrição do projeto
- Tabela de itens (adicionar serviço do catálogo, editar descrição/qtd/valor unitário; subtotal calculado)
- Desconto, acréscimo, total final automáticos
- Forma de pagamento, prazo de entrega, validade, observações, condições comerciais (com texto padrão da empresa)
- Histórico de mudanças de status
- Botões: Salvar, Visualizar PDF, Baixar PDF, Mover para próxima etapa

### 6. Geração de PDF
Componente `OrcamentoPDF` com @react-pdf/renderer reproduzindo o layout do modelo enviado:
- Cabeçalho com logo + dados da empresa à esquerda, bloco "ORÇAMENTO Nº / Data / Status" à direita
- Bloco "Dados do cliente"
- Bloco de totais (subtotal, desconto, acréscimo, total)
- Tabela de itens (item, serviço, descrição, un., qtde, preço un., subtotal, prazo)
- Condições comerciais, forma de pagamento, observações
- Rodapé com campo de aceite/assinatura e dados de recebimento
Visualização inline via `<PDFViewer>` + download via `<PDFDownloadLink>`.

### 7. Financeiro
Tabela de lançamentos com filtros (tipo, status, período). Modal de criação/edição: tipo (pagar/receber), descrição, cliente, orçamento vinculado, valor, vencimento, pagamento, status, forma. Geração automática de conta a receber quando orçamento é aprovado.

### 8. Empresa
Formulário único: nome, logo (upload → base64 em localStorage), CPF/CNPJ, telefone, e-mail, endereço, site, redes sociais, dados bancários/Pix, condições comerciais padrão, observações padrão. Usado automaticamente no PDF.

## Camada de Dados (preparada para Supabase)

Tudo passa por `src/lib/repository/*.ts` (um arquivo por entidade) com interface assíncrona. Implementação inicial usa Zustand + localStorage; trocar por Supabase depois é só reimplementar o repositório.

### Tabelas planejadas

- **empresas** — id, nome, logo_url, documento, telefone, email, endereco, site, redes_sociais (jsonb), dados_bancarios, condicoes_padrao, observacoes_padrao
- **clientes** — id, nome, telefone, email, documento, endereco (jsonb), observacoes, created_at
- **servicos** — id, nome, descricao, valor_padrao, unidade, ativo, observacoes
- **orcamentos** — id, numero, cliente_id (FK), nome_projeto, descricao, status (enum: orcamento/em_producao/vistoria/entregue), subtotal, desconto, acrescimo, total, forma_pagamento, prazo_entrega, validade, observacoes, condicoes, data_criacao, data_aprovacao, data_entrega
- **orcamento_itens** — id, orcamento_id (FK), servico_id (FK nullable), descricao, quantidade, valor_unitario, valor_total, ordem
- **financeiro** — id, tipo (pagar/receber), descricao, cliente_id (FK nullable), orcamento_id (FK nullable), valor, vencimento, pagamento, status (pendente/pago/atrasado/parcial), forma_pagamento, observacoes
- **historico_status** — id, orcamento_id (FK), status_anterior, status_novo, data, observacao
- **configuracoes** — id, chave, valor (jsonb)

## Documentação

Pasta `docs/` no projeto com arquivos markdown:
- `README.md` — visão geral e como rodar
- `modulos.md` — cada módulo, fluxos e componentes
- `banco-de-dados.md` — tabelas, campos, relacionamentos, SQL pronto para Supabase
- `supabase.md` — passo a passo para conectar Supabase e substituir o repositório mock
- `pdf.md` — como o PDF é montado e como customizar

## Visual

Sidebar fixa à esquerda com navegação (Dashboard, Kanban, Orçamentos, Clientes, Serviços, Financeiro, Empresa), topbar com nome do sistema. Tema claro profissional, tipografia limpa (Inter), tokens semânticos em `src/styles.css`. Responsivo (sidebar colapsa em mobile).

## O que NÃO entra agora (mantém escopo)

- Login/auth (sistema é pessoal)
- Integração real com Supabase (estrutura pronta, mas não conectada)
- Envio de e-mail / WhatsApp do orçamento
- Upload de logo para storage remoto (fica em base64 local)
