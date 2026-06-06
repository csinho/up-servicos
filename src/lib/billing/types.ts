export type BillingStatus = "trial" | "ativo" | "pendente" | "inadimplente";

export type EmpresaOperacionalStatus = "ativo" | "inativo";

export type EmpresaBillingRow = {
  id: string;
  nome: string;
  telefone?: string | null;
  email?: string | null;
  status?: EmpresaOperacionalStatus | null;
  created_at?: string | null;
  billing_status?: BillingStatus | null;
  trial_ends_at?: string | null;
  next_billing_at?: string | null;
  billing_period_ends_at?: string | null;
  last_payment_at?: string | null;
  woovi_charge_correlation_id?: string | null;
  woovi_payment_link_url?: string | null;
};

export type BillingUiState = {
  phase: "trial" | "ativo" | "pendente";
  isPaused: boolean;
  billingStatus: BillingStatus;
  trialEndsAt: string | null;
  nextBillingAt: string | null;
  billingPeriodEndsAt: string | null;
  daysUntilDue: number;
  isPaidAndCurrent: boolean;
  needsPayment: boolean;
  showTrialBanner: boolean;
  showPaymentBanner: boolean;
  showPixPaymentButton: boolean;
  paymentLinkUrl: string | null;
  planLabel: string;
  planValueCents: number;
  trialDays: number;
};

export type BillingPaymentListItem = {
  id: string;
  paidAt: string;
  valueCents: number;
  status: "pago" | "reembolsado";
  correlationId: string | null;
  endToEndId: string | null;
  refundType: string | null;
  suggestedRefundCents: number | null;
};
