# Painel administrativo — Up Serviços

Operador da plataforma gerencia **empresas** (tenants), billing e configurações globais.

## Rotas

| Rota | Função |
|------|--------|
| `/login` | Login unificado — admin (allowlist) ou empresa |
| `/admin/login` | Redireciona para `/login` |
| `/admin/dashboard` | Métricas agregadas |
| `/admin/empresas` | Listagem de todas as empresas |
| `/admin/empresas/{id}` | Detalhe + histórico de pagamentos |
| `/admin/configuracoes` | Valor do plano e contato de suporte |

## Variáveis de ambiente (servidor)

```env
ADMIN_WHATSAPP_ALLOWLIST=71996755745,71988887777
```

Lista separada por vírgula — apenas 11 dígitos (DDD + número). Toda server function revalida a allowlist.

## Migration

Execute no Supabase:

```
docs/migrations/2026-06-06-admin-panel.sql
```

Cria `empresas.status`, `system_settings`, `admin_otp_codes` e publicação Realtime.

## Login (OTP)

1. Acesse `/admin/login`
2. Informe WhatsApp da allowlist
3. Código OTP é gerado e logado no servidor (`[admin-otp]` — stub WhatsApp)
4. Confirme o código de 6 dígitos
5. Sessão gravada em `localStorage` (`freela_os_sessao`, `tipo: "admin"`)

## Dois eixos de status

- **Operacional** (`empresas.status`): `ativo` / `inativo` — pausa manual pelo admin
- **Pagamento** (`empresas.billing_status`): `trial` / `ativo` / `pendente` / `inadimplente`

São independentes: empresa pode ter plano ativo e estar pausada pelo admin.

## Valor do plano

Configurado em `/admin/configuracoes` → `system_settings` chave `billing` (`plan_value_cents`).

Novas cobranças Woovi usam o valor atualizado. Pagamentos já registrados não são alterados.

## Realtime

Canal Supabase escuta `empresas`, `billing_payments` e `system_settings` — UI admin e página `/plano` atualizam sem F5.
