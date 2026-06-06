import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, ExternalLink, RefreshCw } from "lucide-react";
import { EmpresaPlanoPagamentosList } from "@/components/empresa/EmpresaPlanoPagamentosList";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME, pageTitle } from "@/lib/app-brand";
import { formatDatePt } from "@/lib/billing/dates";
import { useEmpresaBilling } from "@/lib/billing/use-empresa-billing";

export const Route = createFileRoute("/plano")({
  head: () => ({ meta: [{ title: pageTitle("Plano") }] }),
  component: PlanoPage,
});

function PlanoPage() {
  const { billing, gerarPix, isLoading, isGenerating, refresh } = useEmpresaBilling();

  const openPayment = () => {
    if (billing?.paymentLinkUrl) {
      window.open(billing.paymentLinkUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader
        title={`Plano ${APP_NAME}`}
        description={
          billing
            ? `Assinatura mensal via PIX — trial de ${billing.trialDays} dias, depois ${billing.planLabel}.`
            : "Assinatura mensal via PIX."
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Status do plano
          </CardTitle>
          <CardDescription>
            {isLoading
              ? "Carregando…"
              : billing?.phase === "trial"
                ? "Período de teste gratuito"
                : billing?.isPaidAndCurrent
                  ? "Plano ativo"
                  : "Pagamento necessário"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isLoading && billing && (
            <>
              <div className="rounded-md border bg-muted/40 px-4 py-3 text-sm">
                Valor do plano: <strong>{billing.planLabel}</strong>
                {billing.paymentLinkUrl && (
                  <span className="text-muted-foreground">
                    {" "}
                    — clique em <strong>Atualizar PIX</strong> após mudança de preço pelo admin.
                  </span>
                )}
              </div>

              {billing.phase === "trial" && (
                <p className="text-sm">
                  Você está no trial gratuito até <strong>{formatDatePt(billing.trialEndsAt)}</strong> (
                  {billing.daysUntilDue} dia(s) restantes).
                </p>
              )}

              {billing.isPaidAndCurrent && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  Plano ativo. Próxima cobrança em <strong>{formatDatePt(billing.nextBillingAt)}</strong>.
                </div>
              )}

              {billing.needsPayment && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                  Pagamento pendente. Gere o PIX para continuar usando todas as funções do sistema.
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {billing.showPixPaymentButton && (
                  <Button type="button" onClick={() => void gerarPix()} disabled={isGenerating}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
                    {billing.paymentLinkUrl ? "Atualizar PIX" : "Gerar PIX"}
                  </Button>
                )}
                {billing.paymentLinkUrl && (
                  <Button type="button" variant="secondary" onClick={openPayment}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir pagamento
                  </Button>
                )}
                <Button type="button" variant="ghost" onClick={() => void refresh()}>
                  Atualizar status
                </Button>
              </div>

              {!billing.isPaidAndCurrent && (
                <p className="text-xs text-muted-foreground">
                  A confirmação do PIX é detectada automaticamente (atualização a cada 5 segundos).
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Histórico de pagamentos</CardTitle>
          <CardDescription>Pagamentos confirmados e comprovantes em PDF.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmpresaPlanoPagamentosList />
        </CardContent>
      </Card>
    </div>
  );
}
