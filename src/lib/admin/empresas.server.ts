import { getSupabaseServer } from "@/integrations/supabase/server";
import { getBillingUiState } from "@/lib/billing/state";
import type { BillingStatus } from "@/lib/billing/types";
import { normalizeEmpresaCategoria, type EmpresaCategoria } from "@/lib/empresa-categorias";
import type { AdminEmpresaDetalhe, AdminEmpresaListItem, EmpresaOperacionalStatus } from "./types";

function normalizeSearch(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function matchesSearch(
  empresa: { nome: string; telefone?: string | null },
  query: string,
): boolean {
  const q = normalizeSearch(query);
  if (!q) return true;
  const nome = normalizeSearch(empresa.nome);
  if (nome.includes(q)) return true;
  const phoneDigits = (empresa.telefone ?? "").replace(/\D/g, "");
  const qDigits = query.replace(/\D/g, "");
  if (qDigits && phoneDigits.includes(qDigits)) return true;
  return false;
}

export async function listarEmpresasAdmin(
  search?: string,
  env?: Record<string, string | undefined>,
): Promise<AdminEmpresaListItem[]> {
  const sb = getSupabaseServer(env);
  const { data: empresas, error } = await sb
    .from("empresas")
    .select(
      "id, nome, categoria, telefone, email, status, billing_status, trial_ends_at, next_billing_at, last_payment_at, created_at",
    )
    .order("nome");

  if (error) throw new Error(error.message);

  const [{ count: orcCount }, { count: cliCount }] = await Promise.all([
    sb.from("orcamentos").select("id", { count: "exact", head: true }),
    sb.from("clientes").select("id", { count: "exact", head: true }),
  ]);

  const globalOrcamentos = orcCount ?? 0;
  const globalClientes = cliCount ?? 0;

  return (empresas ?? [])
    .filter((e) => matchesSearch(e, search ?? ""))
    .map((e) => ({
      id: e.id,
      nome: e.nome,
      categoria: normalizeEmpresaCategoria(e.categoria),
      telefone: e.telefone ?? null,
      email: e.email ?? null,
      status: (e.status ?? "ativo") as EmpresaOperacionalStatus,
      billingStatus: (e.billing_status ?? "trial") as BillingStatus,
      trialEndsAt: e.trial_ends_at ?? null,
      nextBillingAt: e.next_billing_at ?? null,
      lastPaymentAt: e.last_payment_at ?? null,
      createdAt: e.created_at ?? null,
      orcamentosCount: globalOrcamentos,
      clientesCount: globalClientes,
    }));
}

export async function obterEmpresaAdmin(
  empresaId: string,
  env?: Record<string, string | undefined>,
): Promise<AdminEmpresaDetalhe> {
  const sb = getSupabaseServer(env);
  const { data: e, error } = await sb
    .from("empresas")
    .select(
      "id, nome, categoria, telefone, email, logo_url, documento, status, billing_status, trial_ends_at, next_billing_at, billing_period_ends_at, last_payment_at, created_at",
    )
    .eq("id", empresaId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!e) throw new Error("Empresa não encontrada.");

  const [{ count: orcCount }, { count: cliCount }] = await Promise.all([
    sb.from("orcamentos").select("id", { count: "exact", head: true }),
    sb.from("clientes").select("id", { count: "exact", head: true }),
  ]);

  const billingState = getBillingUiState({
    id: e.id,
    nome: e.nome,
    billing_status: e.billing_status,
    trial_ends_at: e.trial_ends_at,
    next_billing_at: e.next_billing_at,
    billing_period_ends_at: e.billing_period_ends_at,
  });

  return {
    id: e.id,
    nome: e.nome,
    categoria: normalizeEmpresaCategoria(e.categoria),
    telefone: e.telefone ?? null,
    email: e.email ?? null,
    logoUrl: e.logo_url ?? null,
    documento: e.documento ?? null,
    status: (e.status ?? "ativo") as EmpresaOperacionalStatus,
    billingStatus: billingState.billingStatus,
    trialEndsAt: e.trial_ends_at ?? null,
    nextBillingAt: e.next_billing_at ?? null,
    lastPaymentAt: e.last_payment_at ?? null,
    createdAt: e.created_at ?? null,
    billingPeriodEndsAt: e.billing_period_ends_at ?? null,
    orcamentosCount: orcCount ?? 0,
    clientesCount: cliCount ?? 0,
  };
}

export async function setEmpresaPausadaAdmin(
  empresaId: string,
  pausada: boolean,
  env?: Record<string, string | undefined>,
): Promise<void> {
  const sb = getSupabaseServer(env);
  const status: EmpresaOperacionalStatus = pausada ? "inativo" : "ativo";
  const { error } = await sb.from("empresas").update({ status }).eq("id", empresaId);
  if (error) throw new Error(error.message);
}

export async function setEmpresaCategoriaAdmin(
  empresaId: string,
  categoria: EmpresaCategoria,
  env?: Record<string, string | undefined>,
): Promise<void> {
  const sb = getSupabaseServer(env);
  const { error } = await sb.from("empresas").update({ categoria }).eq("id", empresaId);
  if (error) throw new Error(error.message);
}
