import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  gerarPixPlanoRemote,
  obterBillingStatusRemote,
} from "@/lib/api/billing.functions";
import { getEmpresaIdFromSessao } from "@/lib/auth/client-session";
import { startFreelaRealtime, stopFreelaRealtime } from "@/lib/supabase/realtime";
import type { BillingUiState } from "./types";

const POLL_MS = 5000;

export function useEmpresaBilling(empresaIdProp?: string) {
  const empresaId = empresaIdProp ?? getEmpresaIdFromSessao() ?? undefined;
  const [billing, setBilling] = useState<BillingUiState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const wasPaidRef = useRef<boolean | null>(null);

  const refresh = useCallback(async () => {
    try {
      const state = await obterBillingStatusRemote({ data: { empresaId } });
      if (wasPaidRef.current === false && state.isPaidAndCurrent) {
        toast.success("Pagamento confirmado! Seu plano está ativo.");
      }
      wasPaidRef.current = state.isPaidAndCurrent;
      setBilling(state);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    startFreelaRealtime(() => void refresh());
    return () => stopFreelaRealtime();
  }, [refresh]);

  useEffect(() => {
    if (!billing || billing.isPaidAndCurrent) return;
    const id = window.setInterval(() => void refresh(), POLL_MS);
    return () => window.clearInterval(id);
  }, [billing?.isPaidAndCurrent, refresh]);

  const gerarPix = useCallback(async () => {
    setIsGenerating(true);
    try {
      const result = await gerarPixPlanoRemote({ data: { empresaId } });
      toast.success("PIX gerado com sucesso.");
      await refresh();
      return result.paymentLinkUrl;
    } catch (e) {
      toast.error((e as Error).message ?? "Falha ao gerar PIX");
      return null;
    } finally {
      setIsGenerating(false);
    }
  }, [empresaId, refresh]);

  return { billing, refresh, gerarPix, isLoading, isGenerating };
}
