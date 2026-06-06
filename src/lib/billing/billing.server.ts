import { getSupabaseServer } from "@/integrations/supabase/server";
import { getBillingPlanValueCents } from "@/lib/admin/system-settings.server";
import { REMINDER_DAYS } from "./constants";
import { formatDatePt, nextBillingAfterPayment } from "./dates";
import { fetchEmpresaBilling, updateEmpresaBilling } from "./empresa.server";
import { sendBillingNotification } from "./notifications.server";
import { marcarPagamentoReembolsado, registrarPagamentoPlano } from "./payments.server";
import { getBillingUiState } from "./state";
import type { EmpresaBillingRow } from "./types";
import { createWooviPlanCharge } from "./woovi/charge.server";
import { extractRefundMetaFromWebhook, fetchWooviChargeMeta } from "./woovi/charge-lookup.server";
import { isWooviConfigured } from "./woovi/client.server";
import { mensagemErroPixParaEmpresa } from "./woovi/errors";
import { parseEmpresaIdFromCorrelation } from "./woovi/charge.server";

async function insertBillingEvent(
  eventKey: string,
  empresaId: string | null,
  eventType: string,
  payload: unknown,
  env?: Record<string, string | undefined>,
): Promise<boolean> {
  const sb = getSupabaseServer(env);
  const { error } = await sb.from("billing_events").insert({
    event_key: eventKey,
    empresa_id: empresaId,
    event_type: eventType,
    payload,
  });
  if (error) {
    if (error.message.includes("duplicate") || error.code === "23505") return false;
    throw new Error(error.message);
  }
  return true;
}

export async function aplicarPagamentoEmpresa(
  empresaId: string,
  paidAt: string,
  meta: {
    eventKey: string;
    correlationId?: string | null;
    endToEndId?: string | null;
    valueCents?: number | null;
    payload?: unknown;
    env?: Record<string, string | undefined>;
  },
): Promise<void> {
  const env = meta.env;
  const isNew = await insertBillingEvent(meta.eventKey, empresaId, "payment", meta.payload ?? {}, env);
  if (!isNew) return;

  const empresa = await fetchEmpresaBilling(empresaId, env);
  const dueAt = empresa.billing_status === "trial" ? empresa.trial_ends_at : empresa.next_billing_at;
  const nextBilling = nextBillingAfterPayment(paidAt, dueAt);
  const periodEnd = nextBilling;

  let endToEndId = meta.endToEndId ?? null;
  if (!endToEndId && meta.correlationId) {
    const lookup = await fetchWooviChargeMeta(meta.correlationId, env);
    endToEndId = lookup.endToEndId;
  }

  await updateEmpresaBilling(
    empresaId,
    {
      billing_status: "ativo",
      last_payment_at: paidAt,
      next_billing_at: nextBilling,
      billing_period_ends_at: periodEnd,
      woovi_charge_correlation_id: null,
      woovi_payment_link_url: null,
    },
    env,
  );

  const defaultCents = await getBillingPlanValueCents(env);
  await registrarPagamentoPlano({
    empresaId,
    paidAt,
    valueCents: meta.valueCents ?? defaultCents,
    correlationId: meta.correlationId ?? null,
    endToEndId,
    wooviEventKey: meta.eventKey,
    env,
  });

  await sendBillingNotification({
    empresaId,
    empresaNome: empresa.nome,
    telefone: empresa.telefone,
    kind: "payment_confirmed",
    nextBillingAt: nextBilling,
  });
}

export async function suspenderPlanoAposReembolso(
  empresaId: string,
  env?: Record<string, string | undefined>,
): Promise<void> {
  await updateEmpresaBilling(
    empresaId,
    {
      billing_status: "pendente",
      billing_period_ends_at: new Date().toISOString(),
      woovi_charge_correlation_id: null,
      woovi_payment_link_url: null,
    },
    env,
  );

  const empresa = await fetchEmpresaBilling(empresaId, env);
  await sendBillingNotification({
    empresaId,
    empresaNome: empresa.nome,
    telefone: empresa.telefone,
    kind: "payment_pending",
  });
}

export async function ensureWooviChargeForEmpresa(
  empresa: EmpresaBillingRow,
  env?: Record<string, string | undefined>,
): Promise<{ paymentLinkUrl: string; correlationID: string }> {
  if (empresa.woovi_payment_link_url && empresa.woovi_charge_correlation_id) {
    return {
      paymentLinkUrl: empresa.woovi_payment_link_url,
      correlationID: empresa.woovi_charge_correlation_id,
    };
  }

  const charge = await createWooviPlanCharge({
    empresaId: empresa.id,
    empresaNome: empresa.nome,
    telefone: empresa.telefone,
    env,
  });

  await updateEmpresaBilling(
    empresa.id,
    {
      woovi_charge_correlation_id: charge.correlationID,
      woovi_payment_link_url: charge.paymentLinkUrl,
    },
    env,
  );

  return charge;
}

export async function gerarPixPlano(empresaId: string, env?: Record<string, string | undefined>) {
  if (!isWooviConfigured(env)) {
    throw new Error("Pagamento PIX não configurado no servidor.");
  }
  try {
    const empresa = await fetchEmpresaBilling(empresaId, env);
    const charge = await ensureWooviChargeForEmpresa(empresa, env);
    return { paymentLinkUrl: charge.paymentLinkUrl, correlationID: charge.correlationID };
  } catch (err) {
    throw new Error(mensagemErroPixParaEmpresa(err));
  }
}

async function maybeSendReminder(
  empresa: EmpresaBillingRow,
  daysUntilDue: number,
  env?: Record<string, string | undefined>,
): Promise<void> {
  if (!REMINDER_DAYS.includes(daysUntilDue as (typeof REMINDER_DAYS)[number])) return;

  const dueKey =
    empresa.billing_status === "trial"
      ? `trial-${formatDatePt(empresa.trial_ends_at)}`
      : `renewal-${formatDatePt(empresa.next_billing_at)}`;
  const reminderKey = `${dueKey}-d${daysUntilDue}`;

  const sb = getSupabaseServer(env);
  const { error: logErr } = await sb.from("billing_reminder_log").insert({
    empresa_id: empresa.id,
    reminder_key: reminderKey,
    channel: "whatsapp_stub",
  });
  if (logErr) {
    if (logErr.message.includes("duplicate") || logErr.code === "23505") return;
    throw new Error(logErr.message);
  }

  await sendBillingNotification({
    empresaId: empresa.id,
    empresaNome: empresa.nome,
    telefone: empresa.telefone,
    kind: empresa.billing_status === "trial" ? "trial_reminder" : "renewal_reminder",
    daysUntilDue,
    nextBillingAt: empresa.next_billing_at ?? empresa.trial_ends_at,
    paymentLinkUrl: empresa.woovi_payment_link_url,
  });
}

export async function runBillingDailyJob(env?: Record<string, string | undefined>): Promise<{
  processed: number;
  errors: string[];
}> {
  const sb = getSupabaseServer(env);
  const { data: empresas, error } = await sb
    .from("empresas")
    .select(
      "id, nome, telefone, billing_status, trial_ends_at, next_billing_at, billing_period_ends_at, woovi_charge_correlation_id, woovi_payment_link_url",
    );

  if (error) throw new Error(error.message);

  const errors: string[] = [];
  let processed = 0;
  const now = new Date().toISOString();

  for (const row of empresas ?? []) {
    try {
      const empresa = row as EmpresaBillingRow;
      const state = getBillingUiState(empresa, now);
      processed++;

      await maybeSendReminder(empresa, state.daysUntilDue, env);

      const expiredTrial =
        empresa.billing_status === "trial" && state.daysUntilDue < 0;
      const expiredPlan =
        empresa.billing_status === "ativo" && state.daysUntilDue < 0 && !state.isPaidAndCurrent;

      if (expiredTrial || expiredPlan) {
        await updateEmpresaBilling(
          empresa.id,
          { billing_status: "pendente" },
          env,
        );
        await sendBillingNotification({
          empresaId: empresa.id,
          empresaNome: empresa.nome,
          telefone: empresa.telefone,
          kind: "payment_pending",
        });
      }

      const refreshed = await fetchEmpresaBilling(empresa.id, env);
      const refreshedState = getBillingUiState(refreshed, now);
      if (refreshedState.needsPayment && isWooviConfigured(env)) {
        await ensureWooviChargeForEmpresa(refreshed, env);
      }
    } catch (e) {
      errors.push(`${row.id}: ${(e as Error).message}`);
    }
  }

  return { processed, errors };
}

export async function processWooviWebhookPayload(
  payload: Record<string, unknown>,
  env?: Record<string, string | undefined>,
): Promise<{ ok: boolean; test?: boolean; skipped?: boolean }> {
  if (payload.evento === "teste_webhook") {
    return { ok: true, test: true };
  }

  const event = typeof payload.event === "string" ? payload.event : null;

  if (event === "OPENPIX:CHARGE_COMPLETED" || event === "PIX_AUTOMATIC_COBR_COMPLETED") {
    const charge = payload.charge as Record<string, unknown> | undefined;
    const correlationID = typeof charge?.correlationID === "string" ? charge.correlationID : null;
    if (!correlationID) return { ok: true, skipped: true };

    const empresaId = parseEmpresaIdFromCorrelation(correlationID);
    if (!empresaId) return { ok: true, skipped: true };

    const paidAt =
      typeof charge?.paidAt === "string" ? charge.paidAt : new Date().toISOString();
    const pix = charge?.pix as Record<string, unknown> | undefined;
    const endToEndId = typeof pix?.endToEndId === "string" ? pix.endToEndId : null;
    const valueCents = typeof charge?.value === "number" ? charge.value : null;
    const eventKey = `woovi:${event}:${correlationID}`;

    await aplicarPagamentoEmpresa(empresaId, paidAt, {
      eventKey,
      correlationId: correlationID,
      endToEndId,
      valueCents,
      payload,
      env,
    });
    return { ok: true };
  }

  if (event === "PIX_TRANSACTION_REFUND_SENT_CONFIRMED") {
    const meta = extractRefundMetaFromWebhook(payload);
    if (!meta.endToEndId) return { ok: true, skipped: true };

    const refundEventKey = `woovi:${event}:${meta.endToEndId}`;
    const isNew = await insertBillingEvent(refundEventKey, null, "refund", payload, env);
    if (!isNew) return { ok: true, skipped: true };

    const { empresaId } = await marcarPagamentoReembolsado({
      endToEndId: meta.endToEndId,
      refundEventKey,
      refundValueCents: meta.refundValueCents,
      env,
    });

    if (empresaId) await suspenderPlanoAposReembolso(empresaId, env);
    return { ok: true };
  }

  return { ok: true, skipped: true };
}
