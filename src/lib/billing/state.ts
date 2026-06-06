import { PIX_BUTTON_VISIBLE_DAYS, PLAN_LABEL, PLAN_VALUE_CENTS, TRIAL_DAYS } from "./constants";
import { calendarDaysUntil } from "./dates";
import type { BillingStatus, BillingUiState, EmpresaBillingRow } from "./types";

export type PlanSettings = {
  planLabel?: string;
  planValueCents?: number;
  trialDays?: number;
};

export function empresaBlocksMutation(empresa: EmpresaBillingRow): boolean {
  return (empresa.status ?? "ativo") === "inativo";
}

function resolveDueAt(empresa: EmpresaBillingRow): string | null {
  if (empresa.billing_status === "trial") {
    return empresa.trial_ends_at ?? empresa.next_billing_at ?? null;
  }
  return empresa.next_billing_at ?? empresa.billing_period_ends_at ?? null;
}

export function getBillingUiState(
  empresa: EmpresaBillingRow,
  now = new Date().toISOString(),
  plan?: PlanSettings,
): BillingUiState {
  const billingStatus = (empresa.billing_status ?? "trial") as BillingStatus;
  const dueAt = resolveDueAt(empresa);
  const daysUntilDue = dueAt ? calendarDaysUntil(dueAt, now) : 0;

  const periodEnd = empresa.billing_period_ends_at ?? empresa.next_billing_at;
  const isPaidAndCurrent =
    billingStatus === "ativo" && !!periodEnd && calendarDaysUntil(periodEnd, now) >= 0;

  const needsPayment =
    !isPaidAndCurrent &&
    (billingStatus === "pendente" ||
      billingStatus === "inadimplente" ||
      (dueAt !== null && calendarDaysUntil(dueAt, now) < 0));

  const phase: BillingUiState["phase"] =
    billingStatus === "trial" ? "trial" : isPaidAndCurrent ? "ativo" : "pendente";

  const showPixPaymentButton =
    !isPaidAndCurrent && (needsPayment || daysUntilDue <= PIX_BUTTON_VISIBLE_DAYS);

  return {
    phase,
    isPaused: empresaBlocksMutation(empresa),
    billingStatus,
    trialEndsAt: empresa.trial_ends_at ?? null,
    nextBillingAt: empresa.next_billing_at ?? null,
    billingPeriodEndsAt: empresa.billing_period_ends_at ?? null,
    daysUntilDue,
    isPaidAndCurrent,
    needsPayment,
    showTrialBanner: billingStatus === "trial" && daysUntilDue > 0,
    showPaymentBanner: needsPayment || (billingStatus === "trial" && daysUntilDue <= 0),
    showPixPaymentButton,
    paymentLinkUrl: empresa.woovi_payment_link_url ?? null,
    planLabel: plan?.planLabel ?? PLAN_LABEL,
    planValueCents: plan?.planValueCents ?? PLAN_VALUE_CENTS,
    trialDays: plan?.trialDays ?? TRIAL_DAYS,
  };
}

export function billingBlocksMutation(state: BillingUiState): boolean {
  return (
    state.isPaused ||
    state.needsPayment ||
    state.billingStatus === "pendente" ||
    state.billingStatus === "inadimplente"
  );
}
