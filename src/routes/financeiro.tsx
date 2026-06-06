import { createFileRoute, Link } from "@tanstack/react-router";
import { pageTitle } from "@/lib/app-brand";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useFinanceiro, useClientes, useOrcamentos, useUpsertFinanceiro, useRemoveFinanceiro } from "@/lib/store";
import type { Financeiro, TipoFinanceiro } from "@/lib/types";
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
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { MobileCard } from "@/components/mobile/mobile-card";
import { MobilePagination } from "@/components/mobile/mobile-pagination";
import { usePagination } from "@/hooks/use-pagination";
import { useEmpresaCategoria } from "@/hooks/use-empresa-categoria";
import { TransacaoManualDialog } from "@/components/financeiro/transacao-manual-dialog";

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
  const { config, isAssistenciaTecnica } = useEmpresaCategoria();
  const { data: financeiro = [], isLoading } = useFinanceiro();
  const { data: clientes = [] } = useClientes();
  const { data: orcamentos = [] } = useOrcamentos();
  const upsert = useUpsertFinanceiro();
  const remove = useRemoveFinanceiro();
  const [filter, setFilter] = useState<"todos" | TipoFinanceiro>("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Financeiro | null>(null);

  const list = useMemo(() => {
    let rows = financeiro;
    if (!isAssistenciaTecnica) {
      rows = rows.filter((f) => f.orcamento_id);
    }
    if (filter !== "todos") rows = rows.filter((f) => f.tipo === filter);
    return rows.sort((a, b) => +new Date(b.vencimento) - +new Date(a.vencimento));
  }, [financeiro, filter, isAssistenciaTecnica]);

  const pagination = usePagination(list, 10, filter);

  const totals = useMemo(() => {
    const base = isAssistenciaTecnica ? financeiro : financeiro.filter((f) => f.orcamento_id);
    const entradas = base.filter((f) => f.tipo === "receber").reduce((a, f) => a + f.valor, 0);
    const saidas = base.filter((f) => f.tipo === "pagar").reduce((a, f) => a + f.valor, 0);
    return {
      receber: base.filter((f) => f.tipo === "receber" && f.status !== "pago").reduce((a, f) => a + f.valor, 0),
      recebido: base.filter((f) => f.tipo === "receber" && f.status === "pago").reduce((a, f) => a + f.valor, 0),
      saldo: entradas - saidas,
      entradas,
      saidas,
    };
  }, [financeiro, isAssistenciaTecnica]);

  const labelCategoria = (f: Financeiro) =>
    config.caixaCategorias?.find((c) => c.value === f.categoria_caixa)?.label;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Financeiro"
        description={
          isAssistenciaTecnica ? (
            <p>
              Fluxo de caixa: lançamentos automáticos das OS e transações manuais.
              {isLoading
                ? " Carregando…"
                : ` Saldo: ${formatBRL(totals.saldo)} · Entradas: ${formatBRL(totals.entradas)} · Saídas: ${formatBRL(totals.saidas)}`}
            </p>
          ) : (
            <>
              <p>
                Lançamentos gerados automaticamente quando o orçamento vira pedido (em produção).
              </p>
              <p className="mt-1">
                {isLoading
                  ? "Carregando…"
                  : `A receber: ${formatBRL(totals.receber)} · Recebido: ${formatBRL(totals.recebido)}`}
              </p>
            </>
          )
        }
      >
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {isAssistenciaTecnica && (
            <Button
              type="button"
              onClick={() => {
                setEditing(null);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nova transação
            </Button>
          )}
          <Select value={filter} onValueChange={(v) => setFilter(v as "todos" | TipoFinanceiro)}>
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="receber">Entradas</SelectItem>
              {isAssistenciaTecnica && <SelectItem value="pagar">Saídas</SelectItem>}
            </SelectContent>
          </Select>
        </div>
      </PageHeader>

      <div className="md:hidden space-y-3">
        {pagination.pageItems.map((f) => (
          <FinanceiroMobileRow
            key={f.id}
            f={f}
            clientes={clientes}
            orcamentos={orcamentos}
            categoriaLabel={labelCategoria(f)}
            isAT={isAssistenciaTecnica}
            onEdit={() => {
              setEditing(f);
              setDialogOpen(true);
            }}
            onDelete={() => {
              if (f.origem !== "manual") return;
              if (confirm("Excluir esta transação?")) remove.mutate(f.id);
            }}
          />
        ))}
        {list.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">Nenhum lançamento.</p>
        )}
        <MobilePagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          hasPrev={pagination.hasPrev}
          hasNext={pagination.hasNext}
          onPrev={pagination.goPrev}
          onNext={pagination.goNext}
        />
      </div>

      <div className="hidden md:block rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Descrição</TableHead>
              {isAssistenciaTecnica && <TableHead>Categoria</TableHead>}
              <TableHead>Origem</TableHead>
              <TableHead className="w-36">Data</TableHead>
              <TableHead className="text-right w-28">Valor</TableHead>
              {isAssistenciaTecnica && <TableHead className="w-24" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((f) => {
              const ped = orcamentos.find((o) => o.id === f.orcamento_id);
              return (
                <TableRow key={f.id}>
                  <TableCell>
                    <span className="line-clamp-2">{f.descricao}</span>
                    {ped && (
                      <Link
                        to="/orcamentos/$id"
                        params={{ id: ped.id }}
                        className="text-xs font-mono text-primary hover:underline block mt-0.5"
                      >
                        {ped.numero}
                      </Link>
                    )}
                  </TableCell>
                  {isAssistenciaTecnica && (
                    <TableCell className="text-sm">{labelCategoria(f) ?? "—"}</TableCell>
                  )}
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {f.origem === "manual" ? "Manual" : "OS"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{formatCalendarDate(f.vencimento)}</div>
                    <Badge variant={statusVariant[f.status]} className="mt-1 text-[10px]">
                      {f.tipo === "pagar" ? "saída" : "entrada"} · {f.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium whitespace-nowrap">
                    {formatBRL(f.valor)}
                  </TableCell>
                  {isAssistenciaTecnica && (
                    <TableCell>
                      {f.origem === "manual" && (
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditing(f);
                              setDialogOpen(true);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              if (confirm("Excluir?")) remove.mutate(f.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
            {list.length === 0 && (
              <TableRow>
                <TableCell colSpan={isAssistenciaTecnica ? 6 : 4} className="text-center text-sm text-muted-foreground py-8">
                  Nenhum lançamento.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {isAssistenciaTecnica && (
        <TransacaoManualDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          transacao={editing}
          categorias={config.caixaCategorias ?? []}
          saving={upsert.isPending}
          onSave={(f) => {
            upsert.mutate(f, { onSuccess: () => setDialogOpen(false) });
          }}
        />
      )}
    </div>
  );
}

function FinanceiroMobileRow({
  f,
  clientes,
  orcamentos,
  categoriaLabel,
  isAT,
  onEdit,
  onDelete,
}: {
  f: Financeiro;
  clientes: { id: string; nome: string }[];
  orcamentos: { id: string; numero: string }[];
  categoriaLabel?: string;
  isAT: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cli = clientes.find((c) => c.id === f.cliente_id);
  const ped = orcamentos.find((o) => o.id === f.orcamento_id);
  return (
    <MobileCard>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="font-medium text-sm">{f.descricao}</div>
          {categoriaLabel && (
            <div className="text-xs text-muted-foreground">{categoriaLabel}</div>
          )}
          {ped && (
            <Link
              to="/orcamentos/$id"
              params={{ id: ped.id }}
              className="text-xs font-mono text-primary hover:underline inline-block mt-0.5"
            >
              {ped.numero}
            </Link>
          )}
          <div className="text-xs text-muted-foreground mt-1">{cli?.nome ?? ""}</div>
          <Badge variant={statusVariant[f.status]} className="mt-2 text-[10px]">
            {f.origem === "manual" ? "Manual" : "OS"} · {f.status}
          </Badge>
        </div>
        <div className="text-sm font-semibold shrink-0">{formatBRL(f.valor)}</div>
      </div>
      {isAT && f.origem === "manual" && (
        <div className="flex gap-2 mt-3">
          <Button type="button" variant="outline" size="sm" onClick={onEdit}>
            Editar
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onDelete}>
            Excluir
          </Button>
        </div>
      )}
    </MobileCard>
  );
}
