-- Up Serviços — Autenticação (Supabase Auth, OTP, multi-tenant)
-- Execute após 2026-06-06-admin-panel.sql

-- ============ auth_user_id em empresas ============

alter table empresas
  add column if not exists auth_user_id uuid unique;

-- Telefone único por empresa (11 dígitos normalizados na aplicação)
create unique index if not exists idx_empresas_telefone_unique
  on empresas (telefone)
  where telefone is not null and telefone <> '';

-- ============ login_otp (hash SHA-256, service role only) ============

create table if not exists login_otp (
  whatsapp text not null,
  purpose text not null default 'login',
  code_hash text not null,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  primary key (whatsapp, purpose)
);

alter table login_otp enable row level security;
-- Sem policy anon: apenas service role

-- ============ Multi-tenant: empresa_id nas tabelas ERP ============

alter table clientes add column if not exists empresa_id uuid references empresas(id) on delete cascade;
alter table servicos add column if not exists empresa_id uuid references empresas(id) on delete cascade;
alter table orcamentos add column if not exists empresa_id uuid references empresas(id) on delete cascade;
alter table financeiro add column if not exists empresa_id uuid references empresas(id) on delete cascade;

update clientes set empresa_id = '11111111-1111-1111-1111-111111111111' where empresa_id is null;
update servicos set empresa_id = '11111111-1111-1111-1111-111111111111' where empresa_id is null;
update orcamentos set empresa_id = '11111111-1111-1111-1111-111111111111' where empresa_id is null;
update financeiro set empresa_id = '11111111-1111-1111-1111-111111111111' where empresa_id is null;

create index if not exists idx_clientes_empresa on clientes(empresa_id);
create index if not exists idx_servicos_empresa on servicos(empresa_id);
create index if not exists idx_orcamentos_empresa on orcamentos(empresa_id);
create index if not exists idx_financeiro_empresa on financeiro(empresa_id);
