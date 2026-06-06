import { createClient } from "@supabase/supabase-js";

function requireViteEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  if (!value) {
    throw new Error(
      `${name} não está definida. Crie um arquivo .env local (veja .env.example) ou configure a variável no EasyPanel antes do build.`,
    );
  }
  return value;
}

const SUPABASE_URL = requireViteEnv("VITE_SUPABASE_URL");
const SUPABASE_PUBLISHABLE_KEY = requireViteEnv("VITE_SUPABASE_PUBLISHABLE_KEY");

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
