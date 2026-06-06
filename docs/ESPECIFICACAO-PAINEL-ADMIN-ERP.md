# Especificação — Painel administrativo de lojas, billing e configurações

> **Documento portável** para outro agente implementar um painel admin semelhante em **outro projeto ERP**.  
> Referência de implementação: projeto **IndicaAí** (este repositório).  
> Idioma: português (Brasil). Datas: ISO `AAAA-MM-DD`, fuso `America/Sao_Paulo`.

---

## 1. Objetivo

Construir um **módulo administrativo** onde o operador da plataforma pode:

1. **Ver todas as lojas (ou empresas/clientes) cadastradas** no sistema.
2. **Abrir o detalhe de cada loja** e consultar a **situação de pagamento** (trial, ativo, pendente, inadimplente, histórico de PIX/cobranças).
3. **Ativar e desativar a loja manualmente**, independentemente do pagamento estar em dia — bloqueio operacional à parte do billing.
4. **Configurar parâmetros globais** do sistema, em especial o **valor do plano de pagamento** e demais ajustes do módulo admin.
5. **Entrar por uma tela de login exclusiva do admin**, com conta preparada e fluxo seguro.
6. **Persistir tudo no Supabase**; alterações (ex.: preço do plano) gravam no banco na hora e propagam via **Realtime** onde fizer sentido.

O comportamento, as regras de negócio e a **separação entre “loja pausada” e “plano inadimplente”** devem ser **os mesmos conceitos** descritos aqui, mesmo que nomes de tabelas, rotas ou gateway de pagamento mudem no outro ERP.

---

## 2. Adaptação obrigatória para outro ERP

O projeto de destino **pode não ter**:

- vitrine, parceiros, campanhas, analytics;
- gateway Woovi/OpenPix ou Evolution API para WhatsApp;
- os mesmos papéis (`loja`, `parceiro`, `admin`).

**O agente deve adaptar**, mantendo **equivalentes funcionais**:

| Conceito IndicaAí | No outro ERP (exemplos) |
| --- | --- |
| `lojas` | `companies`, `tenants`, `clientes`, `filiais` |
| `billing_status` / `status` | campos equivalentes na entidade principal |
| `system_settings` | tabela de config global ou `settings` JSON |
| `/admin/lojas` | `/admin/empresas`, `/backoffice/clientes`, etc. |
| OTP WhatsApp | e-mail+senha, magic link, SSO — **desde que haja allowlist de admin** |

**Não copiar arquivos cegamente.** Replicar **fluxos, regras, segurança e contratos de API** descritos neste documento.

---

## 3. Visão do produto (telas mínimas)

### 3.1 Login admin — `/admin/login`

- Tela isolada (sem menu de loja/parceiro).
- Coleta identificador do admin (no IndicaAí: WhatsApp 11 dígitos).
- Valida se o identificador está na **allowlist** (`ADMIN_WHATSAPP_ALLOWLIST` ou equivalente).
- Envia OTP (ou credencial) e, ao confirmar, cria sessão `{ tipo: "admin", id, nome }`.
- Redireciona para `/admin/dashboard`.
- Se já logado como admin, `/admin/login` redireciona para o dashboard.

### 3.2 Dashboard — `/admin/dashboard` (recomendado)

- Métricas agregadas: lojas ativas, receita no período, ticket médio, taxa de plano ativo.
- Filtro **De / Até** (datas em BRT).
- Opcional no ERP destino; **não substitui** a listagem de lojas.

### 3.3 Listagem de lojas — `/admin/lojas`

- Tabela/cards com **todas** as lojas cadastradas.
- Colunas mínimas:
  - Nome
  - Contato (WhatsApp/telefone)
  - **Status operacional** (`ativo` / `inativo` — pausada pelo admin)
  - **Status de pagamento** (`trial`, `ativo`, `pendente`, `inadimplente`)
  - Trial até / próximo vencimento (quando aplicável)
  - Contadores úteis (campanhas, parceiros — adaptar ao ERP)
- **Busca** por nome (sem acento) ou dígitos do telefone.
- Ação **Pausar / Ativar** na linha (toggle).
- Clique na linha → detalhe `/admin/lojas/{id}`.

### 3.4 Detalhe da loja — `/admin/lojas/{id}`

- Dados cadastrais: nome, categoria, responsável, logo, WhatsApp.
- Resumo de billing: status, trial, próximo vencimento, último pagamento.
- Lista de campanhas/atividades vinculadas (adaptar ao domínio do ERP).
- **Seção “Pagamentos do plano”**: histórico em `billing_payments` (data, valor, status `pago`/`reembolsado`, IDs do gateway, valor sugerido de estorno se houver política).
- Botão **Pausar / Ativar loja** (mesma regra da listagem).

### 3.5 Configurações — `/admin/configuracoes`

- **Valor do plano** (em reais → persistir em centavos no banco).
- **Contato de suporte** (WhatsApp exibido para lojas).
- Integrações do admin (no IndicaAí: instância Evolution + QR; no outro ERP: o que existir).
- Ao salvar novo valor do plano:
  1. `UPSERT` em `system_settings` chave `billing`;
  2. opcional: notificar lojas afetadas;
  3. novas cobranças usam o valor atualizado.

### 3.6 Layout admin

- Menu lateral (desktop) + navegação inferior (mobile).
- Rotas `/admin/*` protegidas por `RequireRole` / guard equivalente (`tipo === "admin"`).
- Logout encerra Realtime e limpa sessão.

---

## 4. Dois eixos de status (regra central)

### 4.1 Status operacional da loja — `lojas.status`

| Valor | Significado | Efeito |
| --- | --- | --- |
| `ativo` | Loja liberada pelo admin | Login da loja permitido |
| `inativo` | Loja **pausada pelo admin** | Login da loja **bloqueado**; campanhas ativas → `pausado` (sem marcar `pausado_por_billing`) |

**Importante:** uma loja pode ter **pagamento ativo** (`billing_status = ativo`) e ainda assim estar **pausada** (`status = inativo`) pelo admin. São controles **independentes**.

### 4.2 Status de pagamento — `lojas.billing_status`

| Valor | Significado |
| --- | --- |
| `trial` | Período gratuito inicial (ex.: 7 dias após cadastro) |
| `ativo` | Plano em dia após pagamento confirmado |
| `pendente` | Trial expirou ou plano suspenso sem pagamento |
| `inadimplente` | Pagamento em atraso (após cron/lembrete) |

Regras típicas (replicar no ERP):

1. **Cadastro** → `billing_status = trial`, `trial_ends_at = created_at + 7 dias`.
2. **Trial sem pagamento** → `pendente`; pausar campanhas com `pausado_por_billing = true`.
3. **Webhook de pagamento confirmado** → `ativo`, atualizar `next_billing_at`, inserir linha em `billing_payments`, reativar campanhas pausadas **somente** por billing.
4. **Reembolso confirmado** → marcar pagamento `reembolsado`, suspender plano (`pendente`), pausar campanhas por billing.

### 4.3 Pausar loja (admin) — efeitos colaterais

```text
Pausar (status → inativo):
  - UPDATE lojas SET status = 'inativo'
  - Campanhas com status 'ativo' → 'pausado', pausado_por_billing = false

Reativar (status → ativo):
  - UPDATE lojas SET status = 'ativo'
  - Campanhas 'pausado' onde pausado_por_billing = false e prazo não encerrado → 'ativo'
  - NÃO reativar campanhas pausadas por billing automaticamente
```

---

## 5. Modelo de dados (Supabase)

Schema dedicado recomendado (ex.: `indicaai` ou `erp`). Todas as migrations em SQL versionadas.

### 5.1 Tabela `lojas` (campos de billing)

```sql
-- Colunas essenciais (além dos dados cadastrais)
status              text NOT NULL DEFAULT 'ativo',  -- ativo | inativo
billing_status      text NOT NULL DEFAULT 'trial', -- trial | ativo | pendente | inadimplente
trial_ends_at       timestamptz,
next_billing_at     timestamptz,
billing_period_ends_at timestamptz,
last_payment_at     timestamptz,
auth_user_id        uuid,  -- vínculo Supabase Auth da loja
```

### 5.2 Tabela `billing_payments`

```sql
id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
loja_id               uuid NOT NULL REFERENCES lojas(id),
paid_at               timestamptz NOT NULL,
value_cents           integer NOT NULL,
correlation_id        text,          -- ID cobrança no gateway
end_to_end_id         text,          -- PIX end-to-end
woovi_event_key       text UNIQUE,   -- idempotência webhook
status                text NOT NULL DEFAULT 'pago',  -- pago | reembolsado
refunded_at           timestamptz,
refund_value_cents    integer,
refund_woovi_event_key text UNIQUE,
refund_type           text,          -- total | parcial
days_used_at_refund   integer,
suggested_refund_cents integer,
created_at            timestamptz DEFAULT now()
```

### 5.3 Tabela `system_settings`

```sql
key         text PRIMARY KEY,
value       jsonb NOT NULL,
updated_at  timestamptz NOT NULL DEFAULT now()
```

Chaves mínimas:

| `key` | `value` (exemplo) |
| --- | --- |
| `billing` | `{ "plan_value_cents": 3990 }` |
| `admin` | `{ "contact_whatsapp": "5571999999999" }` |
| `evolution` | `{ "instance_name": "...", "connection_state": "open" }` |

**Valor do plano:** sempre em **centavos** (`3990` = R$ 39,90). UI converte reais ↔ centavos.

### 5.4 Tabela `campanhas` (se existir no ERP)

```sql
pausado_por_billing boolean NOT NULL DEFAULT false
```

Diferencia pausa manual (admin) de pausa automática (billing).

### 5.5 Realtime

Habilitar publicação Supabase Realtime nas tabelas que a UI espelha:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE schema.lojas;
ALTER PUBLICATION supabase_realtime ADD TABLE schema.billing_payments;
ALTER PUBLICATION supabase_realtime ADD TABLE schema.system_settings;
-- demais tabelas do painel (campanhas, parceiros, etc.)
```

No cliente: canal único escutando `INSERT | UPDATE | DELETE` e atualizando estado local + re-render.

---

## 6. Autenticação e segurança do admin

### 6.1 Allowlist (obrigatório)

Variável de ambiente no servidor (nunca no cliente):

```env
ADMIN_WHATSAPP_ALLOWLIST=5571996755745,5571988887777
```

- Lista separada por vírgula, apenas dígitos (11 para BR).
- Toda server function admin chama `assertAdminWhatsappAllowed(adminWhatsapp)` no início.
- Frontend envia `adminWhatsapp` da sessão; **confiança zero** — servidor revalida sempre.

### 6.2 Fluxo de login (referência IndicaAí)

1. `checkAdminWhatsappAllowed` — POST, retorna `{ allowed: boolean }`.
2. `requestAdminLoginOtp` — gera OTP 6 dígitos, persiste com propósito `admin_login`, envia WhatsApp.
3. `confirmAdminLoginOtp` — valida OTP, retorna `{ sessao: { tipo: "admin", id: whatsapp, nome: "Administração" } }`.
4. Cliente grava em `localStorage` chave `sessao` e redireciona.

**Alternativas no outro ERP:** e-mail/senha com tabela `admin_users` + hash bcrypt; o importante é **allowlist ou role explícita** e **sessão separada** do usuário loja.

### 6.3 Acesso ao banco

- Operações admin usam **service role** (`SUPABASE_SERVICE_ROLE_KEY`) apenas no servidor.
- Cliente browser usa anon key + Realtime read; **escritas admin só via server functions**.
- RLS nas tabelas de loja: loja só vê seus dados; admin bypass via service role no backend.

### 6.4 Proteção de rotas

- Guard em `/admin/*` (exceto `/admin/login`): exige `sessao.tipo === "admin"`.
- Server functions: Zod nos inputs (`adminWhatsapp` regex `^\d{11}$`, UUIDs, valores positivos).
- Secrets de gateway (Woovi, Evolution) **somente** env do Worker/servidor.

---

## 7. Contratos de API (server functions)

Implementar endpoints equivalentes (TanStack Start `createServerFn`, tRPC, REST — adaptar):

| Função | Entrada | Saída / efeito |
| --- | --- | --- |
| `checkAdminWhatsappAllowed` | `{ whatsapp }` | `{ allowed }` |
| `requestAdminLoginOtp` | `{ whatsapp }` | `{ ok, message }` |
| `confirmAdminLoginOtp` | `{ whatsapp, code }` | `{ sessao }` |
| `listarLojasAdmin` | `{ adminWhatsapp }` | `AdminLojaListItem[]` |
| `obterLojaAdmin` | `{ adminWhatsapp, lojaId }` | `AdminLojaDetalhe` |
| `setLojaPausadaAdmin` | `{ adminWhatsapp, lojaId, pausada }` | `void` |
| `listarPagamentosPlanoAdmin` | `{ adminWhatsapp, lojaId }` | `BillingPaymentListItem[]` |
| `getAdminSettings` | `{ adminWhatsapp }` | plano, contato, integrações |
| `saveAdminBillingPlan` | `{ adminWhatsapp, planValueReais }` | atualiza `system_settings`, notifica lojas |
| `getAdminDashboard` | `{ adminWhatsapp, from, to }` | métricas do período |

Todas validam allowlist antes de qualquer query.

---

## 8. Fluxo: alterar valor do plano

1. Admin abre `/admin/configuracoes`.
2. Altera campo “Valor do plano (R$/mês)” e salva.
3. Servidor:
   - `newCents = Math.round(planValueReais * 100)`
   - `UPSERT system_settings SET value = { plan_value_cents: newCents } WHERE key = 'billing'`
   - Se valor mudou: opcional `notifyLojasPlanoAlterado(old, new)` via WhatsApp.
4. Próximas cobranças PIX usam `getBillingSettings().plan_value_cents`.
5. Realtime em `system_settings` (se UI loja escuta) ou refetch ao abrir `/loja/plano`.
6. **Não alterar retroativamente** pagamentos já registrados em `billing_payments`.

---

## 9. Fluxo: consultar pagamentos de uma loja

1. Admin abre `/admin/lojas/{id}`.
2. Componente carrega `listarPagamentosPlanoAdmin`.
3. Servidor:
   - `SELECT * FROM billing_payments WHERE loja_id = ? ORDER BY paid_at DESC`
   - Fallback legado: se só existir `lojas.last_payment_at`, exibir entrada sintética.
4. UI exibe: data, valor, status, IDs, valor sugerido de estorno (se política existir).
5. Estorno é feito no **painel do gateway**; webhook de reembolso atualiza banco automaticamente.

---

## 10. Realtime — comportamento esperado

1. Ao hidratar app autenticado (loja/parceiro), iniciar canal Supabase.
2. Em mudança em `lojas`, `billing_payments`, `system_settings`:
   - atualizar cache local (localStorage / React Query);
   - disparar evento para componentes re-renderizarem.
3. No painel **admin**, pode usar **refetch após ações** + Realtime opcional na listagem.
4. Ao logout admin, **parar** canal Realtime (`stopIndicaaiRealtime`).

Objetivo: admin altera preço → banco atualizado → lojas veem valor novo **sem F5** (ou no próximo fetch automático).

---

## 11. Preparação do ambiente (checklist deploy)

### 11.1 Variáveis de ambiente (servidor)

```env
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Admin
ADMIN_WHATSAPP_ALLOWLIST=5571999999999

# Billing (adaptar gateway)
WOOVI_APP_ID=
WOOVI_WEBHOOK_AUTHORIZATION=
BILLING_CRON_SECRET=
PUBLIC_APP_URL=https://seu-dominio.com

# WhatsApp OTP (se usar Evolution)
EVOLUTION_API_URL=
EVOLUTION_API_KEY=
EVOLUTION_INSTANCE=notificacao-whats
```

### 11.2 Migrations

Aplicar em ordem (adaptar nomes):

1. Colunas de billing em `lojas` + `pausado_por_billing` em campanhas.
2. Tabela `billing_payments`.
3. Tabela `system_settings` + seed inicial:

```sql
INSERT INTO system_settings (key, value) VALUES
  ('billing', '{"plan_value_cents": 3990}'),
  ('admin', '{"contact_whatsapp": ""}')
ON CONFLICT (key) DO NOTHING;
```

4. Realtime publication nas tabelas necessárias.

### 11.3 Conta admin pronta

1. Definir WhatsApp(s) na `ADMIN_WHATSAPP_ALLOWLIST`.
2. Garantir Evolution (ou provedor OTP) configurado **antes** do primeiro login.
3. Acessar `/admin/login`, solicitar código, confirmar.
4. Verificar redirecionamento para `/admin/dashboard` ou `/admin/lojas`.
5. Testar: listar loja → ver billing → pausar/ativar → alterar valor do plano → confirmar no Supabase.

---

## 12. Checklist de implementação para o agente

Use como ordem de trabalho no **outro ERP**:

- [ ] **1. Schema** — `lojas` (status + billing), `billing_payments`, `system_settings`, migrations + seed.
- [ ] **2. Realtime** — publication + cliente escutando tabelas críticas.
- [ ] **3. Auth admin** — allowlist, login dedicado, sessão `tipo: admin`, guard de rotas.
- [ ] **4. Server layer** — service role, `assertAdmin*`, Zod nos inputs, sem secrets no client.
- [ ] **5. `/admin/login`** — UI + OTP/credencial.
- [ ] **6. `/admin/lojas`** — listagem, busca, badge billing, toggle pausar/ativar.
- [ ] **7. `/admin/lojas/{id}`** — detalhe + histórico pagamentos + pausar/ativar.
- [ ] **8. `/admin/configuracoes`** — valor plano, contato suporte, integrações.
- [ ] **9. Billing integrado** — webhook confirma pagamento; cron opcional para inadimplência.
- [ ] **10. Testes manuais** — loja ativa com plano pendente; loja pausada com plano ativo; mudança de preço refletida em nova cobrança.
- [ ] **11. Documentação** — atualizar README/CHANGELOG do projeto destino.

---

## 13. Referência de arquivos no IndicaAí

Copiar **padrões**, não necessariamente os arquivos inteiros:

| Área | Caminhos |
| --- | --- |
| Rotas admin | `src/routes/admin.login.tsx`, `admin.lojas.index.tsx`, `admin.lojas.$lojaId.tsx`, `admin.configuracoes.tsx`, `admin.dashboard.tsx` |
| Layout | `src/components/admin/AdminLayout.tsx`, `AdminLojasTable.tsx`, `AdminLojaBillingPayments.tsx` |
| Server admin | `src/lib/admin/admin.server.ts`, `system-settings.server.ts`, `allowlist.server.ts`, `metrics.server.ts` |
| API | `src/lib/api/admin.functions.ts` |
| Billing | `src/lib/billing/billing.server.ts`, `payments.server.ts`, `state.ts`, `constants.ts` |
| Realtime | `src/lib/supabase/realtime.ts`, `src/components/IndicaaiRealtime.tsx` |
| Auth sessão | `src/lib/auth/client-session.ts`, `src/components/RequireRole.tsx` |
| Docs internas | `docs/ADMIN.md`, `docs/BILLING.md`, `docs/AUTENTICACAO.md`, `docs/SUPABASE.md` |

---

## 14. Critérios de aceite (definição de pronto)

1. Admin consegue **logar** apenas com identificador autorizado.
2. Admin vê **100% das lojas** cadastradas com status operacional e de pagamento.
3. Admin **pausa e reativa** loja; login da loja respeita `status`.
4. Admin abre detalhe e vê **histórico de pagamentos** coerente com o banco.
5. Admin altera **valor do plano** em configurações; valor persiste em `system_settings` e novas cobranças usam o novo preço.
6. Nenhuma operação admin funciona sem validação server-side da allowlist.
7. Dados sensíveis (service role, gateway keys) **não** aparecem no bundle do cliente.
8. Mudanças relevantes no Supabase refletem na UI via Realtime ou refetch documentado.

---

## 15. Diagrama de fluxo (resumo)

```mermaid
flowchart TB
  subgraph auth [Autenticação]
    A[/admin/login] --> B{Allowlist?}
    B -->|não| C[Erro]
    B -->|sim| D[OTP / credencial]
    D --> E[Sessão tipo admin]
  end

  subgraph painel [Painel]
    E --> F[/admin/lojas]
    F --> G[/admin/lojas/id]
    F --> H[Pausar/Ativar status]
    G --> I[Histórico billing_payments]
    E --> J[/admin/configuracoes]
    J --> K[UPSERT system_settings billing]
  end

  subgraph db [Supabase]
    H --> L[(lojas.status)]
    K --> M[(system_settings)]
    I --> N[(billing_payments)]
    L --> O[Realtime]
    M --> O
    N --> O
  end
```

---

*Última atualização: 2026-06-06 — baseado no módulo admin do IndicaAí (commit com QR, billing Woovi e painel `/admin/lojas`).*
