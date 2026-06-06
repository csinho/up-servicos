import { createFileRoute } from "@tanstack/react-router";
import { pageTitle } from "@/lib/app-brand";
import { useMemo, useState } from "react";
import { useClientes, useUpsertCliente, useRemoveCliente } from "@/lib/store";
import type { Cliente } from "@/lib/types";
import { ensureUuid, newId } from "@/lib/id";
import { buscarCep } from "@/lib/viacep";
import {
  maskCep,
  maskTelefone,
  validateCep,
  validateEmail,
  validateTelefone,
} from "@/lib/validators";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ListCard } from "@/components/list-card";
import { ConfirmDialog } from "@/components/confirm-dialog";

export const Route = createFileRoute("/clientes")({
  head: () => ({ meta: [{ title: pageTitle("Clientes") }] }),
  component: ClientesPage,
});

const empty = (): Cliente => ({
  id: newId(),
  nome: "",
  endereco: {},
  created_at: new Date().toISOString(),
});

function FieldError({ msg }: { msg?: string | null }) {
  if (!msg) return null;
  return <p className="text-xs text-destructive mt-1">{msg}</p>;
}

function ClientesPage() {
  const { data: clientes = [], isLoading } = useClientes();
  const upsert = useUpsertCliente();
  const remove = useRemoveCliente();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [toDelete, setToDelete] = useState<Cliente | null>(null);

  const filtered = clientes.filter((c) => c.nome.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Clientes"
        description={isLoading ? "Carregando…" : `${clientes.length} cadastrados`}
      >
        <Button type="button" className="w-full sm:w-auto" onClick={() => setEditing(empty())}>
          <Plus className="h-4 w-4 mr-1" /> Novo cliente
        </Button>
      </PageHeader>

      <Input
        placeholder="Buscar..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full sm:max-w-sm"
      />

      <div className="md:hidden space-y-3">
        {filtered.map((c) => (
          <ListCard key={c.id}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium">{c.nome}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {c.telefone || c.email || "—"}
                </div>
                {c.documento && <div className="text-xs text-muted-foreground">{c.documento}</div>}
                {c.endereco.cidade && (
                  <div className="text-xs text-muted-foreground">
                    {c.endereco.cidade}/{c.endereco.estado || ""}
                  </div>
                )}
              </div>
              <div className="flex shrink-0 gap-0.5">
                <Button type="button" size="icon" variant="ghost" onClick={() => setEditing(c)}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setToDelete(c)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </ListCard>
        ))}
        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">Nenhum cliente.</p>
        )}
      </div>

      <div className="hidden md:block rounded-md border bg-card">
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
                <TableCell>
                  {c.endereco.cidade ? `${c.endereco.cidade}/${c.endereco.estado || ""}` : "—"}
                </TableCell>
                <TableCell className="text-right">
                  <Button type="button" size="icon" variant="ghost" onClick={() => setEditing(c)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => setToDelete(c)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                  Nenhum cliente.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(open) => !open && setToDelete(null)}
        title="Excluir cliente?"
        description={
          toDelete
            ? `O cliente "${toDelete.nome}" será removido permanentemente. Orçamentos vinculados podem ficar sem cliente.`
            : ""
        }
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => {
          if (toDelete) remove.mutate(toDelete.id);
        }}
      />

      <CrudDialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
        className="max-w-3xl"
      >
        {editing && (
          <ClienteForm
            key={editing.id}
            value={editing}
            onSave={(c) => upsert.mutate(c, { onSuccess: () => setEditing(null) })}
          />
        )}
      </CrudDialog>
    </div>
  );
}

function ClienteForm({ value, onSave }: { value: Cliente; onSave: (c: Cliente) => void }) {
  const [c, setC] = useState(value);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepErro, setCepErro] = useState<string | null>(null);

  const telErro = useMemo(() => validateTelefone(c.telefone || ""), [c.telefone]);
  const emailErro = useMemo(() => validateEmail(c.email || ""), [c.email]);
  const cepErroFmt = useMemo(() => validateCep(c.endereco.cep || ""), [c.endereco.cep]);

  const onCepChange = async (raw: string) => {
    const masked = maskCep(raw);
    setC((cur) => ({ ...cur, endereco: { ...cur.endereco, cep: masked } }));
    setCepErro(null);
    const digits = masked.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setCepLoading(true);
    try {
      const data = await buscarCep(masked);
      if (!data) {
        setCepErro("CEP não encontrado");
        return;
      }
      setC((cur) => ({
        ...cur,
        endereco: {
          ...cur.endereco,
          cep: data.cep || masked,
          rua: data.logradouro || cur.endereco.rua,
          bairro: data.bairro || cur.endereco.bairro,
          cidade: data.localidade || cur.endereco.cidade,
          estado: data.uf || cur.endereco.estado,
          complemento: data.complemento || cur.endereco.complemento,
        },
      }));
    } catch {
      setCepErro("Erro ao buscar CEP. Tente novamente.");
    } finally {
      setCepLoading(false);
    }
  };

  const podeSalvar = !!c.nome.trim() && !telErro && !emailErro && !cepErroFmt && !cepErro;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{value.nome ? "Editar cliente" : "Novo cliente"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-6">
        <div className="space-y-4">
          <p className="text-sm font-medium">Dados do cliente</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2 space-y-1.5">
              <Label>Nome*</Label>
              <Input value={c.nome} onChange={(e) => setC({ ...c, nome: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input
                value={c.telefone || ""}
                onChange={(e) => setC({ ...c, telefone: maskTelefone(e.target.value) })}
                placeholder="(71) 9 9675-5745"
                aria-invalid={!!telErro}
                className={telErro ? "border-destructive" : ""}
              />
              <FieldError msg={telErro} />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input
                type="email"
                value={c.email || ""}
                onChange={(e) => setC({ ...c, email: e.target.value })}
                placeholder="contato@email.com"
                aria-invalid={!!emailErro}
                className={emailErro ? "border-destructive" : ""}
              />
              <FieldError msg={emailErro} />
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <Label>CPF/CNPJ</Label>
              <Input
                value={c.documento || ""}
                onChange={(e) => setC({ ...c, documento: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="space-y-4 border-t pt-5">
          <p className="text-sm font-medium">Endereço</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>CEP</Label>
              <Input
                value={c.endereco.cep || ""}
                onChange={(e) => onCepChange(e.target.value)}
                placeholder="00000-000"
                inputMode="numeric"
                disabled={cepLoading}
                aria-invalid={!!(cepErro || cepErroFmt)}
                className={cepErro || cepErroFmt ? "border-destructive" : ""}
              />
              {cepLoading && (
                <p className="text-xs text-muted-foreground mt-1">Buscando endereço…</p>
              )}
              <FieldError msg={cepErroFmt || cepErro} />
            </div>
            <div className="hidden md:block" />
            <div className="md:col-span-2 space-y-1.5">
              <Label>Rua</Label>
              <Input
                value={c.endereco.rua || ""}
                onChange={(e) => setC({ ...c, endereco: { ...c.endereco, rua: e.target.value } })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Número</Label>
              <Input
                value={c.endereco.numero || ""}
                onChange={(e) =>
                  setC({ ...c, endereco: { ...c.endereco, numero: e.target.value } })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Bairro</Label>
              <Input
                value={c.endereco.bairro || ""}
                onChange={(e) =>
                  setC({ ...c, endereco: { ...c.endereco, bairro: e.target.value } })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Cidade</Label>
              <Input
                value={c.endereco.cidade || ""}
                onChange={(e) =>
                  setC({ ...c, endereco: { ...c.endereco, cidade: e.target.value } })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>UF</Label>
              <Input
                value={c.endereco.estado || ""}
                maxLength={2}
                onChange={(e) =>
                  setC({ ...c, endereco: { ...c.endereco, estado: e.target.value.toUpperCase() } })
                }
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5 border-t pt-5">
          <Label>Observações</Label>
          <Textarea
            rows={3}
            value={c.observacoes || ""}
            onChange={(e) => setC({ ...c, observacoes: e.target.value })}
          />
        </div>
      </div>
      <DialogFooter>
        <Button
          type="button"
          disabled={!podeSalvar}
          onClick={() => podeSalvar && onSave({ ...c, id: ensureUuid(c.id) })}
        >
          Salvar
        </Button>
      </DialogFooter>
    </>
  );
}
