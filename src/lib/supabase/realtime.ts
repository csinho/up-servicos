import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type RealtimeTable = "empresas" | "billing_payments" | "system_settings";

type RealtimeHandler = (table: RealtimeTable, eventType: string) => void;

let channel: RealtimeChannel | null = null;

export function startFreelaRealtime(onChange: RealtimeHandler): RealtimeChannel {
  stopFreelaRealtime();

  channel = supabase
    .channel("freela-os-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "empresas" },
      (payload) => onChange("empresas", payload.eventType),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "billing_payments" },
      (payload) => onChange("billing_payments", payload.eventType),
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "system_settings" },
      (payload) => onChange("system_settings", payload.eventType),
    )
    .subscribe();

  return channel;
}

export function stopFreelaRealtime(): void {
  if (channel) {
    void supabase.removeChannel(channel);
    channel = null;
  }
}
