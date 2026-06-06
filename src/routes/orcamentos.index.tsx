import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { pageTitle } from "@/lib/app-brand";
import { billingBlocksMutation } from "@/lib/billing/state";
import { useEmpresaBilling } from "@/lib/billing/use-empresa-billing";
import { useOrcamentos, useClientes, useEmpresa, gerarNumeroOrcamento } from "@/lib/store";
import type { Orcamento } from "@/lib/types";
import { calcTotal, formatBRL, formatDate, labelDocumento, STATUS_LABEL } from "@/lib/types";
import { newId } from "@/lib/id";
import { saveOrcamentoDraft } from "@/lib/orcamento-draft";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ListCard } from "@/components/list-card";

export const Route = createFileRoute("/orcamentos/")({
  head: () => ({ meta: [{ title: pageTitle("Orçamentos e pedidos") }] }),
  component: OrcamentosList,
});

function OrcamentosList() {
  const { data: orcamentos = [], isLoading } = useOrcamentos();
  const { data: clientes = [] } = useClientes();
  const { data: empresa } = useEmpresa();
  const { billing } = useEmpresaBilling();
  const navigate = useNavigate();

  const novo = () => {
    if (billing && billingBlocksMutation(billing)) {
      toast.error("Plano pendente — acesse Plano para pagar e criar novos orçamentos.");
      return;
    }
    const o: Orcamento = {
      id: newId(),
      numero: gerarNumeroOrcamento(orcamentos),
      cliente_id: clientes[0]?.id ?? "",
      nome_projeto: "Novo projeto",
      status: "orcamento",
      itens: [],
      desconto_percentual: 0,
      acrescimo: 0,
      condicoes: empresa?.condicoes_padrao,
      observacoes: empresa?.observacoes_padrao,
      data_criacao: new Date().toISOString(),
      historico: [],
    };
    saveOrcamentoDraft(o);
    navigate({ to: "/orcamentos/$id", params: { id: o.id } });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Orçamentos e pedidos"
        description={isLoading ? "Carregando…" : `${orcamentos.length} registros`}
      >
        <Button type="button" className="w-full sm:w-auto" onClick={novo}>
          <Plus className="h-4 w-4 mr-1" /> Novo orçamento
        </Button>
      </PageHeader>

      <div className="md:hidden space-y-3">
        {orcamentos.map((o) => {
          const cli = clientes.find((c) => c.id === o.cliente_id);
          return (
            <ListCard
              key={o.id}
              onClick={() => navigate({ to: "/orcamentos/$id", params: { id: o.id } })}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate">{o.nome_projeto}</div>
                  <div className="text-xs text-muted-foreground font-mono mt-0.5">{o.numero}</div>
                  <div className="text-xs text-muted-foreground mt-1">{cli?.nome ?? "—"}</div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <Badge
                      variant={o.status === "orcamento" ? "outline" : "default"}
                      className="text-[10px]"
                    >
                      {labelDocumento(o.status)}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      {STATUS_LABEL[o.status]}
                    </Badge>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold">{formatBRL(calcTotal(o))}</div>
                  <div className="text-[10px] text-muted-foreground mt-1">
                    {formatDate(o.data_criacao)}
                  </div>
                </div>
              </div>
            </ListCard>
          );
        })}
        {orcamentos.length === 0 && !isLoading && (
          <p className="text-center text-sm text-muted-foreground py-8">Nenhum registro.</p>
        )}
      </div>

      <div className="hidden md:block rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Número</TableHead>
              <TableHead>Projeto</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criação</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orcamentos.map((o) => {
              const cli = clientes.find((c) => c.id === o.cliente_id);
              return (
                <TableRow
                  key={o.id}
                  className="cursor-pointer"
                  onClick={() => navigate({ to: "/orcamentos/$id", params: { id: o.id } })}
                >
                  <TableCell>
                    <Badge
                      variant={o.status === "orcamento" ? "outline" : "default"}
                      className="text-[10px]"
                    >
                      {labelDocumento(o.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{o.numero}</TableCell>
                  <TableCell className="font-medium">{o.nome_projeto}</TableCell>
                  <TableCell>{cli?.nome ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{STATUS_LABEL[o.status]}</Badge>
                  </TableCell>
                  <TableCell>{formatDate(o.data_criacao)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatBRL(calcTotal(o))}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
