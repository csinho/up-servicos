import { getSupabaseServer } from "@/integrations/supabase/server";
import { syntheticAuthEmail, type AuthSyntheticTipo } from "./synthetic-email";

function randomPassword(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export type AuthSessionPayload = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  authUserId: string;
};

export async function createAuthUser(
  tipo: AuthSyntheticTipo,
  whatsapp11: string,
  env?: Record<string, string | undefined>,
): Promise<{ authUserId: string; email: string }> {
  const sb = getSupabaseServer(env);
  const email = syntheticAuthEmail(tipo, whatsapp11);
  const password = randomPassword();

  const { data, error } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Falha ao criar usuário de autenticação.");

  return { authUserId: data.user.id, email };
}

export async function signInSyntheticUser(
  tipo: AuthSyntheticTipo,
  whatsapp11: string,
  authUserId: string,
  env?: Record<string, string | undefined>,
): Promise<AuthSessionPayload> {
  const sb = getSupabaseServer(env);
  const email = syntheticAuthEmail(tipo, whatsapp11);
  const password = randomPassword();

  const { error: upErr } = await sb.auth.admin.updateUserById(authUserId, { password });
  if (upErr) throw new Error(upErr.message);

  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  if (!data.session) throw new Error("Sessão não retornada pelo Supabase Auth.");

  return {
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    expiresIn: data.session.expires_in ?? 3600,
    authUserId: data.user!.id,
  };
}
