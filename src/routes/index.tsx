import { createFileRoute, Link } from "@tanstack/react-router";
import { pageTitle } from "@/lib/app-brand";
import { DashboardAssistenciaTecnica } from "@/components/dashboard/dashboard-assistencia-tecnica";
import { useEmpresaCategoria } from "@/hooks/use-empresa-categoria";
import { useOrcamentos, useFinanceiro } from "@/lib/store";
import {
  calcTotal,
  formatBRL,
  formatCalendarDate,
  formatDate,
  labelDocumento,
  STATUS_LABEL,
} from "@/lib/types";
import type { StatusOrcamento } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MobileCard } from "@/components/mobile/mobile-card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: pageTitle("Dashboard") }] }),
  component: Dashboard,
});

function Dashboard() {
  const { isAssistenciaTecnica, isLoading: lc } = useEmpresaCategoria();
  const { data: orcamentos = [], isLoading: lo } = useOrcamentos();
  const { data: financeiro = [], isLoading: lf } = useFinanceiro();

  if (!lc && isAssistenciaTecnica) {
    return <DashboardAssistenciaTecnica />;
  }

  const totaisPorStatus = orcamentos.reduce<Record<string, { count: number; total: number }>>(
    (acc, o) => {
      const t = calcTotal(o);
      const k = o.status;
      acc[k] = acc[k] || { count: 0, total: 0 };
      acc[k].count++;
      acc[k].total += t;
      return acc;
    },
    {},
  );

  const aReceber = financeiro
    .filter((f) => f.tipo === "receber" && f.status !== "pago")
    .reduce((a, f) => a + f.valor, 0);
  const recebido = financeiro
    .filter((f) => f.tipo === "receber" && f.status === "pago")
    .reduce((a, f) => a + f.valor, 0);
  const aPagar = financeiro
    .filter((f) => f.tipo === "pagar" && f.status !== "pago")
    .reduce((a, f) => a + f.valor, 0);

  const ultimos = [...orcamentos]
    .sort((a, b) => +new Date(b.data_criacao) - +new Date(a.data_criacao))
    .slice(0, 5);

  const proximosVenc = [...financeiro]
    .filter((f) => f.orcamento_id && f.status !== "pago")
    .sort((a, b) => +new Date(a.vencimento) - +new Date(b.vencimento))
    .slice(0, 5);

  const cards = [
    {
      label: "Em orçamento",
      value: formatBRL(totaisPorStatus.orcamento?.total || 0),
      sub: `${totaisPorStatus.orcamento?.count || 0} propostas`,
      accent: "sky",
    },
    {
      label: "Em produção",
      value: formatBRL(totaisPorStatus.em_producao?.total || 0),
      sub: `${totaisPorStatus.em_producao?.count || 0} projetos`,
      accent: "amber",
    },
    {
      label: "Entregue",
      value: formatBRL(totaisPorStatus.entregue?.total || 0),
      sub: `${totaisPorStatus.entregue?.count || 0} projetos`,
      accent: "emerald",
    },
    { label: "A receber", value: formatBRL(aReceber), sub: "pendente + atrasado", accent: "blue" },
    { label: "Recebido", value: formatBRL(recebido), sub: "total quitado", accent: "green" },
    { label: "A pagar", value: formatBRL(aPagar), sub: "contas pendentes", accent: "rose" },
  ];

  const accentBg: Record<string, string> = {
    sky: "from-sky-500/10 to-transparent border-sky-200/60",
    amber: "from-amber-500/10 to-transparent border-amber-200/60",
    emerald: "from-emerald-500/10 to-transparent border-emerald-200/60",
    blue: "from-blue-500/10 to-transparent border-blue-200/60",
    green: "from-green-500/10 to-transparent border-green-200/60",
    rose: "from-rose-500/10 to-transparent border-rose-200/60",
  };

  return (
    <div className="space-y-6">
      <div className="hidden md:block">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {lo || lf ? "Carregando…" : "Visão geral dos projetos e finanças."}
        </p>
      </div>

      {/* Mobile hero resumo */}
      <MobileCard accent="primary" className="md:hidden bg-gradient-to-br from-primary/8 to-transparent">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Resumo financeiro
        </p>
        <div className="mt-2 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">A receber</p>
            <p className="text-xl font-bold tabular-nums">{formatBRL(aReceber)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Recebido</p>
            <p className="text-xl font-bold tabular-nums text-emerald-700">{formatBRL(recebido)}</p>
          </div>
        </div>
      </MobileCard>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {cards.map((c) => (
          <Card
            key={c.label}
            className={cn(
              "overflow-hidden",
              "md:shadow-sm",
              `md:bg-card bg-gradient-to-br ${accentBg[c.accent]} md:bg-none md:border-border`,
            )}
          >
            <CardHeader className="pb-1 md:pb-2 p-4 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">
                {c.label}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 md:p-6 md:pt-0">
              <div className="text-lg md:text-2xl font-bold tabular-nums">{c.value}</div>
              <div className="text-[11px] md:text-xs text-muted-foreground mt-1">{c.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="md:shadow-sm border-0 md:border shadow-sm rounded-2xl md:rounded-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Últimos orçamentos e pedidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ultimos.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum orçamento.</p>
            )}
            {ultimos.map((o) => (
              <Link
                key={o.id}
                to="/orcamentos/$id"
                params={{ id: o.id }}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl md:rounded-md border p-3.5 md:p-3 hover:bg-accent active:bg-muted/50 transition-colors"
              >
                <div className="min-w-0">
                  <div className="font-medium text-sm">{o.nome_projeto}</div>
                  <div className="text-xs text-muted-foreground">
                    {labelDocumento(o.status as StatusOrcamento)} · {o.numero} ·{" "}
                    {formatDate(o.data_criacao)}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end sm:shrink-0">
                  <div className="text-sm font-semibold tabular-nums">{formatBRL(calcTotal(o))}</div>
                  <Badge variant="secondary" className="text-[10px]">
                    {STATUS_LABEL[o.status as StatusOrcamento]}
                  </Badge>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="md:shadow-sm border-0 md:border shadow-sm rounded-2xl md:rounded-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Próximos vencimentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {proximosVenc.length === 0 && (
              <p className="text-sm text-muted-foreground">Nada pendente.</p>
            )}
            {proximosVenc.map((f) => (
              <div
                key={f.id}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between rounded-xl md:rounded-md border p-3.5 md:p-3"
              >
                <div className="min-w-0">
                  <div className="font-medium text-sm">{f.descricao}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatCalendarDate(f.vencimento)} ·{" "}
                    {f.tipo === "receber" ? "Receber" : "Pagar"}
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 sm:flex-col sm:items-end sm:shrink-0">
                  <div className="text-sm font-semibold tabular-nums">{formatBRL(f.valor)}</div>
                  <Badge
                    variant={f.status === "atrasado" ? "destructive" : "secondary"}
                    className="text-[10px]"
                  >
                    {f.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
