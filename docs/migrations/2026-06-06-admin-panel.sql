-- Freela OS — Painel administrativo (empresas, system_settings, OTP admin)
-- Execute no SQL Editor do Supabase após 2026-06-05-empresa-billing.sql

-- ============ Status operacional em empresas ============

alter table empresas
  add column if not exists status text not null default 'ativo';

update empresas set status = 'ativo' where status is null;

-- ============ system_settings ============

create table if not exists system_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into system_settings (key, value) values
  ('billing', '{"plan_value_cents": 3990}'),
  ('admin', '{"contact_whatsapp": ""}')
on conflict (key) do nothing;

-- ============ OTP admin (login) ============

create table if not exists admin_otp_codes (
  id uuid primary key default gen_random_uuid(),
  whatsapp text not null,
  code text not null,
  purpose text not null default 'admin_login',
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_admin_otp_whatsapp on admin_otp_codes(whatsapp, purpose, created_at desc);

-- ============ RLS ============

alter table system_settings enable row level security;

drop policy if exists "anon_read" on system_settings;
create policy "anon_read" on system_settings for select to anon using (true);

alter table admin_otp_codes enable row level security;
-- Sem policy para anon: apenas service role acessa OTP

-- ============ Realtime ============

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table empresas;
    alter publication supabase_realtime add table billing_payments;
    alter publication supabase_realtime add table system_settings;
  end if;
exception
  when duplicate_object then null;
end $$;
