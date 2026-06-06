-- Up Serviços — Categoria de empresa + Assistência Técnica (estoque, OS, financeiro manual)
-- Execute após migrations anteriores (RLS multi-tenant)

-- ============ Categoria da empresa ============

alter table empresas
  add column if not exists categoria text not null default 'generico'
  check (categoria in ('generico', 'assistencia_tecnica'));

create index if not exists empresas_categoria_idx on empresas (categoria);

-- ============ Produtos (estoque) ============

create table if not exists produtos (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  nome text not null,
  categoria text not null default 'outro'
    check (categoria in ('tela', 'bateria', 'conector', 'acessorio', 'outro')),
  quantidade numeric not null default 0,
  qtd_minima numeric not null default 0,
  preco_custo numeric not null default 0,
  preco_venda numeric not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists produtos_empresa_id_idx on produtos (empresa_id);

alter table produtos enable row level security;

create policy "tenant_all" on produtos
  for all to authenticated
  using (empresa_id = auth_empresa_id())
  with check (empresa_id = auth_empresa_id());

-- ============ OS Assistência Técnica (extensão 1:1) ============

create table if not exists orcamento_assistencia (
  orcamento_id uuid primary key references orcamentos(id) on delete cascade,
  aparelho_marca text,
  aparelho_modelo text,
  imei text,
  defeito_relatado text,
  acessorios text,
  senha_dispositivo text,
  checklist_entrada jsonb default '{}'::jsonb
);

alter table orcamento_assistencia enable row level security;

create policy "tenant_via_orcamento" on orcamento_assistencia
  for all to authenticated
  using (
    exists (
      select 1 from orcamentos o
      where o.id = orcamento_assistencia.orcamento_id
        and o.empresa_id = auth_empresa_id()
    )
  )
  with check (
    exists (
      select 1 from orcamentos o
      where o.id = orcamento_assistencia.orcamento_id
        and o.empresa_id = auth_empresa_id()
    )
  );

-- ============ Itens de orçamento com peça do estoque ============

alter table orcamento_itens
  add column if not exists produto_id uuid references produtos(id) on delete set null;

-- ============ Financeiro: transações manuais (fluxo de caixa) ============

alter table financeiro
  add column if not exists origem text not null default 'automatico'
  check (origem in ('automatico', 'manual'));

alter table financeiro
  add column if not exists categoria_caixa text
  check (
    categoria_caixa is null
    or categoria_caixa in (
      'servico', 'venda', 'compra_pecas', 'aluguel', 'energia',
      'internet', 'salarios', 'outros'
    )
  );

-- Lançamentos automáticos de OS permanecem sem categoria_caixa
update financeiro set origem = 'automatico' where orcamento_id is not null;
