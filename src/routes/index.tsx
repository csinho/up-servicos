import { createFileRoute, Link } from "@tanstack/react-router";
import { useApp } from "@/lib/store";
import { calcTotal, formatBRL, formatDate, STATUS_LABEL } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — Freela OS" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { orcamentos, financeiro } = useApp();

  const totaisPorStatus = orcamentos.reduce<Record<string, { count: number; total: number }>>((acc, o) => {
    const t = calcTotal(o);
    const k = o.status;
    acc[k] = acc[k] || { count: 0, total: 0 };
    acc[k].count++;
    acc[k].total += t;
    return acc;
  }, {});

  const aReceber = financeiro.filter((f) => f.tipo === "receber" && f.status !== "pago").reduce((a, f) => a + f.valor, 0);
  const recebido = financeiro.filter((f) => f.tipo === "receber" && f.status === "pago").reduce((a, f) => a + f.valor, 0);
  const aPagar = financeiro.filter((f) => f.tipo === "pagar" && f.status !== "pago").reduce((a, f) => a + f.valor, 0);

  const ultimos = [...orcamentos]
    .sort((a, b) => +new Date(b.data_criacao) - +new Date(a.data_criacao))
    .slice(0, 5);

  const proximosVenc = [...financeiro]
    .filter((f) => f.status !== "pago")
    .sort((a, b) => +new Date(a.vencimento) - +new Date(b.vencimento))
    .slice(0, 5);

  const cards = [
    { label: "Em orçamento", value: formatBRL(totaisPorStatus.orcamento?.total || 0), sub: `${totaisPorStatus.orcamento?.count || 0} propostas` },
    { label: "Em produção", value: formatBRL(totaisPorStatus.em_producao?.total || 0), sub: `${totaisPorStatus.em_producao?.count || 0} projetos` },
    { label: "Entregue", value: formatBRL(totaisPorStatus.entregue?.total || 0), sub: `${totaisPorStatus.entregue?.count || 0} projetos` },
    { label: "A receber", value: formatBRL(aReceber), sub: "pendente + atrasado" },
    { label: "Recebido", value: formatBRL(recebido), sub: "total quitado" },
    { label: "A pagar", value: formatBRL(aPagar), sub: "contas pendentes" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral dos projetos e finanças.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold">{c.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{c.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Últimos orçamentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {ultimos.length === 0 && <p className="text-sm text-muted-foreground">Nenhum orçamento.</p>}
            {ultimos.map((o) => (
              <Link key={o.id} to="/orcamentos/$id" params={{ id: o.id }} className="flex items-center justify-between rounded-md border p-3 hover:bg-accent">
                <div>
                  <div className="font-medium text-sm">{o.nome_projeto}</div>
                  <div className="text-xs text-muted-foreground">{o.numero} · {formatDate(o.data_criacao)}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{formatBRL(calcTotal(o))}</div>
                  <Badge variant="secondary" className="text-[10px]">{STATUS_LABEL[o.status]}</Badge>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Próximos vencimentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {proximosVenc.length === 0 && <p className="text-sm text-muted-foreground">Nada pendente.</p>}
            {proximosVenc.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="font-medium text-sm">{f.descricao}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(f.vencimento)} · {f.tipo === "receber" ? "Receber" : "Pagar"}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{formatBRL(f.valor)}</div>
                  <Badge variant={f.status === "atrasado" ? "destructive" : "secondary"} className="text-[10px]">{f.status}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
