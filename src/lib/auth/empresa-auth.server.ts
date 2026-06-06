import { APP_NAME, APP_NAME_ADMIN } from "@/lib/app-brand";
import { getSupabaseServer } from "@/integrations/supabase/server";
import { isAdminWhatsappAllowed } from "@/lib/admin/allowlist.server";
import type { AdminSessao } from "@/lib/admin/types";
import { TRIAL_DAYS } from "@/lib/billing/constants";
import { checkWhatsAppExists, sendOtpText } from "@/lib/evolution/client.server";
import { consumeOtp, saveOtp, verifyOtp } from "./otp-store.server";
import { createAuthUser, signInSyntheticUser } from "./supabase-auth.server";
import type { AuthTokens, EmpresaSessao, LoginRole } from "./types";

function normalizeTelefoneStorage(whatsapp11: string): string {
  return whatsapp11;
}

export async function resolveLoginRole(
  whatsapp11: string,
  env?: Record<string, string | undefined>,
): Promise<{ role: LoginRole; empresaNome?: string }> {
  if (await isAdminWhatsappAllowed(whatsapp11, env)) {
    return { role: "admin" };
  }

  const empresa = await findEmpresaByWhatsapp(whatsapp11, env);
  if (empresa) {
    return { role: "empresa", empresaNome: empresa.nome };
  }

  return { role: "none" };
}

export async function findEmpresaByWhatsapp(
  whatsapp11: string,
  env?: Record<string, string | undefined>,
): Promise<{ id: string; nome: string; status: string; auth_user_id: string | null } | null> {
  const sb = getSupabaseServer(env);
  const telefone = normalizeTelefoneStorage(whatsapp11);
  const { data, error } = await sb
    .from("empresas")
    .select("id, nome, status, auth_user_id, telefone")
    .eq("telefone", telefone)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return data;
}

export async function checkWhatsappRegistered(
  whatsapp11: string,
  env?: Record<string, string | undefined>,
): Promise<{ exists: boolean; paused: boolean }> {
  const empresa = await findEmpresaByWhatsapp(whatsapp11, env);
  if (!empresa) return { exists: false, paused: false };
  return { exists: true, paused: empresa.status === "inativo" };
}

export async function verifyWhatsAppOnRegister(
  whatsapp11: string,
  env?: Record<string, string | undefined>,
): Promise<{ valid: boolean }> {
  const exists = await checkWhatsAppExists(whatsapp11, env);
  return { valid: exists };
}

export async function registerEmpresaWithAuth(
  nome: string,
  whatsapp11: string,
  categoria: "generico" | "assistencia_tecnica" = "generico",
  env?: Record<string, string | undefined>,
): Promise<{ sessao: EmpresaSessao; auth: AuthTokens }> {
  const existing = await findEmpresaByWhatsapp(whatsapp11, env);
  if (existing) throw new Error("Este WhatsApp já possui conta. Faça login.");

  const waCheck = await checkWhatsAppExists(whatsapp11, env);
  if (!waCheck) throw new Error("Número não possui WhatsApp ativo.");

  const { authUserId } = await createAuthUser("empresa", whatsapp11, env);

  const sb = getSupabaseServer(env);
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

  const { data: empresa, error } = await sb
    .from("empresas")
    .insert({
      nome: nome.trim(),
      telefone: normalizeTelefoneStorage(whatsapp11),
      categoria,
      auth_user_id: authUserId,
      status: "ativo",
      billing_status: "trial",
      trial_ends_at: trialEnd.toISOString(),
      next_billing_at: trialEnd.toISOString(),
      created_at: new Date().toISOString(),
    })
    .select("id, nome")
    .single();

  if (error) throw new Error(error.message);

  const auth = await signInSyntheticUser("empresa", whatsapp11, authUserId, env);

  return {
    sessao: {
      tipo: "empresa",
      id: empresa.id,
      nome: empresa.nome,
      whatsapp: whatsapp11,
    },
    auth: {
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      expiresIn: auth.expiresIn,
    },
  };
}

export async function registerEmpresaByAdmin(
  nome: string,
  whatsapp11: string,
  env?: Record<string, string | undefined>,
): Promise<{ empresaId: string; nome: string }> {
  const existing = await findEmpresaByWhatsapp(whatsapp11, env);
  if (existing) throw new Error("WhatsApp já cadastrado.");

  const { authUserId } = await createAuthUser("empresa", whatsapp11, env);
  const sb = getSupabaseServer(env);
  const trialEnd = new Date();
  trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);

  const { data, error } = await sb
    .from("empresas")
    .insert({
      nome: nome.trim(),
      telefone: normalizeTelefoneStorage(whatsapp11),
      auth_user_id: authUserId,
      status: "ativo",
      billing_status: "trial",
      trial_ends_at: trialEnd.toISOString(),
      next_billing_at: trialEnd.toISOString(),
      created_at: new Date().toISOString(),
    })
    .select("id, nome")
    .single();

  if (error) throw new Error(error.message);
  return { empresaId: data.id, nome: data.nome };
}

async function sendLoginOtpMessage(
  whatsapp11: string,
  purpose: "login" | "admin_login",
  env?: Record<string, string | undefined>,
): Promise<{ ok: true; message: string }> {
  const code = await saveOtp(whatsapp11, purpose, env);
  const label = purpose === "admin_login" ? APP_NAME_ADMIN : APP_NAME;
  const text = `*${label}* — Seu código de acesso: *${code}*\nVálido por 10 minutos. Não compartilhe.`;

  await sendOtpText(whatsapp11, text, env);

  return {
    ok: true,
    message: "Código enviado no WhatsApp.",
  };
}

export async function requestEmpresaLoginOtp(
  whatsapp11: string,
  env?: Record<string, string | undefined>,
): Promise<{ ok: true; message: string }> {
  const empresa = await findEmpresaByWhatsapp(whatsapp11, env);
  if (!empresa) throw new Error("WhatsApp não cadastrado. Crie sua conta primeiro.");
  if (empresa.status === "inativo") {
    throw new Error("Conta pausada pela administração. Entre em contato com o suporte.");
  }
  if (!empresa.auth_user_id) {
    throw new Error("Conta sem autenticação configurada. Contate o suporte.");
  }

  return sendLoginOtpMessage(whatsapp11, "login", env);
}

export async function requestAdminLoginOtpUnified(
  whatsapp11: string,
  env?: Record<string, string | undefined>,
): Promise<{ ok: true; message: string }> {
  if (!(await isAdminWhatsappAllowed(whatsapp11, env))) {
    throw new Error("Acesso não autorizado.");
  }
  return sendLoginOtpMessage(whatsapp11, "admin_login", env);
}

export async function confirmEmpresaLoginOtp(
  whatsapp11: string,
  code: string,
  env?: Record<string, string | undefined>,
): Promise<{ sessao: EmpresaSessao; auth: AuthTokens }> {
  const empresa = await findEmpresaByWhatsapp(whatsapp11, env);
  if (!empresa) throw new Error("Empresa não encontrada.");
  if (empresa.status === "inativo") {
    throw new Error("Conta pausada pela administração.");
  }
  if (!empresa.auth_user_id) throw new Error("Autenticação não configurada.");

  const valid = await verifyOtp(whatsapp11, "login", code, env);
  if (!valid) throw new Error("Código incorreto ou expirado.");

  const auth = await signInSyntheticUser("empresa", whatsapp11, empresa.auth_user_id, env);
  await consumeOtp(whatsapp11, "login", env);

  return {
    sessao: {
      tipo: "empresa",
      id: empresa.id,
      nome: empresa.nome,
      whatsapp: whatsapp11,
    },
    auth: {
      accessToken: auth.accessToken,
      refreshToken: auth.refreshToken,
      expiresIn: auth.expiresIn,
    },
  };
}

export async function confirmAdminLoginOtpUnified(
  whatsapp11: string,
  code: string,
  env?: Record<string, string | undefined>,
): Promise<{ sessao: AdminSessao }> {
  if (!(await isAdminWhatsappAllowed(whatsapp11, env))) {
    throw new Error("Acesso não autorizado.");
  }

  const valid = await verifyOtp(whatsapp11, "admin_login", code, env);
  if (!valid) throw new Error("Código incorreto ou expirado.");

  await consumeOtp(whatsapp11, "admin_login", env);

  return {
    sessao: {
      tipo: "admin",
      id: whatsapp11,
      nome: "Administração",
    },
  };
}
