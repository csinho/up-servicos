import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";
import { useEmpresaCategoria } from "@/hooks/use-empresa-categoria";
import { useFinanceiro, useOrcamentos, useProdutos } from "@/lib/store";
import { isEstoqueBaixo } from "@/lib/produtos.repository";
import { getStatusLabel } from "@/lib/empresa-categorias";
import { calcTotal, formatBRL, formatDate } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MobileCard } from "@/components/mobile/mobile-card";
import { cn } from "@/lib/utils";

const accentMap: Record<string, string> = {
  orcamento: "border-sky-200 bg-sky-50/80",
  entrada: "border-violet-200 bg-violet-50/80",
  diagnostico: "border-amber-200 bg-amber-50/80",
  aguardando_peca: "border-orange-200 bg-orange-50/80",
  em_reparo: "border-blue-200 bg-blue-50/80",
  pronto: "border-emerald-200 bg-emerald-50/80",
  entregue: "border-slate-200 bg-slate-50/80",
};

export function DashboardAssistenciaTecnica() {
  const { config } = useEmpresaCategoria();
  const { data: orcamentos = [], isLoading: lo } = useOrcamentos();
  const { data: financeiro = [], isLoading: lf } = useFinanceiro();
  const { data: produtos = [] } = useProdutos();

  const totaisPorStatus = config.statusOrder.map((status) => {
    const list = orcamentos.filter((o) => o.status === status);
    const total = list.reduce((a, o) => a + calcTotal(o), 0);
    return { status, count: list.length, total };
  });

  const mesAtual = new Date();
  const inicioMes = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1).getTime();
  const noMes = financeiro.filter((f) => +new Date(f.vencimento) >= inicioMes);
  const entradas = noMes.filter((f) => f.tipo === "receber").reduce((a, f) => a + f.valor, 0);
  const saidas = noMes.filter((f) => f.tipo === "pagar").reduce((a, f) => a + f.valor, 0);
  const saldo = entradas - saidas;

  const estoqueBaixo = produtos.filter(isEstoqueBaixo);
  const ultimas = [...orcamentos]
    .sort((a, b) => +new Date(b.data_criacao) - +new Date(a.data_criacao))
    .slice(0, 5);

  if (lo || lf) {
    return <p className="text-sm text-muted-foreground">Carregando dashboard…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Saldo do mês</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatBRL(saldo)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Entradas {formatBRL(entradas)} · Saídas {formatBRL(saidas)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">OS ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {orcamentos.filter((o) => o.status !== "entregue").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Estoque baixo</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold flex items-center gap-2">
              {estoqueBaixo.length}
              {estoqueBaixo.length > 0 && <AlertTriangle className="h-5 w-5 text-destructive" />}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Peças cadastradas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{produtos.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {totaisPorStatus.map(({ status, count, total }) => (
          <Card key={status} className={cn("border", accentMap[status] ?? "")}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm">{getStatusLabel(status, config.id)}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{formatBRL(total)}</p>
              <p className="text-xs text-muted-foreground">{count} OS</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {estoqueBaixo.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base">Alertas de estoque</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {estoqueBaixo.map((p) => (
              <Badge key={p.id} variant="destructive">
                {p.nome}: {p.quantidade} un.
              </Badge>
            ))}
            <Link to="/estoque" className="text-sm text-primary hover:underline ml-2">
              Ver estoque
            </Link>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">Últimas OS</h2>
        <div className="space-y-2">
          {ultimas.map((o) => (
            <MobileCard key={o.id} accent="primary">
              <Link to="/orcamentos/$id" params={{ id: o.id }} className="block">
                <div className="flex justify-between gap-2">
                  <div>
                    <p className="font-medium">{o.nome_projeto}</p>
                    <p className="text-xs text-muted-foreground font-mono">{o.numero}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(o.data_criacao)}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="secondary">{getStatusLabel(o.status, config.id)}</Badge>
                    <p className="text-sm font-semibold mt-1">{formatBRL(calcTotal(o))}</p>
                  </div>
                </div>
              </Link>
            </MobileCard>
          ))}
        </div>
      </div>
    </div>
  );
}
