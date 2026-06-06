import type { BillingStatus } from "@/lib/billing/types";
import type { EmpresaCategoria } from "@/lib/empresa-categorias/types";

export type AdminSessao = {
  tipo: "admin";
  id: string;
  nome: string;
};

export type EmpresaOperacionalStatus = "ativo" | "inativo";

export type AdminEmpresaListItem = {
  id: string;
  nome: string;
  categoria: EmpresaCategoria;
  telefone: string | null;
  email: string | null;
  status: EmpresaOperacionalStatus;
  billingStatus: BillingStatus;
  trialEndsAt: string | null;
  nextBillingAt: string | null;
  lastPaymentAt: string | null;
  createdAt: string | null;
  orcamentosCount: number;
  clientesCount: number;
};

export type AdminEmpresaDetalhe = AdminEmpresaListItem & {
  logoUrl: string | null;
  documento: string | null;
  billingPeriodEndsAt: string | null;
};

export type AdminSettings = {
  planValueCents: number;
  planLabel: string;
  contactWhatsapp: string;
  evolutionInstanceName: string;
  evolutionConnectionPhone: string;
  evolutionConnectionState: string;
  evolutionConnectedAt: string | null;
};

export type EvolutionQrResult = {
  instanceName: string;
  base64: string | null;
  pairingCode: string | null;
  connectionState: string;
};

export type AdminDashboardMetrics = {
  empresasAtivas: number;
  empresasInativas: number;
  empresasTotal: number;
  planosAtivos: number;
  receitaPeriodoCents: number;
  ticketMedioCents: number;
  taxaPlanoAtivoPct: number;
};
