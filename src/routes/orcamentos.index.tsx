import { createFileRoute, useNavigate } from "@tanstack/react-router";

import { useMemo, useState } from "react";

import { toast } from "sonner";

import { pageTitle } from "@/lib/app-brand";

import { billingBlocksMutation } from "@/lib/billing/state";

import { useEmpresaBilling } from "@/lib/billing/use-empresa-billing";

import { useOrcamentos, useClientes, useEmpresa, gerarNumeroOrcamento } from "@/lib/store";

import type { Orcamento } from "@/lib/types";

import { calcTotal, formatBRL, formatDate } from "@/lib/types";

import { getStatusLabel, labelDocumento } from "@/lib/empresa-categorias";

import { useEmpresaCategoria } from "@/hooks/use-empresa-categoria";

import { startNovoOrcamento } from "@/lib/novo-orcamento";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

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

import { MobileCard } from "@/components/mobile/mobile-card";

import { MobilePagination } from "@/components/mobile/mobile-pagination";

import { usePagination } from "@/hooks/use-pagination";



export const Route = createFileRoute("/orcamentos/")({

  head: () => ({ meta: [{ title: pageTitle("Orçamentos e pedidos") }] }),

  component: OrcamentosList,

});



function matchesOrcamentoSearch(
  o: Orcamento,
  term: string,
  categoria: string | undefined,
  clienteNome?: string,
): boolean {

  const statusLabel = getStatusLabel(o.status, categoria).toLowerCase();

  const docLabel = labelDocumento(o.status, categoria).toLowerCase();

  return (

    o.nome_projeto.toLowerCase().includes(term) ||

    o.numero.toLowerCase().includes(term) ||

    o.status.toLowerCase().includes(term) ||

    statusLabel.includes(term) ||

    docLabel.includes(term) ||

    (clienteNome?.toLowerCase().includes(term) ?? false)

  );

}



function OrcamentosList() {

  const { data: orcamentos = [], isLoading } = useOrcamentos();

  const { data: clientes = [] } = useClientes();

  const { data: empresa } = useEmpresa();

  const { categoria, config } = useEmpresaCategoria();

  const { billing } = useEmpresaBilling();

  const navigate = useNavigate();

  const [q, setQ] = useState("");



  const filtered = useMemo(() => {

    const term = q.trim().toLowerCase();

    if (!term) return orcamentos;

    return orcamentos.filter((o) => {

      const cli = clientes.find((c) => c.id === o.cliente_id);

      return matchesOrcamentoSearch(o, term, categoria, cli?.nome);

    });

  }, [orcamentos, clientes, q, categoria]);



  const pagination = usePagination(filtered, 10, q);



  const novo = () => {

    if (billing && billingBlocksMutation(billing)) {

      toast.error("Plano pendente — acesse Plano para pagar e criar novos orçamentos.");

      return;

    }

    const o = startNovoOrcamento(orcamentos, clientes, empresa, gerarNumeroOrcamento);

    void navigate({ to: "/orcamentos/$id", params: { id: o.id } });

  };



  return (

    <div className="space-y-4">

      <PageHeader

        title={config.orcamentosNavLabel}

        description={isLoading ? "Carregando…" : `${orcamentos.length} registros`}

      >

        <Button type="button" className="w-full sm:w-auto rounded-xl md:rounded-md" onClick={novo}>

          <Plus className="h-4 w-4 mr-1" /> {config.novoOrcamentoLabel}

        </Button>

      </PageHeader>



      <Input

        placeholder="Buscar por projeto, número, status..."

        value={q}

        onChange={(e) => setQ(e.target.value)}

        className="w-full sm:max-w-sm h-11 rounded-xl md:rounded-md"

      />



      <div className="md:hidden space-y-3">

        {pagination.pageItems.map((o) => {

          const cli = clientes.find((c) => c.id === o.cliente_id);

          const docLabel = labelDocumento(o.status, categoria);

          const statusLabel = getStatusLabel(o.status, categoria);

          return (

            <MobileCard

              key={o.id}

              onClick={() => void navigate({ to: "/orcamentos/$id", params: { id: o.id } })}

            >

              <div className="flex items-start justify-between gap-2">

                <div className="min-w-0 flex-1">

                  <div className="font-semibold truncate">{o.nome_projeto}</div>

                  <div className="text-xs text-muted-foreground font-mono mt-0.5">{o.numero}</div>

                  <div className="text-xs text-muted-foreground mt-1">{cli?.nome ?? "—"}</div>

                  <div className="flex flex-wrap gap-1.5 mt-2">

                    {docLabel !== statusLabel && (

                      <Badge variant="default" className="text-[10px]">

                        {docLabel}

                      </Badge>

                    )}

                    <Badge

                      variant={o.status === "orcamento" ? "outline" : "secondary"}

                      className="text-[10px]"

                    >

                      {statusLabel}

                    </Badge>

                  </div>

                </div>

                <div className="text-right shrink-0">

                  <div className="text-sm font-bold tabular-nums">{formatBRL(calcTotal(o))}</div>

                  <div className="text-[10px] text-muted-foreground mt-1">{formatDate(o.data_criacao)}</div>

                </div>

              </div>

            </MobileCard>

          );

        })}

        {filtered.length === 0 && !isLoading && (

          <p className="text-center text-sm text-muted-foreground py-8">Nenhum registro.</p>

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

            {filtered.map((o) => {

              const cli = clientes.find((c) => c.id === o.cliente_id);

              return (

                <TableRow

                  key={o.id}

                  className="cursor-pointer"

                  onClick={() => void navigate({ to: "/orcamentos/$id", params: { id: o.id } })}

                >

                  <TableCell>

                    <Badge

                      variant={o.status === "orcamento" ? "outline" : "default"}

                      className="text-[10px]"

                    >

                      {labelDocumento(o.status, categoria)}

                    </Badge>

                  </TableCell>

                  <TableCell className="font-mono text-xs">{o.numero}</TableCell>

                  <TableCell className="font-medium">{o.nome_projeto}</TableCell>

                  <TableCell>{cli?.nome ?? "—"}</TableCell>

                  <TableCell>

                    <Badge variant="secondary">{getStatusLabel(o.status, categoria)}</Badge>

                  </TableCell>

                  <TableCell>{formatDate(o.data_criacao)}</TableCell>

                  <TableCell className="text-right font-medium">{formatBRL(calcTotal(o))}</TableCell>

                </TableRow>

              );

            })}

            {filtered.length === 0 && !isLoading && (

              <TableRow>

                <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">

                  Nenhum registro.

                </TableCell>

              </TableRow>

            )}

          </TableBody>

        </Table>

      </div>

    </div>

  );

}

