import { APP_NAME } from "@/lib/app-brand";
import { formatDatePt } from "./dates";

export type BillingNotificationKind =
  | "trial_reminder"
  | "renewal_reminder"
  | "payment_confirmed"
  | "payment_pending";

export type BillingNotificationPayload = {
  empresaId: string;
  empresaNome: string;
  telefone?: string | null;
  kind: BillingNotificationKind;
  daysUntilDue?: number;
  nextBillingAt?: string | null;
  paymentLinkUrl?: string | null;
};

function buildMessage(payload: BillingNotificationPayload): string {
  const next = payload.nextBillingAt ? formatDatePt(payload.nextBillingAt) : "—";
  switch (payload.kind) {
    case "trial_reminder":
      return `[${APP_NAME}] Seu trial termina em ${payload.daysUntilDue} dia(s). Acesse /plano para pagar via PIX.`;
    case "renewal_reminder":
      return `[${APP_NAME}] Renovação do plano em ${payload.daysUntilDue} dia(s) (${next}). Pague antecipado em /plano.`;
    case "payment_confirmed":
      return `[${APP_NAME}] Pagamento confirmado! Próxima cobrança: ${next}.`;
    case "payment_pending":
      return `[${APP_NAME}] Pagamento pendente. Gere o PIX em /plano para continuar usando o sistema.`;
    default:
      return `[${APP_NAME}] Atualização de plano.`;
  }
}

/** Stub: loga no servidor; conectar WhatsApp/API depois. */
export async function sendBillingNotification(payload: BillingNotificationPayload): Promise<void> {
  const message = buildMessage(payload);
  console.info("[billing-notification]", {
    channel: "whatsapp_stub",
    to: payload.telefone ?? null,
    kind: payload.kind,
    empresaId: payload.empresaId,
    message,
    paymentLinkUrl: payload.paymentLinkUrl ?? null,
  });
}
