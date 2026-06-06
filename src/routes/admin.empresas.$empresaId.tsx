import { createFileRoute, Link } from "@tanstack/react-router";
import { useAdminRefreshTick } from "@/components/admin/admin-refresh-context";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { obterEmpresaAdminRemote, setEmpresaPausadaAdminRemote } from "@/lib/api/admin.functions";
import type { AdminEmpresaDetalhe } from "@/lib/admin/types";
import { formatDatePt } from "@/lib/billing/dates";
import { getClientSessao } from "@/lib/auth/client-session";
import { AdminEmpresaBillingPayments } from "@/components/admin/AdminEmpresaBillingPayments";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/admin/empresas/$empresaId")({
  head: () => ({ meta: [{ title: "Detalhe empresa — Admin Freela OS" }] }),
  component: AdminEmpresaDetalhePage,
});

function AdminEmpresaDetalhePage() {
  const { empresaId } = Route.useParams();
  const tick = useAdminRefreshTick();
  const [empresa, setEmpresa] = useState<AdminEmpresaDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    const sessao = getClientSessao();
    if (!sessao) return;
    setLoading(true);
    try {
      const data = await obterEmpresaAdminRemote({
        data: { adminWhatsapp: sessao.id, empresaId },
      });
      setEmpresa(data);
    } catch (e) {
      toast.error((e as Error).message ?? "Falha ao carregar empresa");
    } finally {
      setLoading(false);
    }
  }, [empresaId, tick]);

  useEffect(() => {
    void load();
  }, [load]);

  const togglePausa = async () => {
    if (!empresa) return;
    const sessao = getClientSessao();
    if (!sessao) return;
    setToggling(true);
    try {
      await setEmpresaPausadaAdminRemote({
        data: {
          adminWhatsapp: sessao.id,
          empresaId,
          pausada: empresa.status === "ativo",
        },
      });
      toast.success(empresa.status === "ativo" ? "Empresa pausada." : "Empresa reativada.");
      await load();
    } catch (e) {
      toast.error((e as Error).message ?? "Falha ao alterar status");
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Carregando empresa…</p>;
  }

  if (!empresa) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Empresa não encontrada.</p>
        <Button asChild variant="outline">
          <Link to="/admin/empresas">Voltar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={empresa.nome} description="Detalhe cadastral e billing da empresa.">
        <Button type="button" variant="outline" asChild>
          <Link to="/admin/empresas">Voltar</Link>
        </Button>
        <Button
          type="button"
          variant={empresa.status === "ativo" ? "destructive" : "default"}
          disabled={toggling}
          onClick={() => void togglePausa()}
        >
          {empresa.status === "ativo" ? "Pausar empresa" : "Reativar empresa"}
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cadastro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Telefone:</span> {empresa.telefone ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">E-mail:</span> {empresa.email ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Documento:</span> {empresa.documento ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Orçamentos:</span> {empresa.orcamentosCount}
            </p>
            <p>
              <span className="text-muted-foreground">Clientes:</span> {empresa.clientesCount}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Billing</CardTitle>
            <CardDescription>Status operacional e de pagamento são independentes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant={empresa.status === "ativo" ? "default" : "secondary"}>
                Operacional: {empresa.status}
              </Badge>
              <Badge variant={empresa.billingStatus === "ativo" ? "default" : "destructive"}>
                Pagamento: {empresa.billingStatus}
              </Badge>
            </div>
            <p>
              <span className="text-muted-foreground">Trial até:</span>{" "}
              {formatDatePt(empresa.trialEndsAt)}
            </p>
            <p>
              <span className="text-muted-foreground">Próximo vencimento:</span>{" "}
              {formatDatePt(empresa.nextBillingAt)}
            </p>
            <p>
              <span className="text-muted-foreground">Último pagamento:</span>{" "}
              {formatDatePt(empresa.lastPaymentAt)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pagamentos do plano</CardTitle>
          <CardDescription>Histórico em billing_payments — estornos via painel Woovi.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminEmpresaBillingPayments empresaId={empresaId} refreshKey={tick} />
        </CardContent>
      </Card>
    </div>
  );
}
