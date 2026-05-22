# Banco de Dados

A estrutura segue exatamente os tipos em `src/lib/types.ts`. Quando migrar para Supabase, use o SQL abaixo como base.

## Tabelas

### empresas
| Campo | Tipo | Notas |
|---|---|---|
| id | uuid PK | |
| nome | text | obrigatório |
| logo_url | text | data URL ou URL pública |
| documento | text | CPF/CNPJ |
| telefone | text | |
| email | text | |
| endereco | jsonb | {rua, numero, bairro, cidade, estado, cep, complemento} |
| site | text | |
| redes_sociais | text | |
| dados_bancarios | text | |
| condicoes_padrao | text | |
| observacoes_padrao | text | |

### clientes
| Campo | Tipo |
|---|---|
| id | uuid PK |
| nome | text not null |
| telefone | text |
| email | text |
| documento | text |
| endereco | jsonb |
| observacoes | text |
| created_at | timestamptz default now() |

### servicos
| Campo | Tipo |
|---|---|
| id | uuid PK |
| nome | text not null |
| descricao | text |
| valor_padrao | numeric(12,2) |
| unidade | text check in ('serviço','hora','mensalidade','pacote') |
| ativo | boolean default true |
| observacoes | text |

### orcamentos
| Campo | Tipo |
|---|---|
| id | uuid PK |
| numero | text unique |
| cliente_id | uuid FK → clientes |
| nome_projeto | text |
| descricao | text |
| status | text check in ('orcamento','em_producao','vistoria','entregue') |
| desconto | numeric(12,2) default 0 |
| acrescimo | numeric(12,2) default 0 |
| forma_pagamento | text |
| prazo_entrega | timestamptz |
| validade | timestamptz |
| observacoes | text |
| condicoes | text |
| data_criacao | timestamptz default now() |
| data_aprovacao | timestamptz |
| data_entrega | timestamptz |

### orcamento_itens
| Campo | Tipo |
|---|---|
| id | uuid PK |
| orcamento_id | uuid FK → orcamentos on delete cascade |
| servico_id | uuid FK → servicos null |
| nome | text |
| descricao | text |
| unidade | text |
| quantidade | numeric(12,2) |
| valor_unitario | numeric(12,2) |
| ordem | int |

### financeiro
| Campo | Tipo |
|---|---|
| id | uuid PK |
| tipo | text check in ('pagar','receber') |
| descricao | text |
| cliente_id | uuid FK → clientes null |
| orcamento_id | uuid FK → orcamentos null |
| valor | numeric(12,2) |
| vencimento | timestamptz |
| pagamento | timestamptz |
| status | text check in ('pendente','pago','atrasado','parcial') |
| forma_pagamento | text |
| observacoes | text |

### historico_status
| Campo | Tipo |
|---|---|
| id | uuid PK |
| orcamento_id | uuid FK |
| status_anterior | text |
| status_novo | text |
| data | timestamptz default now() |
| observacao | text |

> Para uso pessoal sem multi-tenant, RLS pode ficar desabilitada. Se publicar futuramente, habilite RLS e adicione policies por `auth.uid()`.

## Relacionamentos

```
empresas (1) — N/A (registro único)
clientes (1) — (N) orcamentos
orcamentos (1) — (N) orcamento_itens
orcamentos (1) — (N) financeiro
orcamentos (1) — (N) historico_status
servicos (1) — (N) orcamento_itens (opcional, snapshot do nome/preço fica no item)
```

## SQL inicial

```sql
create table empresas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  logo_url text,
  documento text,
  telefone text,
  email text,
  endereco jsonb default '{}'::jsonb,
  site text,
  redes_sociais text,
  dados_bancarios text,
  condicoes_padrao text,
  observacoes_padrao text
);

create table clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  email text,
  documento text,
  endereco jsonb default '{}'::jsonb,
  observacoes text,
  created_at timestamptz default now()
);

create table servicos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  valor_padrao numeric(12,2) default 0,
  unidade text default 'serviço',
  ativo boolean default true,
  observacoes text
);

create table orcamentos (
  id uuid primary key default gen_random_uuid(),
  numero text unique not null,
  cliente_id uuid references clientes(id) on delete set null,
  nome_projeto text,
  descricao text,
  status text default 'orcamento',
  desconto numeric(12,2) default 0,
  acrescimo numeric(12,2) default 0,
  forma_pagamento text,
  prazo_entrega timestamptz,
  validade timestamptz,
  observacoes text,
  condicoes text,
  data_criacao timestamptz default now(),
  data_aprovacao timestamptz,
  data_entrega timestamptz
);

create table orcamento_itens (
  id uuid primary key default gen_random_uuid(),
  orcamento_id uuid references orcamentos(id) on delete cascade,
  servico_id uuid references servicos(id) on delete set null,
  nome text,
  descricao text,
  unidade text,
  quantidade numeric(12,2) default 1,
  valor_unitario numeric(12,2) default 0,
  ordem int default 0
);

create table financeiro (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  descricao text,
  cliente_id uuid references clientes(id) on delete set null,
  orcamento_id uuid references orcamentos(id) on delete set null,
  valor numeric(12,2) default 0,
  vencimento timestamptz,
  pagamento timestamptz,
  status text default 'pendente',
  forma_pagamento text,
  observacoes text
);

create table historico_status (
  id uuid primary key default gen_random_uuid(),
  orcamento_id uuid references orcamentos(id) on delete cascade,
  status_anterior text,
  status_novo text,
  data timestamptz default now(),
  observacao text
);
```
