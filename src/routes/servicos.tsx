import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "@/lib/store";
import type { Servico, UnidadeServico } from "@/lib/types";
import { formatBRL } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/servicos")({
  head: () => ({ meta: [{ title: "Serviços — Freela OS" }] }),
  component: ServicosPage,
});

const empty = (): Servico => ({ id: crypto.randomUUID(), nome: "", valor_padrao: 0, unidade: "serviço", ativo: true });

const UNIDADES: UnidadeServico[] = ["serviço", "hora", "mensalidade", "pacote"];

function ServicosPage() {
  const { servicos, upsertServico, removeServico } = useApp();
  const [editing, setEditing] = useState<Servico | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Serviços</h1>
          <p className="text-sm text-muted-foreground">{servicos.length} cadastrados</p>
        </div>
        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(empty())}><Plus className="h-4 w-4 mr-1" /> Novo serviço</Button>
          </DialogTrigger>
          {editing && <ServicoForm value={editing} onSave={(s) => { upsertServico(s); setEditing(null); }} />}
        </Dialog>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Valor padrão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {servicos.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="font-medium">{s.nome}</div>
                  <div className="text-xs text-muted-foreground">{s.descricao}</div>
                </TableCell>
                <TableCell>{s.unidade}</TableCell>
                <TableCell>{formatBRL(s.valor_padrao)}</TableCell>
                <TableCell><Badge variant={s.ativo ? "default" : "secondary"}>{s.ativo ? "Ativo" : "Inativo"}</Badge></TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(s)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => confirm("Remover?") && removeServico(s.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ServicoForm({ value, onSave }: { value: Servico; onSave: (s: Servico) => void }) {
  const [s, setS] = useState(value);
  return (
    <DialogContent>
      <DialogHeader><DialogTitle>{value.nome ? "Editar serviço" : "Novo serviço"}</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Label>Nome*</Label><Input value={s.nome} onChange={(e) => setS({ ...s, nome: e.target.value })} /></div>
        <div className="col-span-2"><Label>Descrição</Label><Textarea value={s.descricao || ""} onChange={(e) => setS({ ...s, descricao: e.target.value })} /></div>
        <div>
          <Label>Unidade</Label>
          <Select value={s.unidade} onValueChange={(v) => setS({ ...s, unidade: v as UnidadeServico })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{UNIDADES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>Valor padrão (R$)</Label><Input type="number" step="0.01" value={s.valor_padrao} onChange={(e) => setS({ ...s, valor_padrao: parseFloat(e.target.value) || 0 })} /></div>
        <div className="col-span-2 flex items-center gap-3"><Switch checked={s.ativo} onCheckedChange={(v) => setS({ ...s, ativo: v })} /><Label>Ativo</Label></div>
        <div className="col-span-2"><Label>Observações</Label><Textarea value={s.observacoes || ""} onChange={(e) => setS({ ...s, observacoes: e.target.value })} /></div>
      </div>
      <DialogFooter><Button onClick={() => s.nome && onSave(s)}>Salvar</Button></DialogFooter>
    </DialogContent>
  );
}
