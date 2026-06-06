import { createFileRoute, Link } from "@tanstack/react-router";
import { pageTitle } from "@/lib/app-brand";
import { useState } from "react";
import { useFinanceiro, useClientes, useOrcamentos } from "@/lib/store";
import type { TipoFinanceiro } from "@/lib/types";
import { formatBRL, formatCalendarDate } from "@/lib/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { ListCard } from "@/components/list-card";

export const Route = createFileRoute("/financeiro")({
  head: () => ({ meta: [{ title: pageTitle("Financeiro") }] }),
  component: FinanceiroPage,
});

const statusVariant = {
  pago: "default",
  pendente: "secondary",
  parcial: "outline",
  atrasado: "destructive",
} as const;

function FinanceiroPage() {
  const { data: financeiro = [], isLoading } = useFinanceiro();
  const { data: clientes = [] } = useClientes();
  const { data: orcamentos = [] } = useOrcamentos();
  const [filter, setFilter] = useState<"todos" | TipoFinanceiro>("todos");

  const list = financeiro
    .filter((f) => f.orcamento_id)
    .filter((f) => filter === "todos" || f.tipo === filter);

  const totals = {
    receber: financeiro
      .filter((f) => f.tipo === "receber" && f.status !== "pago" && f.orcamento_id)
      .reduce((a, f) => a + f.valor, 0),
    recebido: financeiro
      .filter((f) => f.tipo === "receber" && f.status === "pago" && f.orcamento_id)
      .reduce((a, f) => a + f.valor, 0),
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Financeiro"
        description={
          <>
            <p>
              Lançamentos gerados automaticamente quando o orçamento vira pedido (em produção).
              Marcados como pagos ao entregar.
            </p>
            <p className="mt-1">
              {isLoading
                ? "Carregando…"
                : `A receber: ${formatBRL(totals.receber)} · Recebido: ${formatBRL(totals.recebido)}`}
            </p>
          </>
        }
      >
        <Select value={filter} onValueChange={(v) => setFilter(v as "todos" | TipoFinanceiro)}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="receber">A receber</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      <div className="md:hidden space-y-3">
        {list.map((f) => {
          const cli = clientes.find((c) => c.id === f.cliente_id);
          const ped = orcamentos.find((o) => o.id === f.orcamento_id);
          return (
            <ListCard key={f.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium text-sm">{f.descricao}</div>
                  {ped && (
                    <Link
                      to="/orcamentos/$id"
                      params={{ id: ped.id }}
                      className="text-xs font-mono text-primary hover:underline inline-block mt-0.5"
                    >
                      {ped.numero}
                    </Link>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">{cli?.nome ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">
                    Venc.: {formatCalendarDate(f.vencimento)}
                  </div>
                  <Badge variant={statusVariant[f.status]} className="mt-2 text-[10px]">
                    {f.status}
                  </Badge>
                </div>
                <div className="text-sm font-semibold shrink-0">{formatBRL(f.valor)}</div>
              </div>
            </ListCard>
          );
        })}
        {list.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            Nenhum lançamento. Mova um orçamento para &quot;Em produção&quot; para gerar a entrada.
          </p>
        )}
      </div>

      <div className="hidden md:block rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Pedido / Cliente</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-36">Prazo</TableHead>
              <TableHead className="text-right w-28">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((f) => {
              const cli = clientes.find((c) => c.id === f.cliente_id);
              const ped = orcamentos.find((o) => o.id === f.orcamento_id);
              return (
                <TableRow key={f.id}>
                  <TableCell>
                    {ped ? (
                      <Link
                        to="/orcamentos/$id"
                        params={{ id: ped.id }}
                        className="text-xs font-mono text-primary hover:underline"
                      >
                        {ped.numero}
                      </Link>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                    <div className="text-sm mt-0.5">{cli?.nome ?? "—"}</div>
                  </TableCell>
                  <TableCell className="max-w-[14rem]">
                    <span className="line-clamp-2">{f.descricao}</span>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{formatCalendarDate(f.vencimento)}</div>
                    <Badge variant={statusVariant[f.status]} className="mt-1 text-[10px]">
                      {f.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap">
                    {formatBRL(f.valor)}
                  </TableCell>
                </TableRow>
              );
            })}
            {list.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                  Nenhum lançamento. Mova um orçamento para &quot;Em produção&quot; para gerar a
                  entrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
