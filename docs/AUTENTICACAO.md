# Autenticação — Up Serviços

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

- `/login` — **login unificado** (empresa **e** admin)
- `/cadastro/empresa` — primeiro acesso

Demais rotas ERP exigem sessão `tipo: "empresa"`. Rotas `/admin/*` exigem `tipo: "admin"`.

### Como entrar no admin

1. Acesse **`https://seu-dominio.com/login`** (não existe tela separada — `/admin/login` redireciona para `/login`)
2. Informe o WhatsApp que está em `ADMIN_WHATSAPP_ALLOWLIST` (ex.: `71996755745`)
3. Receba OTP no WhatsApp → confirme → vai para `/admin/dashboard`

O servidor detecta automaticamente: allowlist = admin; cadastro existente = empresa.

### Evolution — por que “instância não configurada”?

O WhatsApp **conectado no painel Evolution** ≠ o app saber qual instância usar. O Worker precisa de:

```env
EVOLUTION_API_URL=https://sua-evolution.com
EVOLUTION_API_KEY=sua-chave
EVOLUTION_INSTANCE=nome-exato-da-instancia
```

O nome em `EVOLUTION_INSTANCE` deve ser **idêntico** ao que aparece no painel Evolution (case sensitive).

**Atalho para testar sem Evolution:** `EVOLUTION_MOCK=true` no Worker — OTP aparece no toast da tela.

OTP **não usa webhook** — só envia mensagem. Webhook é outro fluxo (ex.: Woovi PIX).
