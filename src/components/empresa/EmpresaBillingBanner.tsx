import { Link } from "@tanstack/react-router";
import { AlertTriangle, Sparkles } from "lucide-react";
import { useEmpresaBilling } from "@/lib/billing/use-empresa-billing";
import { formatDatePt } from "@/lib/billing/dates";
import { Button } from "@/components/ui/button";

export function EmpresaBillingBanner() {
  const { billing, isLoading } = useEmpresaBilling();

  if (isLoading || !billing) return null;

  if (billing.isPaused) {
    return (
      <div className="mb-4 rounded-lg border border-red-400 bg-red-50 px-4 py-3 text-sm text-red-950 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Conta pausada pela administração — o uso do sistema está bloqueado.</span>
        </div>
      </div>
    );
  }

  if (billing.showTrialBanner) {
    return (
      <div className="mb-4 rounded-lg border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm text-amber-950 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          <Sparkles className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Trial gratuito — faltam <strong>{billing.daysUntilDue}</strong> dia(s). Termina em{" "}
            {formatDatePt(billing.trialEndsAt)}.
          </span>
        </div>
        <Button asChild size="sm" variant="outline" className="shrink-0">
          <Link to="/plano">Ver plano</Link>
        </Button>
      </div>
    );
  }

  if (billing.showPaymentBanner) {
    return (
      <div className="mb-4 rounded-lg border border-red-300/80 bg-red-50 px-4 py-3 text-sm text-red-950 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Pagamento pendente — algumas ações estão bloqueadas até regularizar o plano.</span>
        </div>
        <Button asChild size="sm" variant="destructive" className="shrink-0">
          <Link to="/plano">Pagar com PIX</Link>
        </Button>
      </div>
    );
  }

  if (billing.phase === "ativo" && billing.daysUntilDue <= 5 && billing.daysUntilDue >= 0) {
    return (
      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950 flex flex-wrap items-center justify-between gap-3">
        <span>
          Renovação em <strong>{billing.daysUntilDue}</strong> dia(s) ({formatDatePt(billing.nextBillingAt)}).
        </span>
        <Button asChild size="sm" variant="outline" className="shrink-0">
          <Link to="/plano">Renovar antecipado</Link>
        </Button>
      </div>
    );
  }

  return null;
}
