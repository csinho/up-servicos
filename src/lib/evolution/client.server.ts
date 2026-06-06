import { getServerEnv } from "@/lib/env.server";
import { isEvolutionMock, resolveEvolutionInstanceName } from "./instance.server";

function evolutionBaseUrl(env?: Record<string, string | undefined>): string | null {
  const url = getServerEnv("EVOLUTION_API_URL", env);
  return url?.replace(/\/$/, "") ?? null;
}

function evolutionApiKey(env?: Record<string, string | undefined>): string | null {
  return getServerEnv("EVOLUTION_API_KEY", env) ?? null;
}

export function toEvolutionNumber(whatsapp11: string): string {
  return `55${whatsapp11}`;
}

export function isEvolutionConfigured(env?: Record<string, string | undefined>): boolean {
  if (isEvolutionMock(env)) return true;
  return !!(
    evolutionBaseUrl(env) &&
    evolutionApiKey(env) &&
    getServerEnv("EVOLUTION_INSTANCE", env)
  );
}

async function evolutionFetch<T>(
  path: string,
  init: RequestInit,
  env?: Record<string, string | undefined>,
): Promise<T> {
  const base = evolutionBaseUrl(env);
  const key = evolutionApiKey(env);
  if (!base || !key) throw new Error("Evolution API não configurada no servidor.");

  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      apikey: key,
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Evolution API erro ${res.status}: ${text || res.statusText}`);
  }

  return (await res.json()) as T;
}

export async function checkWhatsAppExists(
  whatsapp11: string,
  env?: Record<string, string | undefined>,
): Promise<boolean> {
  if (isEvolutionMock(env)) return true;

  const instance = await resolveEvolutionInstanceName(env);
  if (!instance) throw new Error("Instância Evolution não configurada.");

  const data = await evolutionFetch<{ exists?: boolean }[] | { response?: { exists?: boolean }[] }>(
    `/chat/whatsappNumbers/${instance}`,
    {
      method: "POST",
      body: JSON.stringify({ numbers: [toEvolutionNumber(whatsapp11)] }),
    },
    env,
  );

  if (Array.isArray(data)) {
    return data[0]?.exists === true;
  }
  const list = (data as { response?: { exists?: boolean }[] }).response;
  return list?.[0]?.exists === true;
}

export async function sendOtpText(
  whatsapp11: string,
  message: string,
  env?: Record<string, string | undefined>,
): Promise<{ mockCode?: string }> {
  if (isEvolutionMock(env)) {
    const match = message.match(/\*(\d{6})\*/);
    const code = match?.[1];
    console.info("[evolution-mock]", { to: whatsapp11, message, code });
    return { mockCode: code };
  }

  const instance = await resolveEvolutionInstanceName(env);
  if (!instance) throw new Error("Instância Evolution não configurada.");

  await evolutionFetch(
    `/message/sendText/${instance}`,
    {
      method: "POST",
      body: JSON.stringify({
        number: toEvolutionNumber(whatsapp11),
        text: message,
      }),
    },
    env,
  );

  return {};
}
