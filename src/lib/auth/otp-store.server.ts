import { getSupabaseServer } from "@/integrations/supabase/server";

export type OtpPurpose = "login" | "admin_login";

const OTP_TTL_MS = 10 * 60 * 1000;

export async function hashOtpCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(code);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function generateOtpCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function saveOtp(
  whatsapp: string,
  purpose: OtpPurpose,
  env?: Record<string, string | undefined>,
): Promise<string> {
  const code = generateOtpCode();
  const codeHash = await hashOtpCode(code);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  const sb = getSupabaseServer(env);
  const { error } = await sb.from("login_otp").upsert(
    {
      whatsapp,
      purpose,
      code_hash: codeHash,
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    },
    { onConflict: "whatsapp,purpose" },
  );

  if (error) throw new Error(error.message);
  return code;
}

export async function verifyOtp(
  whatsapp: string,
  purpose: OtpPurpose,
  code: string,
  env?: Record<string, string | undefined>,
): Promise<boolean> {
  const sb = getSupabaseServer(env);
  const { data, error } = await sb
    .from("login_otp")
    .select("code_hash, expires_at")
    .eq("whatsapp", whatsapp)
    .eq("purpose", purpose)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return false;
  if (new Date(data.expires_at as string).getTime() < Date.now()) return false;

  const codeHash = await hashOtpCode(code);
  return data.code_hash === codeHash;
}

export async function consumeOtp(
  whatsapp: string,
  purpose: OtpPurpose,
  env?: Record<string, string | undefined>,
): Promise<void> {
  const sb = getSupabaseServer(env);
  const { error } = await sb.from("login_otp").delete().eq("whatsapp", whatsapp).eq("purpose", purpose);
  if (error) throw new Error(error.message);
}
