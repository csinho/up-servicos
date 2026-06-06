import { getSupabaseServer } from "@/integrations/supabase/server";
import type { AdminDashboardMetrics } from "./types";

export async function getAdminDashboard(
  from: string,
  to: string,
  env?: Record<string, string | undefined>,
): Promise<AdminDashboardMetrics> {
  const sb = getSupabaseServer(env);

  const { data: empresas, error: empErr } = await sb
    .from("empresas")
    .select("id, status, billing_status");

  if (empErr) throw new Error(empErr.message);

  const list = empresas ?? [];
  const empresasTotal = list.length;
  const empresasAtivas = list.filter((e) => (e.status ?? "ativo") === "ativo").length;
  const empresasInativas = empresasTotal - empresasAtivas;
  const planosAtivos = list.filter((e) => e.billing_status === "ativo").length;

  const fromIso = `${from}T00:00:00-03:00`;
  const toIso = `${to}T23:59:59-03:00`;

  const { data: payments, error: payErr } = await sb
    .from("billing_payments")
    .select("value_cents, status")
    .eq("status", "pago")
    .gte("paid_at", fromIso)
    .lte("paid_at", toIso);

  if (payErr) throw new Error(payErr.message);

  const paid = payments ?? [];
  const receitaPeriodoCents = paid.reduce((sum, p) => sum + (p.value_cents ?? 0), 0);
  const ticketMedioCents = paid.length > 0 ? Math.round(receitaPeriodoCents / paid.length) : 0;
  const taxaPlanoAtivoPct =
    empresasTotal > 0 ? Math.round((planosAtivos / empresasTotal) * 100) : 0;

  return {
    empresasAtivas,
    empresasInativas,
    empresasTotal,
    planosAtivos,
    receitaPeriodoCents,
    ticketMedioCents,
    taxaPlanoAtivoPct,
  };
}
