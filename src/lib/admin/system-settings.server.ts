import { getSupabaseServer } from "@/integrations/supabase/server";
import { PLAN_VALUE_CENTS } from "@/lib/billing/constants";
import type { AdminSettings } from "./types";

function formatPlanLabel(cents: number): string {
  const reais = (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
  return `${reais}/mês`;
}

export async function getBillingPlanValueCents(
  env?: Record<string, string | undefined>,
): Promise<number> {
  const settings = await getBillingSettings(env);
  return settings.planValueCents;
}

export async function getBillingSettings(
  env?: Record<string, string | undefined>,
): Promise<AdminSettings> {
  const sb = getSupabaseServer(env);
  const { data: billingRow } = await sb
    .from("system_settings")
    .select("value")
    .eq("key", "billing")
    .maybeSingle();

  const { data: adminRow } = await sb
    .from("system_settings")
    .select("value")
    .eq("key", "admin")
    .maybeSingle();

  const billingValue = (billingRow?.value ?? {}) as { plan_value_cents?: number };
  const adminValue = (adminRow?.value ?? {}) as { contact_whatsapp?: string };

  const planValueCents =
    typeof billingValue.plan_value_cents === "number"
      ? billingValue.plan_value_cents
      : PLAN_VALUE_CENTS;

  return {
    planValueCents,
    planLabel: formatPlanLabel(planValueCents),
    contactWhatsapp: adminValue.contact_whatsapp ?? "",
  };
}

export async function getAdminSettings(
  env?: Record<string, string | undefined>,
): Promise<AdminSettings> {
  return getBillingSettings(env);
}

export async function saveAdminBillingPlan(
  planValueReais: number,
  env?: Record<string, string | undefined>,
): Promise<AdminSettings> {
  if (!Number.isFinite(planValueReais) || planValueReais <= 0) {
    throw new Error("Valor do plano inválido.");
  }

  const newCents = Math.round(planValueReais * 100);
  const previous = await getBillingSettings(env);

  const sb = getSupabaseServer(env);
  const { error } = await sb.from("system_settings").upsert(
    {
      key: "billing",
      value: { plan_value_cents: newCents },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) throw new Error(error.message);

  if (newCents !== previous.planValueCents) {
    console.info("[admin-plan-change]", {
      fromCents: previous.planValueCents,
      toCents: newCents,
    });
  }

  return getBillingSettings(env);
}

export async function saveAdminContactWhatsapp(
  contactWhatsapp: string,
  env?: Record<string, string | undefined>,
): Promise<AdminSettings> {
  const digits = contactWhatsapp.replace(/\D/g, "");

  const sb = getSupabaseServer(env);
  const { error } = await sb.from("system_settings").upsert(
    {
      key: "admin",
      value: { contact_whatsapp: digits },
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" },
  );

  if (error) throw new Error(error.message);
  return getBillingSettings(env);
}
