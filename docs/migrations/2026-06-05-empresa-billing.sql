-- Up Serviços — Billing Woovi (assinatura SaaS)
-- Execute no SQL Editor do Supabase após setup-supabase.sql

-- ============ Colunas em empresas ============

alter table empresas
  add column if not exists created_at timestamptz default now(),
  add column if not exists billing_status text default 'trial',
  add column if not exists trial_ends_at timestamptz,
  add column if not exists next_billing_at timestamptz,
  add column if not exists billing_period_ends_at timestamptz,
  add column if not exists last_payment_at timestamptz,
  add column if not exists woovi_charge_correlation_id text,
  add column if not exists woovi_payment_link_url text;

-- Backfill empresa seed
update empresas
set
  created_at = coalesce(created_at, now()),
  billing_status = coalesce(billing_status, 'trial'),
  trial_ends_at = coalesce(trial_ends_at, now() + interval '7 days'),
  next_billing_at = coalesce(next_billing_at, now() + interval '7 days')
where id = '11111111-1111-1111-1111-111111111111';

-- ============ billing_payments ============

create table if not exists billing_payments (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  paid_at timestamptz not null,
  value_cents int not null default 3990,
  correlation_id text,
  end_to_end_id text,
  woovi_transaction_id text,
  woovi_event_key text unique,
  status text not null default 'pago',
  refunded_at timestamptz,
  refund_value_cents int,
  refund_woovi_event_key text,
  refund_type text,
  days_used_at_refund int,
  suggested_refund_cents int,
  created_at timestamptz default now()
);

create index if not exists idx_billing_payments_empresa on billing_payments(empresa_id);
create index if not exists idx_billing_payments_paid_at on billing_payments(paid_at desc);
create index if not exists idx_billing_payments_end_to_end on billing_payments(end_to_end_id);

-- ============ billing_events (idempotência webhook) ============

create table if not exists billing_events (
  id uuid primary key default gen_random_uuid(),
  event_key text not null unique,
  empresa_id uuid references empresas(id) on delete set null,
  event_type text,
  payload jsonb,
  created_at timestamptz default now()
);

-- ============ billing_reminder_log ============

create table if not exists billing_reminder_log (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references empresas(id) on delete cascade,
  reminder_key text not null,
  channel text default 'whatsapp_stub',
  sent_at timestamptz default now(),
  unique (empresa_id, reminder_key)
);

-- ============ RLS (service role bypassa; anon leitura liberada) ============

alter table billing_payments enable row level security;
alter table billing_events enable row level security;
alter table billing_reminder_log enable row level security;

do $$
declare t text;
begin
  for t in select unnest(array['billing_payments','billing_events','billing_reminder_log'])
  loop
    execute format('drop policy if exists "anon_read" on %I', t);
    execute format('create policy "anon_read" on %I for select to anon using (true)', t);
  end loop;
end $$;
