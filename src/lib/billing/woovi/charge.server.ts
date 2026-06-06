import { getBillingPlanValueCents } from "@/lib/admin/system-settings.server";
import { CHARGE_EXPIRES_SECONDS } from "../constants";
import { wooviFetch } from "./client.server";
import { normalizePhoneBr11, wooviChargeComment, wooviCustomerName } from "./sanitize-text";

const CORRELATION_RE = /^app-empresa-([0-9a-f-]{36})-/i;

export function buildChargeCorrelationId(empresaId: string): string {
  return `app-empresa-${empresaId}-${Date.now()}`;
}

export function parseEmpresaIdFromCorrelation(correlationID: string): string | null {
  const m = CORRELATION_RE.exec(correlationID);
  return m?.[1] ?? null;
}

type WooviChargeResponse = {
  charge?: {
    correlationID?: string;
    paymentLinkUrl?: string;
    brCode?: string;
    status?: string;
  };
};

export async function createWooviPlanCharge(input: {
  empresaId: string;
  empresaNome: string;
  telefone?: string | null;
  env?: Record<string, string | undefined>;
}): Promise<{ correlationID: string; paymentLinkUrl: string; brCode?: string }> {
  const correlationID = buildChargeCorrelationId(input.empresaId);
  const phone = normalizePhoneBr11(input.telefone) ?? "5500000000000";
  const planValueCents = await getBillingPlanValueCents(input.env);
  const planLabel = (planValueCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  const comment = wooviChargeComment(`Freela OS - Plano mensal ${planLabel}/mês`);

  const payload = {
    correlationID,
    value: planValueCents,
    comment,
    expiresIn: CHARGE_EXPIRES_SECONDS,
    customer: {
      name: wooviCustomerName(input.empresaNome || "Empresa"),
      phone,
    },
  };

  const data = await wooviFetch<WooviChargeResponse>("/charge", {
    method: "POST",
    body: JSON.stringify(payload),
  }, input.env);

  const charge = data.charge;
  if (!charge?.paymentLinkUrl || !charge.correlationID) {
    throw new Error("Resposta inválida ao criar cobrança PIX.");
  }

  return {
    correlationID: charge.correlationID,
    paymentLinkUrl: charge.paymentLinkUrl,
    brCode: charge.brCode,
  };
}
