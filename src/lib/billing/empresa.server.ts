import { getSupabaseServer } from "@/integrations/supabase/server";
import { EMPRESA_ID } from "./constants";
import type { EmpresaBillingRow } from "./types";

export function resolveEmpresaId(explicit?: string): string {
  return explicit || EMPRESA_ID;
}

export async function fetchEmpresaBilling(
  empresaId = EMPRESA_ID,
  env?: Record<string, string | undefined>,
): Promise<EmpresaBillingRow> {
  const sb = getSupabaseServer(env);
  const { data, error } = await sb
    .from("empresas")
    .select(
      "id, nome, telefone, email, status, created_at, billing_status, trial_ends_at, next_billing_at, billing_period_ends_at, last_payment_at, woovi_charge_correlation_id, woovi_payment_link_url",
    )
    .eq("id", empresaId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) {
    return {
      id: empresaId,
      nome: "Minha Empresa",
      billing_status: "trial",
    };
  }
  return data as EmpresaBillingRow;
}

export async function updateEmpresaBilling(
  empresaId: string,
  patch: Record<string, unknown>,
  env?: Record<string, string | undefined>,
): Promise<void> {
  const sb = getSupabaseServer(env);
  const { error } = await sb.from("empresas").update(patch).eq("id", empresaId);
  if (error) throw new Error(error.message);
}
