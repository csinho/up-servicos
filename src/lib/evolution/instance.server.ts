import { getSupabaseServer } from "@/integrations/supabase/server";
import { getServerEnv } from "@/lib/env.server";

export async function resolveEvolutionInstanceName(
  env?: Record<string, string | undefined>,
): Promise<string | null> {
  try {
    const sb = getSupabaseServer(env);
    const { data } = await sb
      .from("system_settings")
      .select("value")
      .eq("key", "evolution")
      .maybeSingle();

    const value = (data?.value ?? {}) as { instance_name?: string };
    if (value.instance_name?.trim()) return value.instance_name.trim();
  } catch {
    // fallback env
  }

  return getServerEnv("EVOLUTION_INSTANCE", env) ?? null;
}

export function isEvolutionMock(env?: Record<string, string | undefined>): boolean {
  const mock = getServerEnv("EVOLUTION_MOCK", env);
  return mock === "true" || mock === "1";
}
