# Autenticação — Freela OS

## Fluxos

### Primeiro acesso — `/cadastro/empresa`

- Nome da empresa + WhatsApp (máscara BR)
- Valida WhatsApp na Evolution
- Cria `auth.users` (e-mail sintético invisível) + linha em `empresas`
- Entra direto no dashboard (sem OTP no cadastro)

### Login unificado — `/login`

1. WhatsApp → servidor detecta papel:
   - **Allowlist admin** → OTP `admin_login` → `/admin/dashboard`
   - **Empresa cadastrada** → OTP `login` → `/` (dashboard)
   - **Não cadastrado** → link para cadastro
2. OTP de 6 dígitos via Evolution (ou mock em dev)
3. Empresa: sessão Supabase Auth + `localStorage` (`tipo: "empresa"`)

### Admin criar empresa

- `/admin/empresas` → **Nova empresa**
- Mesmo backend do cadastro (Auth + `empresas`), sem OTP
- Cliente faz login depois em `/login`

## E-mail sintético (Supabase Auth)

```
freela_os_empresa_71996755745@auth.freelaos.local
```

Senha aleatória rotacionada no servidor a cada login OTP.

## Variáveis

```env
ADMIN_WHATSAPP_ALLOWLIST=71996755745
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE=
EVOLUTION_MOCK=true   # desenvolvimento
```

## Migration

```
docs/migrations/2026-06-06-auth-login.sql
```

- `login_otp` (hash SHA-256)
- `empresas.auth_user_id`
- `empresa_id` em clientes, servicos, orcamentos, financeiro

## Rotas públicas

- `/login`
- `/cadastro/empresa`

Demais rotas ERP exigem sessão `tipo: "empresa"`. Rotas `/admin/*` exigem `tipo: "admin"`.
