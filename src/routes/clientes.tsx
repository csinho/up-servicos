import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "@/lib/store";
import type { Cliente } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2 } from "lucide-react";

export const Route = createFileRoute("/clientes")({
  head: () => ({ meta: [{ title: "Clientes — Freela OS" }] }),
  component: ClientesPage,
});

const empty = (): Cliente => ({
  id: crypto.randomUUID(),
  nome: "",
  endereco: {},
  created_at: new Date().toISOString(),
});

function ClientesPage() {
  const { clientes, upsertCliente, removeCliente } = useApp();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Cliente | null>(null);

  const filtered = clientes.filter((c) => c.nome.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clientes</h1>
          <p className="text-sm text-muted-foreground">{clientes.length} cadastrados</p>
        </div>
        <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(empty())}><Plus className="h-4 w-4 mr-1" /> Novo cliente</Button>
          </DialogTrigger>
          {editing && <ClienteForm value={editing} onSave={(c) => { upsertCliente(c); setEditing(null); }} />}
        </Dialog>
      </div>

      <Input placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.nome}</TableCell>
                <TableCell>{c.telefone || c.email || "—"}</TableCell>
                <TableCell>{c.documento || "—"}</TableCell>
                <TableCell>{c.endereco.cidade ? `${c.endereco.cidade}/${c.endereco.estado || ""}` : "—"}</TableCell>
                <TableCell className="text-right">
                  <Button size="icon" variant="ghost" onClick={() => setEditing(c)}><Pencil className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" onClick={() => confirm("Remover cliente?") && removeCliente(c.id)}><Trash2 className="h-4 w-4" /></Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow><TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">Nenhum cliente.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function ClienteForm({ value, onSave }: { value: Cliente; onSave: (c: Cliente) => void }) {
  const [c, setC] = useState(value);
  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader><DialogTitle>{value.nome ? "Editar cliente" : "Novo cliente"}</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Label>Nome*</Label><Input value={c.nome} onChange={(e) => setC({ ...c, nome: e.target.value })} /></div>
        <div><Label>Telefone</Label><Input value={c.telefone || ""} onChange={(e) => setC({ ...c, telefone: e.target.value })} /></div>
        <div><Label>E-mail</Label><Input value={c.email || ""} onChange={(e) => setC({ ...c, email: e.target.value })} /></div>
        <div><Label>CPF/CNPJ</Label><Input value={c.documento || ""} onChange={(e) => setC({ ...c, documento: e.target.value })} /></div>
        <div><Label>CEP</Label><Input value={c.endereco.cep || ""} onChange={(e) => setC({ ...c, endereco: { ...c.endereco, cep: e.target.value } })} /></div>
        <div className="col-span-2"><Label>Rua</Label><Input value={c.endereco.rua || ""} onChange={(e) => setC({ ...c, endereco: { ...c.endereco, rua: e.target.value } })} /></div>
        <div><Label>Número</Label><Input value={c.endereco.numero || ""} onChange={(e) => setC({ ...c, endereco: { ...c.endereco, numero: e.target.value } })} /></div>
        <div><Label>Bairro</Label><Input value={c.endereco.bairro || ""} onChange={(e) => setC({ ...c, endereco: { ...c.endereco, bairro: e.target.value } })} /></div>
        <div><Label>Cidade</Label><Input value={c.endereco.cidade || ""} onChange={(e) => setC({ ...c, endereco: { ...c.endereco, cidade: e.target.value } })} /></div>
        <div><Label>Estado</Label><Input value={c.endereco.estado || ""} onChange={(e) => setC({ ...c, endereco: { ...c.endereco, estado: e.target.value } })} /></div>
        <div className="col-span-2"><Label>Observações</Label><Textarea value={c.observacoes || ""} onChange={(e) => setC({ ...c, observacoes: e.target.value })} /></div>
      </div>
      <DialogFooter>
        <Button onClick={() => c.nome && onSave(c)}>Salvar</Button>
      </DialogFooter>
    </DialogContent>
  );
}
