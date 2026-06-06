import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { adminPageTitle } from "@/lib/app-brand";
import { getAdminDashboardRemote } from "@/lib/api/admin.functions";
import type { AdminDashboardMetrics } from "@/lib/admin/types";
import { getClientSessao } from "@/lib/auth/client-session";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAdminRefreshTick } from "@/components/admin/admin-refresh-context";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({ meta: [{ title: adminPageTitle("Dashboard") }] }),
  component: AdminDashboardPage,
});

function formatBRLCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function firstDayOfMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function todayIso(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function AdminDashboardPage() {
  const tick = useAdminRefreshTick();

  const [from, setFrom] = useState(firstDayOfMonth);
  const [to, setTo] = useState(todayIso);
  const [metrics, setMetrics] = useState<AdminDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const sessao = getClientSessao();
    if (!sessao) return;
    setLoading(true);
    try {
      const data = await getAdminDashboardRemote({
        data: { adminWhatsapp: sessao.id, from, to },
      });
      setMetrics(data);
    } catch (e) {
      toast.error((e as Error).message ?? "Falha ao carregar métricas");
    } finally {
      setLoading(false);
    }
  }, [from, to, tick]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Métricas agregadas de empresas e receita de planos."
      />

      <div className="grid gap-3 sm:grid-cols-3 items-end max-w-2xl">
        <div className="space-y-1">
          <Label htmlFor="dash-from">De</Label>
          <Input id="dash-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="dash-to">Até</Label>
          <Input id="dash-to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <Button type="button" variant="secondary" onClick={() => void load()}>
          Atualizar
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : metrics ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard title="Empresas ativas" value={String(metrics.empresasAtivas)} />
          <MetricCard title="Empresas pausadas" value={String(metrics.empresasInativas)} />
          <MetricCard title="Planos ativos" value={String(metrics.planosAtivos)} />
          <MetricCard title="Receita no período" value={formatBRLCents(metrics.receitaPeriodoCents)} />
          <MetricCard title="Ticket médio" value={formatBRLCents(metrics.ticketMedioCents)} />
          <MetricCard title="Taxa plano ativo" value={`${metrics.taxaPlanoAtivoPct}%`} />
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}
