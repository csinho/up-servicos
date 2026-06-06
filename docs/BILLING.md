# Billing — Assinatura Woovi (Up Serviços)

Assinatura mensal do **próprio Up Serviços** via PIX (Woovi/OpenPix). Não confundir com cobrança de pedidos dos clientes do freelancer.

## Modelo

| Item | Valor |
| --- | --- |
| Trial | 7 dias no cadastro |
| Plano | R$ 39,90/mês (3990 centavos) |
| Meio | PIX dinâmico (link + QR) |
| Renovação | +30 dias por pagamento (+ crédito de antecipação) |
| Lembretes | Stub WhatsApp (logs) nos dias 5, 3 e 1 |
| Inadimplência | Bloqueia novo orçamento e aprovação no Kanban |

## Variáveis de ambiente (servidor)

Ver `.env.example`. **Nunca** usar prefixo `VITE_` em credenciais Woovi ou service role.

| Variável | Uso |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Escritas de billing no Supabase |
| `WOOVI_APP_ID` | API Woovi (`Authorization` sem Bearer) |
| `BILLING_CRON_SECRET` | Protege `GET /api/cron/billing` |
| `PUBLIC_APP_URL` | Links em notificações |

Opcional: `WOOVI_WEBHOOK_AUTHORIZATION` — só se você definir um header Authorization no webhook do painel Woovi. Por padrão o endpoint aceita POST sem validação de header.

## SQL

Aplicar `docs/migrations/2026-06-05-empresa-billing.sql` no Supabase.

## Endpoints

| Rota | Método | Função |
| --- | --- | --- |
| `/api/webhooks/woovi` | POST | Webhook Woovi |
| `/api/cron/billing` | GET | Job diário (lembretes, pendente, PIX auto) |

Server functions (TanStack Start): `src/lib/api/billing.functions.ts`.

## Cron

- **Cloudflare Workers:** `wrangler.jsonc` → `0 12 * * *` (09:00 BRT) + handler `scheduled` em `src/server.ts`.
- **Docker/EasyPanel:** agendar HTTP externo:

```bash
curl "https://SEU-DOMINIO/api/cron/billing?secret=SEU_BILLING_CRON_SECRET"
```

Cron sugerido: `0 12 * * *` (UTC).

## Woovi (painel)

1. API/Plugin → copiar AppID → `WOOVI_APP_ID`
2. Webhook `POST {PUBLIC_APP_URL}/api/webhooks/woovi` (sem header Authorization obrigatório)
3. Eventos: `OPENPIX:CHARGE_COMPLETED`, `PIX_TRANSACTION_REFUND_SENT_CONFIRMED`
4. Teste webhook → `{ "ok": true }`

## Reembolso

- Até o 10º dia: integral
- Depois: pro-rata (dias restantes × valor/30)
- Webhook `PIX_TRANSACTION_REFUND_SENT_CONFIRMED` → plano `pendente`

## Código principal

- `src/lib/billing/` — lógica de negócio
- `src/lib/billing/woovi/` — cliente API
- `src/routes/plano.tsx` — UI
- `src/components/empresa/EmpresaBillingBanner.tsx` — banner global

Guia completo de referência: [PROMPT-WOOVI-INTEGRACAO.md](./PROMPT-WOOVI-INTEGRACAO.md).
