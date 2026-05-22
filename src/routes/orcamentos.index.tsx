import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useApp, gerarNumeroOrcamento } from "@/lib/store";
import type { Orcamento } from "@/lib/types";
import { calcTotal, formatBRL, formatDate, STATUS_LABEL } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/orcamentos/")({
  head: () => ({ meta: [{ title: "Orçamentos — Freela OS" }] }),
  component: OrcamentosList,
});

function OrcamentosList() {
  const { orcamentos, clientes, empresa, upsertOrcamento } = useApp();
  const navigate = useNavigate();

  const novo = () => {
    const o: Orcamento = {
      id: crypto.randomUUID(),
      numero: gerarNumeroOrcamento(orcamentos),
      cliente_id: clientes[0]?.id || "",
      nome_projeto: "Novo projeto",
      status: "orcamento",
      itens: [],
      desconto: 0,
      acrescimo: 0,
      condicoes: empresa.condicoes_padrao,
      observacoes: empresa.observacoes_padrao,
      data_criacao: new Date().toISOString(),
      historico: [],
    };
    upsertOrcamento(o);
    navigate({ to: "/orcamentos/$id", params: { id: o.id } });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Orçamentos</h1>
          <p className="text-sm text-muted-foreground">{orcamentos.length} registros</p>
        </div>
        <Button onClick={novo}><Plus className="h-4 w-4 mr-1" /> Novo orçamento</Button>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
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
                <TableRow key={o.id} className="cursor-pointer" onClick={() => navigate({ to: "/orcamentos/$id", params: { id: o.id } })}>
                  <TableCell className="font-mono text-xs">{o.numero}</TableCell>
                  <TableCell className="font-medium">{o.nome_projeto}</TableCell>
                  <TableCell>{cli?.nome ?? "—"}</TableCell>
                  <TableCell><Badge variant="secondary">{STATUS_LABEL[o.status]}</Badge></TableCell>
                  <TableCell>{formatDate(o.data_criacao)}</TableCell>
                  <TableCell className="text-right font-medium">{formatBRL(calcTotal(o))}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
