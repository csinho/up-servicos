import { getSupabaseServer } from "@/integrations/supabase/server";
import { PLAN_VALUE_CENTS } from "./constants";
import { fetchWooviChargeMeta } from "./woovi/charge-lookup.server";
import { fetchWooviReceiptPdf } from "./woovi/receipt.server";
import type { BillingPaymentListItem } from "./types";

export async function registrarPagamentoPlano(input: {
  empresaId: string;
  paidAt: string;
  valueCents?: number;
  correlationId?: string | null;
  endToEndId?: string | null;
  wooviTransactionId?: string | null;
  wooviEventKey: string;
  env?: Record<string, string | undefined>;
}): Promise<void> {
  const sb = getSupabaseServer(input.env);
  const { error } = await sb.from("billing_payments").insert({
    empresa_id: input.empresaId,
    paid_at: input.paidAt,
    value_cents: input.valueCents ?? PLAN_VALUE_CENTS,
    correlation_id: input.correlationId ?? null,
    end_to_end_id: input.endToEndId ?? null,
    woovi_transaction_id: input.wooviTransactionId ?? null,
    woovi_event_key: input.wooviEventKey,
    status: "pago",
  });
  if (error && !error.message.includes("duplicate")) {
    throw new Error(error.message);
  }
}

export async function listarPagamentosPlano(input: {
  empresaId: string;
  dateFrom?: string;
  dateTo?: string;
  env?: Record<string, string | undefined>;
}): Promise<BillingPaymentListItem[]> {
  const sb = getSupabaseServer(input.env);
  let q = sb
    .from("billing_payments")
    .select("id, paid_at, value_cents, status, correlation_id, end_to_end_id, refund_type, suggested_refund_cents")
    .eq("empresa_id", input.empresaId)
    .order("paid_at", { ascending: false });

  if (input.dateFrom) q = q.gte("paid_at", input.dateFrom);
  if (input.dateTo) q = q.lte("paid_at", input.dateTo);

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => ({
    id: r.id,
    paidAt: r.paid_at,
    valueCents: r.value_cents,
    status: r.status as "pago" | "reembolsado",
    correlationId: r.correlation_id,
    endToEndId: r.end_to_end_id,
    refundType: r.refund_type,
    suggestedRefundCents: r.suggested_refund_cents,
  }));
}

export async function marcarPagamentoReembolsado(input: {
  endToEndId: string;
  refundEventKey: string;
  refundValueCents?: number | null;
  env?: Record<string, string | undefined>;
}): Promise<{ empresaId: string | null; paymentId: string | null }> {
  const sb = getSupabaseServer(input.env);
  const { data: payment, error } = await sb
    .from("billing_payments")
    .select("id, empresa_id, paid_at, value_cents")
    .eq("end_to_end_id", input.endToEndId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!payment) return { empresaId: null, paymentId: null };

  const { getRefundQuote } = await import("./refund-policy");
  const quote = getRefundQuote(payment.paid_at, payment.value_cents);

  const { error: upErr } = await sb
    .from("billing_payments")
    .update({
      status: "reembolsado",
      refunded_at: new Date().toISOString(),
      refund_value_cents: input.refundValueCents ?? quote.suggestedRefundCents,
      refund_woovi_event_key: input.refundEventKey,
      refund_type: quote.refundType,
      days_used_at_refund: quote.daysUsed,
      suggested_refund_cents: quote.suggestedRefundCents,
    })
    .eq("id", payment.id);

  if (upErr) throw new Error(upErr.message);
  return { empresaId: payment.empresa_id, paymentId: payment.id };
}

export async function baixarReciboPagamento(input: {
  empresaId: string;
  paymentId: string;
  env?: Record<string, string | undefined>;
}): Promise<{ filename: string; base64: string }> {
  const sb = getSupabaseServer(input.env);
  const { data: payment, error } = await sb
    .from("billing_payments")
    .select("id, end_to_end_id, correlation_id, paid_at")
    .eq("id", input.paymentId)
    .eq("empresa_id", input.empresaId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!payment) throw new Error("Pagamento não encontrado.");

  let endToEndId = payment.end_to_end_id as string | null;
  if (!endToEndId && payment.correlation_id) {
    const meta = await fetchWooviChargeMeta(payment.correlation_id, input.env);
    endToEndId = meta.endToEndId;
    if (endToEndId) {
      await sb.from("billing_payments").update({ end_to_end_id: endToEndId }).eq("id", payment.id);
    }
  }

  if (!endToEndId) {
    throw new Error("Comprovante indisponível para este pagamento.");
  }

  const pdf = await fetchWooviReceiptPdf(endToEndId, input.env);
  const bytes = new Uint8Array(pdf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  const base64 = btoa(binary);
  const date = (payment.paid_at as string).slice(0, 10);
  return { filename: `recibo-up-servicos-${date}.pdf`, base64 };
}
