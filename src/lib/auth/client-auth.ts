import { supabase } from "@/integrations/supabase/client";
import type { AuthTokens } from "./types";
import { clearClientSessao, setClientSessao, type ClientSessao } from "./client-session";

export async function applyAuthSession(sessao: ClientSessao, auth?: AuthTokens): Promise<void> {
  setClientSessao(sessao);
  if (auth && sessao.tipo === "empresa") {
    const { error } = await supabase.auth.setSession({
      access_token: auth.accessToken,
      refresh_token: auth.refreshToken,
    });
    if (error) throw new Error(error.message);
  }
}

export async function logoutClient(): Promise<void> {
  clearClientSessao();
  await supabase.auth.signOut();
}
