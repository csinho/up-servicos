import { useEffect } from "react";
import { startFreelaRealtime, stopFreelaRealtime } from "@/lib/supabase/realtime";

type AdminRealtimeProps = {
  onChange: () => void;
};

export function AdminRealtime({ onChange }: AdminRealtimeProps) {
  useEffect(() => {
    startFreelaRealtime(() => onChange());
    return () => stopFreelaRealtime();
  }, [onChange]);

  return null;
}
