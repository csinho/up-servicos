import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type ComponentType } from "react";
import { useApp, novoItem } from "@/lib/store";
import type { Cliente, Empresa, Orcamento, OrcamentoItem, StatusOrcamento } from "@/lib/types";
import { calcSubtotal, calcTotal, formatBRL, STATUS_LABEL, STATUS_ORDER } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Plus, Trash2, Download, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type PdfProps = { orcamento: Orcamento; empresa: Empresa; cliente?: Cliente };

function ClientOnlyPDF({ kind, ...props }: PdfProps & { kind: "preview" | "download" }) {
  const [Comp, setComp] = useState<ComponentType<PdfProps> | null>(null);
  useEffect(() => {
    import("@/components/pdf-preview").then((m) =>
      setComp(() => (kind === "preview" ? m.PDFPreview : m.DownloadBtn))
    );
  }, [kind]);
  if (!Comp) {
    return kind === "download" ? (
      <Button variant="outline" disabled><Download className="h-4 w-4 mr-1" />PDF</Button>
    ) : (
      <div className="p-8 text-center text-sm text-muted-foreground">Carregando…</div>
    );
  }
  return <Comp {...props} />;
}

export const Route = createFileRoute("/orcamentos/$id")({
  head: () => ({ meta: [{ title: "Orçamento — Freela OS" }] }),
  component: OrcamentoDetail,
});

function OrcamentoDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { orcamentos, clientes, servicos, empresa, upsertOrcamento, removeOrcamento, moveOrcamento } = useApp();
  const original = orcamentos.find((o) => o.id === id);
  const [o, setO] = useState<Orcamento | null>(original ?? null);
  const [preview, setPreview] = useState(false);

  if (!original || !o) {
    return (
      <div className="space-y-4">
        <p>Orçamento não encontrado.</p>
        <Button onClick={() => navigate({ to: "/orcamentos" })}>Voltar</Button>
      </div>
    );
  }

  const subtotal = calcSubtotal(o.itens);
  const total = calcTotal(o);

  const addItem = (servicoId?: string) => {
    const sv = servicos.find((s) => s.id === servicoId);
    setO({
      ...o,
      itens: [
        ...o.itens,
        novoItem(sv ? { servico_id: sv.id, nome: sv.nome, descricao: sv.descricao, unidade: sv.unidade, valor_unitario: sv.valor_padrao } : {}),
      ],
    });
  };

  const updateItem = (i: number, patch: Partial<OrcamentoItem>) => {
    const itens = [...o.itens];
    itens[i] = { ...itens[i], ...patch };
    setO({ ...o, itens });
  };

  const removeItem = (i: number) => setO({ ...o, itens: o.itens.filter((_, idx) => idx !== i) });

  const save = () => { upsertOrcamento(o); };
  const saveAndExit = () => { upsertOrcamento(o); navigate({ to: "/orcamentos" }); };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/orcamentos" })}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="text-xs text-muted-foreground font-mono">{o.numero}</div>
            <h1 className="text-2xl font-semibold">{o.nome_projeto || "Sem nome"}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={o.status} onValueChange={(v) => { setO({ ...o, status: v as StatusOrcamento }); moveOrcamento(o.id, v as StatusOrcamento); }}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>{STATUS_ORDER.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}</SelectContent>
          </Select>
          <Button variant="outline" onClick={() => { save(); setPreview(true); }}><Eye className="h-4 w-4 mr-1" /> Visualizar PDF</Button>
          <Suspense fallback={<Button variant="outline" disabled><Download className="h-4 w-4 mr-1" />PDF</Button>}>
            <DownloadButton orcamento={o} empresa={empresa} cliente={clientes.find((c) => c.id === o.cliente_id)!} />
          </Suspense>
          <Button onClick={saveAndExit}>Salvar</Button>
          <Button variant="ghost" size="icon" onClick={() => confirm("Excluir orçamento?") && (removeOrcamento(o.id), navigate({ to: "/orcamentos" }))}><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Dados do projeto</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label>Nome do projeto</Label>
              <Input value={o.nome_projeto} onChange={(e) => setO({ ...o, nome_projeto: e.target.value })} />
            </div>
            <div className="col-span-2">
              <Label>Cliente</Label>
              <Select value={o.cliente_id} onValueChange={(v) => setO({ ...o, cliente_id: v })}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{clientes.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Descrição</Label>
              <Textarea rows={3} value={o.descricao || ""} onChange={(e) => setO({ ...o, descricao: e.target.value })} />
            </div>
            <div><Label>Forma de pagamento</Label><Input value={o.forma_pagamento || ""} onChange={(e) => setO({ ...o, forma_pagamento: e.target.value })} /></div>
            <div><Label>Prazo de entrega</Label><Input type="date" value={o.prazo_entrega?.slice(0, 10) || ""} onChange={(e) => setO({ ...o, prazo_entrega: e.target.value ? new Date(e.target.value).toISOString() : undefined })} /></div>
            <div><Label>Validade da proposta</Label><Input type="date" value={o.validade?.slice(0, 10) || ""} onChange={(e) => setO({ ...o, validade: e.target.value ? new Date(e.target.value).toISOString() : undefined })} /></div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Totais</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatBRL(subtotal)}</span></div>
            <div className="flex items-center gap-2"><Label className="w-24">Desconto</Label><Input type="number" step="0.01" value={o.desconto} onChange={(e) => setO({ ...o, desconto: parseFloat(e.target.value) || 0 })} /></div>
            <div className="flex items-center gap-2"><Label className="w-24">Acréscimo</Label><Input type="number" step="0.01" value={o.acrescimo} onChange={(e) => setO({ ...o, acrescimo: parseFloat(e.target.value) || 0 })} /></div>
            <div className="border-t pt-3 flex justify-between text-lg font-semibold"><span>Total</span><span>{formatBRL(total)}</span></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Itens</CardTitle>
          <div className="flex gap-2">
            <Select onValueChange={(v) => addItem(v)}>
              <SelectTrigger className="w-56"><SelectValue placeholder="Adicionar do catálogo" /></SelectTrigger>
              <SelectContent>{servicos.filter((s) => s.ativo).map((s) => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}</SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => addItem()}><Plus className="h-4 w-4 mr-1" /> Item em branco</Button>
          </div>
        </CardHeader>
        <CardContent>
          {o.itens.length === 0 && <p className="text-sm text-muted-foreground">Nenhum item.</p>}
          <div className="space-y-3">
            {o.itens.map((it, i) => (
              <div key={it.id} className="grid grid-cols-12 gap-2 items-start border rounded-md p-3">
                <div className="col-span-12 md:col-span-4">
                  <Label className="text-xs">Serviço</Label>
                  <Input value={it.nome} onChange={(e) => updateItem(i, { nome: e.target.value })} />
                </div>
                <div className="col-span-12 md:col-span-4">
                  <Label className="text-xs">Descrição</Label>
                  <Input value={it.descricao || ""} onChange={(e) => updateItem(i, { descricao: e.target.value })} />
                </div>
                <div className="col-span-4 md:col-span-1">
                  <Label className="text-xs">Qtd</Label>
                  <Input type="number" step="0.01" value={it.quantidade} onChange={(e) => updateItem(i, { quantidade: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <Label className="text-xs">Valor un.</Label>
                  <Input type="number" step="0.01" value={it.valor_unitario} onChange={(e) => updateItem(i, { valor_unitario: parseFloat(e.target.value) || 0 })} />
                </div>
                <div className="col-span-3 md:col-span-1 text-right">
                  <Label className="text-xs">Total</Label>
                  <div className="text-sm font-medium pt-2">{formatBRL(it.quantidade * it.valor_unitario)}</div>
                </div>
                <div className="col-span-1 md:col-span-12 md:flex md:justify-end">
                  <Button size="icon" variant="ghost" onClick={() => removeItem(i)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Condições comerciais</CardTitle></CardHeader>
          <CardContent><Textarea rows={6} value={o.condicoes || ""} onChange={(e) => setO({ ...o, condicoes: e.target.value })} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Observações</CardTitle></CardHeader>
          <CardContent><Textarea rows={6} value={o.observacoes || ""} onChange={(e) => setO({ ...o, observacoes: e.target.value })} /></CardContent>
        </Card>
      </div>

      {o.historico.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Histórico</CardTitle></CardHeader>
          <CardContent className="space-y-1 text-sm">
            {o.historico.map((h, i) => (
              <div key={i} className="text-muted-foreground">
                {new Date(h.data).toLocaleString("pt-BR")} — {STATUS_LABEL[h.de]} → {STATUS_LABEL[h.para]}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="max-w-5xl h-[90vh] p-0 flex flex-col">
          <DialogHeader className="p-4 border-b"><DialogTitle>Pré-visualização do PDF</DialogTitle></DialogHeader>
          <div className="flex-1 min-h-0">
            {preview && (
              <Suspense fallback={<div className="p-8 text-center text-sm text-muted-foreground">Carregando…</div>}>
                <PDFViewerLazy orcamento={o} empresa={empresa} cliente={clientes.find((c) => c.id === o.cliente_id)!} />
              </Suspense>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
