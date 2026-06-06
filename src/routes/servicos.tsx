import { createFileRoute } from "@tanstack/react-router";
import { pageTitle } from "@/lib/app-brand";
import { useState } from "react";
import { useServicos, useUpsertServico, useRemoveServico } from "@/lib/store";
import type { Servico, UnidadeServico } from "@/lib/types";
import { formatBRL } from "@/lib/types";
import { ensureUuid, newId } from "@/lib/id";
import { CrudDialog } from "@/components/crud-dialog";
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
import { DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ListCard } from "@/components/list-card";
import { ConfirmDialog } from "@/components/confirm-dialog";

export const Route = createFileRoute("/servicos")({
  head: () => ({ meta: [{ title: pageTitle("Serviços") }] }),
  component: ServicosPage,
});

const empty = (): Servico => ({
  id: newId(),
  nome: "",
  valor_padrao: 0,
  unidade: "serviço",
  ativo: true,
});

const UNIDADES: UnidadeServico[] = ["serviço", "hora", "mensalidade", "pacote"];

function ServicosPage() {
  const { data: servicos = [], isLoading } = useServicos();
  const upsert = useUpsertServico();
  const remove = useRemoveServico();
  const [editing, setEditing] = useState<Servico | null>(null);
  const [toDelete, setToDelete] = useState<Servico | null>(null);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Serviços"
        description={isLoading ? "Carregando…" : `${servicos.length} cadastrados`}
      >
        <Button type="button" className="w-full sm:w-auto" onClick={() => setEditing(empty())}>
          <Plus className="h-4 w-4 mr-1" /> Novo serviço
        </Button>
      </PageHeader>

      <div className="md:hidden space-y-3">
        {servicos.map((s) => (
          <ListCard key={s.id}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium">{s.nome}</div>
                {s.descricao && (
                  <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                    {s.descricao}
                  </div>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <span>{s.unidade}</span>
                  <span>·</span>
                  <span className="font-medium text-foreground">{formatBRL(s.valor_padrao)}</span>
                </div>
                <Badge variant={s.ativo ? "default" : "secondary"} className="mt-2 text-[10px]">
                  {s.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <div className="flex shrink-0 gap-0.5">
                <Button type="button" size="icon" variant="ghost" onClick={() => setEditing(s)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button type="button" size="icon" variant="ghost" onClick={() => setToDelete(s)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </ListCard>
        ))}
      </div>

      <div className="hidden md:block rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Serviço</TableHead>
              <TableHead className="w-28">Valor</TableHead>
              <TableHead className="w-24">Status</TableHead>
              <TableHead className="w-24 text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {servicos.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="font-medium">{s.nome}</div>
                  {s.descricao && (
                    <div className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {s.descricao}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground mt-1">{s.unidade}</div>
                </TableCell>
                <TableCell className="font-medium whitespace-nowrap">
                  {formatBRL(s.valor_padrao)}
                </TableCell>
                <TableCell>
                  <Badge variant={s.ativo ? "default" : "secondary"} className="text-[10px]">
                    {s.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap">
                  <Button type="button" size="icon" variant="ghost" onClick={() => setEditing(s)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button type="button" size="icon" variant="ghost" onClick={() => setToDelete(s)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Excluir serviço?"
        description={toDelete ? `O serviço "${toDelete.nome}" será removido permanentemente.` : ""}
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => {
          if (toDelete) remove.mutate(toDelete.id);
        }}
      />

      <CrudDialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        {editing && (
          <ServicoForm
            key={editing.id}
            value={editing}
            onSave={(s) => upsert.mutate(s, { onSuccess: () => setEditing(null) })}
          />
        )}
      </CrudDialog>
    </div>
  );
}

function ServicoForm({ value, onSave }: { value: Servico; onSave: (s: Servico) => void }) {
  const [s, setS] = useState(value);
  return (
    <>
      <DialogHeader>
        <DialogTitle>{value.nome ? "Editar serviço" : "Novo serviço"}</DialogTitle>
      </DialogHeader>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="col-span-2">
          <Label>Nome*</Label>
          <Input value={s.nome} onChange={(e) => setS({ ...s, nome: e.target.value })} />
        </div>
        <div className="col-span-2">
          <Label>Descrição</Label>
          <Textarea
            value={s.descricao || ""}
            onChange={(e) => setS({ ...s, descricao: e.target.value })}
          />
        </div>
        <div>
          <Label>Unidade</Label>
          <Select
            value={s.unidade}
            onValueChange={(v) => setS({ ...s, unidade: v as UnidadeServico })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {UNIDADES.map((u) => (
                <SelectItem key={u} value={u}>
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Valor padrão (R$)</Label>
          <Input
            type="number"
            step="0.01"
            value={s.valor_padrao}
            onChange={(e) => setS({ ...s, valor_padrao: parseFloat(e.target.value) || 0 })}
          />
        </div>
        <div className="col-span-2 flex items-center gap-3">
          <Switch checked={s.ativo} onCheckedChange={(v) => setS({ ...s, ativo: v })} />
          <Label>Ativo</Label>
        </div>
        <div className="col-span-2">
          <Label>Observações</Label>
          <Textarea
            value={s.observacoes || ""}
            onChange={(e) => setS({ ...s, observacoes: e.target.value })}
          />
        </div>
      </div>
      <DialogFooter>
        <Button type="button" onClick={() => s.nome && onSave({ ...s, id: ensureUuid(s.id) })}>
          Salvar
        </Button>
      </DialogFooter>
    </>
  );
}
