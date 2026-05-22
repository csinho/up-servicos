import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "@/lib/store";
import type { Financeiro, StatusFinanceiro, TipoFinanceiro } from "@/lib/types";
import { formatBRL, formatDate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/financeiro")({
  head: () => ({ meta: [{ title: "Financeiro — Freela OS" }] }),
  component: FinanceiroPage,
});

const empty = (): Financeiro => ({
  id: crypto.randomUUID(),
  tipo: "receber",
  descricao: "",
  valor: 0,
  vencimento: new Date().toISOString(),
  status: "pendente",
});

const statusVariant: Record<StatusFinanceiro, "default" | "secondary" | "destructive" | "outline"> = {
  pago: "default",
  pendente: "secondary",
  parcial: "outline",
  atrasado: "destructive",
};

function FinanceiroPage() {
  const { financeiro, clientes, orcamentos, upsertFinanceiro, removeFinanceiro } = useApp();
  const [editing, setEditing] = useState<Financeiro | null>(null);
  const [filter, setFilter] = useState<"todos" | TipoFinanceiro>("todos");

  const list = financeiro.filter((f) => filter === "todos" || f.tipo === filter);

  const totals = {
    receber: financeiro.filter((f) => f.tipo === "receber" && f.status !== "pago").reduce((a, f) => a + f.valor, 0),
    pagar: financeiro.filter((f) => f.tipo === "pagar" && f.status !== "pago").reduce((a, f) => a + f.valor, 0),
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Financeiro</h1>
          <p className="text-sm text-muted-foreground">A receber: {formatBRL(totals.receber)} · A pagar: {formatBRL(totals.pagar)}</p>
        </div>
        <div className="flex gap-2">
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="receber">A receber</SelectItem>
              <SelectItem value="pagar">A pagar</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
            <DialogTrigger asChild><Button onClick={() => setEditing(empty())}><Plus className="h-4 w-4 mr-1" /> Lançamento</Button></DialogTrigger>
            {editing && <FinForm value={editing} onSave={(f) => { upsertFinanceiro(f); setEditing(null); }} />}
          </Dialog>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipo</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((f) => {
              const cli = clientes.find((c) => c.id === f.cliente_id);
              return (
                <TableRow key={f.id}>
                  <TableCell><Badge variant={f.tipo === "receber" ? "default" : "secondary"}>{f.tipo}</Badge></TableCell>
                  <TableCell>{f.descricao}</TableCell>
                  <TableCell>{cli?.nome ?? "—"}</TableCell>
                  <TableCell>{formatDate(f.vencimento)}</TableCell>
                  <TableCell><Badge variant={statusVariant[f.status]}>{f.status}</Badge></TableCell>
                  <TableCell className="text-right font-medium">{formatBRL(f.valor)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(f)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => confirm("Remover?") && removeFinanceiro(f.id)}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {list.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">Sem lançamentos.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function FinForm({ value, onSave }: { value: Financeiro; onSave: (f: Financeiro) => void }) {
  const { clientes, orcamentos } = useApp();
  const [f, setF] = useState(value);
  return (
    <DialogContent className="max-w-xl">
      <DialogHeader><DialogTitle>Lançamento financeiro</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Tipo</Label>
          <Select value={f.tipo} onValueChange={(v) => setF({ ...f, tipo: v as TipoFinanceiro })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="receber">A receber</SelectItem>
              <SelectItem value="pagar">A pagar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v as StatusFinanceiro })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="pago">Pago</SelectItem>
              <SelectItem value="parcial">Parcial</SelectItem>
              <SelectItem value="atrasado">Atrasado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2"><Label>Descrição</Label><Input value={f.descricao} onChange={(e) => setF({ ...f, descricao: e.target.value })} /></div>
        <div><Label>Valor</Label><Input type="number" step="0.01" value={f.valor} onChange={(e) => setF({ ...f, valor: parseFloat(e.target.value) || 0 })} /></div>
        <div><Label>Forma de pagamento</Label><Input value={f.forma_pagamento || ""} onChange={(e) => setF({ ...f, forma_pagamento: e.target.value })} /></div>
        <div><Label>Vencimento</Label><Input type="date" value={f.vencimento.slice(0, 10)} onChange={(e) => setF({ ...f, vencimento: new Date(e.target.value).toISOString() })} /></div>
        <div><Label>Pagamento</Label><Input type="date" value={f.pagamento?.slice(0, 10) || ""} onChange={(e) => setF({ ...f, pagamento: e.target.value ? new Date(e.target.value).toISOString() : undefined })} /></div>
        <div className="col-span-2">
          <Label>Cliente</Label>
          <Select value={f.cliente_id || ""} onValueChange={(v) => setF({ ...f, cliente_id: v || undefined })}>
            <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
            <SelectContent>{clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label>Orçamento vinculado</Label>
          <Select value={f.orcamento_id || ""} onValueChange={(v) => setF({ ...f, orcamento_id: v || undefined })}>
            <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
            <SelectContent>{orcamentos.map((o) => <SelectItem key={o.id} value={o.id}>{o.numero} — {o.nome_projeto}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="col-span-2"><Label>Observações</Label><Textarea value={f.observacoes || ""} onChange={(e) => setF({ ...f, observacoes: e.target.value })} /></div>
      </div>
      <DialogFooter><Button onClick={() => f.descricao && onSave(f)}>Salvar</Button></DialogFooter>
    </DialogContent>
  );
}
