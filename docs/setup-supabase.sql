-- =====================================================================
-- Up Serviços — Setup completo do Supabase
-- Cole tudo no SQL Editor do seu projeto e execute uma única vez.
-- =====================================================================

-- ============ Tabelas ============

create table if not exists empresas (
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

create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  telefone text,
  email text,
  documento text,
  endereco jsonb default '{}'::jsonb,
  observacoes text,
  created_at timestamptz default now()
);

create table if not exists servicos (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  descricao text,
  valor_padrao numeric(12,2) default 0,
  unidade text default 'serviço',
  ativo boolean default true,
  observacoes text
);

create table if not exists orcamentos (
  id uuid primary key default gen_random_uuid(),
  numero text unique not null,
  cliente_id uuid references clientes(id) on delete set null,
  nome_projeto text,
  descricao text,
  status text default 'orcamento',
  desconto numeric(12,2) default 0,
  desconto_percentual numeric(5,2) default 0,
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

create table if not exists orcamento_itens (
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

create table if not exists financeiro (
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

create table if not exists historico_status (
  id uuid primary key default gen_random_uuid(),
  orcamento_id uuid references orcamentos(id) on delete cascade,
  status_anterior text,
  status_novo text,
  data timestamptz default now(),
  observacao text
);

-- ============ Índices ============
create index if not exists idx_orcamentos_cliente on orcamentos(cliente_id);
create index if not exists idx_orcamentos_status on orcamentos(status);
create index if not exists idx_itens_orcamento on orcamento_itens(orcamento_id);
create index if not exists idx_financeiro_orcamento on financeiro(orcamento_id);
create index if not exists idx_financeiro_cliente on financeiro(cliente_id);
create index if not exists idx_historico_orcamento on historico_status(orcamento_id);

-- ============ RLS (liberado para anon — sistema de uso pessoal) ============
alter table empresas enable row level security;
alter table clientes enable row level security;
alter table servicos enable row level security;
alter table orcamentos enable row level security;
alter table orcamento_itens enable row level security;
alter table financeiro enable row level security;
alter table historico_status enable row level security;

do $$
declare t text;
begin
  for t in select unnest(array['empresas','clientes','servicos','orcamentos','orcamento_itens','financeiro','historico_status'])
  loop
    execute format('drop policy if exists "anon_all" on %I', t);
    execute format('create policy "anon_all" on %I for all to anon using (true) with check (true)', t);
  end loop;
end $$;

-- ============ Dados iniciais (seed) ============

insert into empresas (id, nome, documento, telefone, email, site, endereco, dados_bancarios, condicoes_padrao, observacoes_padrao)
values (
  '11111111-1111-1111-1111-111111111111',
  'Sua Empresa Dev',
  '000.000.000-00',
  '(11) 99999-9999',
  'contato@suaempresa.dev',
  'https://suaempresa.dev',
  '{"rua":"Rua Exemplo","numero":"100","bairro":"Centro","cidade":"São Paulo","estado":"SP","cep":"00000-000"}'::jsonb,
  'PIX: contato@suaempresa.dev',
  E'• 50% na aprovação do orçamento e 50% na entrega.\n• Validade da proposta: 15 dias.\n• Alterações de escopo serão orçadas à parte.',
  'Obrigado por considerar nossos serviços. Estamos à disposição para esclarecer qualquer dúvida.'
) on conflict (id) do nothing;

insert into clientes (id, nome, telefone, email, documento, endereco, observacoes) values
  ('cccccccc-0000-0000-0000-000000000001', 'Upcao Digital', '(71) 99711-9961', 'contato@upcao.com', '12.345.678/0001-90',
   '{"rua":"Rua Colibri","numero":"2","bairro":"Valéria","cidade":"Salvador","estado":"BA","cep":"41300-420"}'::jsonb, 'Cliente recorrente'),
  ('cccccccc-0000-0000-0000-000000000002', 'Padaria do Bairro', '(11) 98765-4321', 'padaria@exemplo.com', null,
   '{"cidade":"São Paulo","estado":"SP"}'::jsonb, null)
on conflict (id) do nothing;

insert into servicos (id, nome, descricao, valor_padrao, unidade, ativo) values
  ('55555555-0000-0000-0000-000000000001','Criação de site','Site institucional responsivo',3500,'serviço',true),
  ('55555555-0000-0000-0000-000000000002','Criação de sistema web','Sistema sob demanda',8000,'pacote',true),
  ('55555555-0000-0000-0000-000000000003','Criação de aplicativo','App mobile',12000,'pacote',true),
  ('55555555-0000-0000-0000-000000000004','Automação','Automação de processos',150,'hora',true),
  ('55555555-0000-0000-0000-000000000005','Integração com API','Integração com APIs externas',150,'hora',true),
  ('55555555-0000-0000-0000-000000000006','Criação de plugin','Plugin WordPress/Chrome',2000,'serviço',true),
  ('55555555-0000-0000-0000-000000000007','Correção de bug','Correção pontual',120,'hora',true),
  ('55555555-0000-0000-0000-000000000008','Consultoria','Consultoria técnica',200,'hora',true),
  ('55555555-0000-0000-0000-000000000009','Manutenção mensal','Manutenção e suporte',800,'mensalidade',true),
  ('55555555-0000-0000-0000-00000000000a','Desenvolvimento Bubble','App em Bubble.io',180,'hora',true),
  ('55555555-0000-0000-0000-00000000000b','Desenvolvimento no-code/low-code','Soluções no-code',150,'hora',true),
  ('55555555-0000-0000-0000-00000000000c','Desenvolvimento HTML/CSS/JS','Frontend custom',120,'hora',true)
on conflict (id) do nothing;

insert into orcamentos (id, numero, cliente_id, nome_projeto, descricao, status, desconto, acrescimo, forma_pagamento, prazo_entrega, validade, condicoes, data_criacao, data_aprovacao)
values
  ('aaaaaaaa-0000-0000-0000-000000000001','ORC-20260101-00001','cccccccc-0000-0000-0000-000000000001','Site institucional Upcao','Site responsivo com 5 páginas e blog.','orcamento',200,0,'Pix — 50% entrada e 50% entrega',
   now() + interval '30 days', now() + interval '15 days',
   E'• 50% na aprovação do orçamento e 50% na entrega.\n• Validade da proposta: 15 dias.\n• Alterações de escopo serão orçadas à parte.',
   now() - interval '2 days', null),
  ('aaaaaaaa-0000-0000-0000-000000000002','ORC-20260102-00002','cccccccc-0000-0000-0000-000000000002','Sistema de pedidos Padaria',null,'em_producao',0,0,'Pix',
   now() + interval '45 days', now() + interval '15 days',
   E'• 50% na aprovação do orçamento e 50% na entrega.\n• Validade da proposta: 15 dias.\n• Alterações de escopo serão orçadas à parte.',
   now() - interval '10 days', now() - interval '5 days')
on conflict (id) do nothing;

insert into orcamento_itens (orcamento_id, servico_id, nome, descricao, unidade, quantidade, valor_unitario, ordem) values
  ('aaaaaaaa-0000-0000-0000-000000000001','55555555-0000-0000-0000-000000000001','Criação de site','Site institucional 5 páginas','serviço',1,3500,0),
  ('aaaaaaaa-0000-0000-0000-000000000001','55555555-0000-0000-0000-000000000009','Manutenção mensal','Suporte mensal por 3 meses','mensalidade',3,800,1),
  ('aaaaaaaa-0000-0000-0000-000000000002','55555555-0000-0000-0000-000000000002','Criação de sistema web','Sistema de pedidos online','pacote',1,8000,0)
on conflict do nothing;

insert into historico_status (orcamento_id, status_anterior, status_novo, data) values
  ('aaaaaaaa-0000-0000-0000-000000000002','orcamento','em_producao', now() - interval '5 days')
on conflict do nothing;

insert into financeiro (tipo, descricao, cliente_id, orcamento_id, valor, vencimento, pagamento, status, forma_pagamento) values
  ('receber','Entrada — Sistema Padaria','cccccccc-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000002',4000, now() - interval '5 days', now() - interval '5 days','pago','Pix'),
  ('receber','Final — Sistema Padaria','cccccccc-0000-0000-0000-000000000002','aaaaaaaa-0000-0000-0000-000000000002',4000, now() + interval '45 days', null,'pendente','Pix'),
  ('pagar','Hospedagem servidor', null, null, 120, now() + interval '10 days', null,'pendente', null)
on conflict do nothing;
