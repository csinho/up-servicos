import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://tdtmxddukuqsxsiiwzqp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_sV6Tal25v-z7Def-bEPV1A_v5IpDrpr";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});
