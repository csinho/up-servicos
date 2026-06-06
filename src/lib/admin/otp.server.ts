import { getSupabaseServer } from "@/integrations/supabase/server";
import { assertAdminWhatsappAllowed } from "./allowlist.server";
import type { AdminSessao } from "./types";

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_PURPOSE = "admin_login";

function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function sendAdminOtpStub(whatsapp: string, code: string): Promise<void> {
  console.info("[admin-otp]", {
    channel: "whatsapp_stub",
    to: whatsapp,
    code,
    message: `[Freela OS Admin] Seu código de acesso: ${code} (válido por 10 minutos).`,
  });
}

export async function requestAdminLoginOtp(
  whatsapp: string,
  env?: Record<string, string | undefined>,
): Promise<{ ok: true; message: string }> {
  assertAdminWhatsappAllowed(whatsapp, env);

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  const sb = getSupabaseServer(env);
  const { error } = await sb.from("admin_otp_codes").insert({
    whatsapp,
    code,
    purpose: OTP_PURPOSE,
    expires_at: expiresAt,
  });

  if (error) throw new Error(error.message);

  await sendAdminOtpStub(whatsapp, code);

  return {
    ok: true,
    message: "Código enviado. Verifique o WhatsApp cadastrado na allowlist.",
  };
}

export async function confirmAdminLoginOtp(
  whatsapp: string,
  code: string,
  env?: Record<string, string | undefined>,
): Promise<{ sessao: AdminSessao }> {
  assertAdminWhatsappAllowed(whatsapp, env);

  const sb = getSupabaseServer(env);
  const { data: row, error } = await sb
    .from("admin_otp_codes")
    .select("id, code, expires_at, used_at")
    .eq("whatsapp", whatsapp)
    .eq("purpose", OTP_PURPOSE)
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!row) throw new Error("Código expirado ou não solicitado.");
  if (row.code !== code) throw new Error("Código incorreto.");
  if (new Date(row.expires_at as string).getTime() < Date.now()) {
    throw new Error("Código expirado. Solicite um novo.");
  }

  const { error: upErr } = await sb
    .from("admin_otp_codes")
    .update({ used_at: new Date().toISOString() })
    .eq("id", row.id);

  if (upErr) throw new Error(upErr.message);

  return {
    sessao: {
      tipo: "admin",
      id: whatsapp,
      nome: "Administração",
    },
  };
}
