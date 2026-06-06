import { getServerEnv } from "@/lib/env.server";

const WHATSAPP_RE = /^\d{11}$/;

export function normalizeWhatsapp11(input: string): string {
  const digits = input.replace(/\D/g, "");
  if (digits.length === 13 && digits.startsWith("55")) return digits.slice(2);
  if (digits.length === 11) return digits;
  throw new Error("WhatsApp inválido — informe 11 dígitos (DDD + número).");
}

export function isValidWhatsapp11(whatsapp: string): boolean {
  return WHATSAPP_RE.test(whatsapp);
}

export function getAdminAllowlist(env?: Record<string, string | undefined>): string[] {
  const raw = getServerEnv("ADMIN_WHATSAPP_ALLOWLIST", env) ?? "";
  return raw
    .split(",")
    .map((s) => s.trim().replace(/\D/g, ""))
    .filter((s) => s.length === 11);
}

export function isAdminWhatsappAllowed(
  whatsapp: string,
  env?: Record<string, string | undefined>,
): boolean {
  if (!isValidWhatsapp11(whatsapp)) return false;
  const list = getAdminAllowlist(env);
  return list.includes(whatsapp);
}

export function assertAdminWhatsappAllowed(
  whatsapp: string,
  env?: Record<string, string | undefined>,
): void {
  if (!isAdminWhatsappAllowed(whatsapp, env)) {
    throw new Error("Acesso não autorizado.");
  }
}
