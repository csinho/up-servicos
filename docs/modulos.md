# Módulos

## 1. Dashboard (`/`)

Cards de indicadores:
- **Em orçamento / Em produção / Entregue** — soma dos totais por status.
- **A receber / Recebido / A pagar** — calculados sobre os lançamentos do módulo Financeiro.

Mais duas seções:
- **Últimos orçamentos** — 5 mais recentes (clicáveis).
- **Próximos vencimentos** — lançamentos pendentes ordenados por data.

## 2. Kanban (`/kanban`)

Colunas: **Orçamento → Em produção → Vistoria → Entregue**.

- Cards arrastáveis com @dnd-kit; ao soltar, o status é atualizado em `store.moveOrcamento`.
- **Aprovação automática:** ao mover para *Em produção*, registra `data_aprovacao` e cria automaticamente uma conta a receber no Financeiro (apenas uma — se já existir vinculada, não duplica).
- Ao mover para *Entregue*, registra `data_entrega`.
- O card mostra cliente, valor, prazo e indicador financeiro (Pago/Parcial/Pendente) derivado dos lançamentos vinculados.
- Clique no card abre `/orcamentos/$id` (edição completa).

## 3. Clientes (`/clientes`)

CRUD simples. Cliente é vinculado por `cliente_id` nos orçamentos e em lançamentos financeiros.

## 4. Serviços (`/servicos`)

Catálogo de serviços com `valor_padrao` e `unidade`. Usado no orçamento via combobox "Adicionar do catálogo" — ao escolher, copia nome/descrição/unidade/valor para o item.

## 5. Orçamentos (`/orcamentos` e `/orcamentos/$id`)

Lista tabular + tela de edição.

### Fluxo de criação
1. Clicar em **Novo orçamento** — cria registro com `numero` automático (`ORC-YYYYMMDD-NNNNN`) e status `orcamento`.
2. Selecionar cliente, preencher projeto, adicionar itens (do catálogo ou em branco).
3. Editar qtd / valor unitário; subtotal é calculado em tempo real.
4. Aplicar **Desconto** / **Acréscimo** — total atualizado automaticamente.
5. Preencher forma de pagamento, prazo, validade, condições e observações (preenche com os textos padrão da empresa).
6. **Salvar.**

### Aprovação → Pedido
Alterar status para **Em produção** (no select da topbar ou arrastando no Kanban). O sistema:
- Marca data de aprovação.
- Adiciona ao histórico de status.
- Cria conta a receber (se ainda não existir).

### PDF
- **Visualizar PDF** — abre modal com `<PDFViewer>` (preview embarcado).
- **Baixar PDF** — `<PDFDownloadLink>` baixa `ORC-…pdf`.

## 6. Financeiro (`/financeiro`)

Lançamentos de **pagar** ou **receber** com status (pendente, pago, parcial, atrasado) e vínculo opcional a cliente/orçamento. Filtro rápido por tipo. Os totais alimentam o Dashboard.

## 7. Empresa (`/empresa`)

Cadastro único da sua empresa. Inclui upload de logo (convertida para Data URL e salva em `localStorage`), endereço, dados bancários/Pix, e textos padrão de **condições** e **observações** que são pré-preenchidos em novos orçamentos.

## Cálculos

```ts
subtotal = Σ (item.quantidade × item.valor_unitario)
total    = subtotal - desconto + acrescimo
```

Helpers em `src/lib/types.ts`: `calcSubtotal`, `calcTotal`, `formatBRL`, `formatDate`.
