import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect, type ComponentType } from "react";
import {
  useOrcamento,
  useClientes,
  useServicos,
  useEmpresa,
  useUpsertOrcamento,
  useRemoveOrcamento,
  useMoveOrcamento,
  novoItem,
} from "@/lib/store";
import { pageTitle } from "@/lib/app-brand";
import { clearOrcamentoDraft, loadOrcamentoDraft } from "@/lib/orcamento-draft";
import type { Cliente, Empresa, Orcamento, OrcamentoItem } from "@/lib/types";
import {
  calcDescontoValor,
  calcSubtotal,
  calcTotal,
  formatBRL,
  formatPercentLabel,
  dateInputFromTodayOrEmpty,
  dateInputToIso,
  garantiaUnidadeLabel,
  isDateInputOnOrAfterToday,
  isoToDateInput,
  todayDateInput,
  FORMAS_PAGAMENTO,
  GARANTIA_UNIDADES,
  type GarantiaUnidade,
} from "@/lib/types";
import { getStatusLabel, labelDocumento } from "@/lib/empresa-categorias";
import { useEmpresaCategoria } from "@/hooks/use-empresa-categoria";
import { OsAparelhoFields } from "@/components/os-assistencia/os-aparelho-fields";
import { ProdutoEstoquePicker } from "@/components/os-assistencia/produto-estoque-picker";
import { formatPercentInput, maskPercent, onlyDigits, parsePercent } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Trash2, Download, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { MobileFormFooter } from "@/components/mobile/mobile-form-footer";
import { ServicoCatalogoPicker } from "@/components/orcamentos/servico-catalogo-picker";

type PdfProps = { orcamento: Orcamento; empresa: Empresa; cliente?: Cliente };

function ClientOnlyPDF({ kind, ...props }: PdfProps & { kind: "preview" | "download" }) {
  const [Comp, setComp] = useState<ComponentType<PdfProps> | null>(null);
  useEffect(() => {
    import("@/components/pdf-preview").then((m) =>
      setComp(() => (kind === "preview" ? m.PDFPreview : m.DownloadBtn)),
    );
  }, [kind]);
  if (!Comp) {
    return kind === "download" ? (
      <Button variant="outline" disabled>
        <Download className="h-4 w-4 mr-1" />
        PDF
      </Button>
    ) : (
      <div className="p-8 text-center text-sm text-muted-foreground">Carregando…</div>
    );
  }
  return <Comp {...props} />;
}

export const Route = createFileRoute("/orcamentos/$id")({
  head: () => ({ meta: [{ title: pageTitle("Orçamento / Pedido") }] }),
  component: OrcamentoDetail,
});

function OrcamentoDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { data: original, isLoading } = useOrcamento(id);
  const { data: clientes = [] } = useClientes();
  const { data: servicos = [] } = useServicos();
  const { data: empresa } = useEmpresa();
  const { config, isAssistenciaTecnica } = useEmpresaCategoria();
  const upsert = useUpsertOrcamento();
  const remove = useRemoveOrcamento();
  const move = useMoveOrcamento();
  const [o, setO] = useState<Orcamento | null>(null);
  const [preview, setPreview] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState<number | null>(null);
  const [servicoSelecionado, setServicoSelecionado] = useState("");
  const [servicoSelectKey, setServicoSelectKey] = useState(0);
  const [dataMinima, setDataMinima] = useState<string | undefined>(undefined);

  useEffect(() => {
    setDataMinima(todayDateInput());
  }, []);

  useEffect(() => {
    if (original) {
      setO(original);
      clearOrcamentoDraft(id);
      return;
    }
    if (!isLoading) {
      const draft = loadOrcamentoDraft(id);
      if (draft) setO(draft);
    }
  }, [original, isLoading, id]);

  if (isLoading || !empresa) {
    return <p className="text-sm text-muted-foreground">Carregando…</p>;
  }

  if (!o) {
    return (
      <div className="space-y-4">
        <p>Registro não encontrado.</p>
        <Button type="button" onClick={() => navigate({ to: "/orcamentos" })}>
          Voltar
        </Button>
      </div>
    );
  }

  const subtotal = calcSubtotal(o.itens);
  const descontoValor = calcDescontoValor(subtotal, o.desconto_percentual);
  const total = calcTotal(o);
  const servicoCatalogoSelecionado = servicos.find((s) => s.id === servicoSelecionado) ?? null;

  const addItem = (servicoId?: string) => {
    const sv = servicos.find((s) => s.id === servicoId);
    setO({
      ...o,
      itens: [
        ...o.itens,
        novoItem(
          sv
            ? {
                servico_id: sv.id,
                nome: sv.nome,
                descricao: sv.descricao,
                unidade: sv.unidade,
                valor_unitario: sv.valor_padrao,
              }
            : {},
        ),
      ],
    });
  };

  const addServicoSelecionado = () => {
    if (!servicoSelecionado) return;
    addItem(servicoSelecionado);
    setServicoSelecionado("");
    setServicoSelectKey((k) => k + 1);
  };

  const updateItem = (i: number, patch: Partial<OrcamentoItem>) => {
    const itens = [...o.itens];
    itens[i] = { ...itens[i], ...patch };
    setO({ ...o, itens });
  };

  const removeItem = (i: number) => setO({ ...o, itens: o.itens.filter((_, idx) => idx !== i) });

  const moveItem = (from: number, to: number) => {
    if (to < 0 || to >= o.itens.length || from === to) return;
    const itens = [...o.itens];
    const [item] = itens.splice(from, 1);
    itens.splice(to, 0, item);
    setO({ ...o, itens });
  };

  const save = () =>
    upsert.mutate(o, {
      onSuccess: () => clearOrcamentoDraft(o.id),
    });
  const saveAndExit = () =>
    upsert.mutate(o, {
      onSuccess: () => {
        clearOrcamentoDraft(o.id);
        navigate({ to: "/orcamentos" });
      },
    });

  const onStatusChange = (v: string) => {
    setO({ ...o, status: v });
    move.mutate({ id: o.id, status: v });
  };

  return (
    <div className="space-y-5 pb-24 md:pb-0">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => navigate({ to: "/orcamentos" })}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground font-mono truncate">
              {labelDocumento(o.status, config.id)} · {o.numero}
            </div>
            <h1 className="text-xl font-semibold sm:text-2xl break-words">
              {o.nome_projeto || "Sem nome"}
            </h1>
          </div>
        </div>
        <div className="hidden md:flex flex-col gap-2 w-full md:flex-row md:flex-wrap md:items-center md:justify-end md:w-auto">
          <Button className="w-full md:w-auto" onClick={saveAndExit} disabled={upsert.isPending}>
            {upsert.isPending ? "Salvando…" : "Salvar"}
          </Button>
          <div className="grid grid-cols-2 gap-2 w-full md:flex md:w-auto md:gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                save();
                setPreview(true);
              }}
            >
              <Eye className="h-4 w-4 mr-1 shrink-0" />
              Visualizar PDF
            </Button>
            <div className="w-full [&_button]:w-full">
              <ClientOnlyPDF
                kind="download"
                orcamento={o}
                empresa={empresa}
                cliente={clientes.find((c) => c.id === o.cliente_id)}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 md:hidden">
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-xl"
          onClick={() => {
            save();
            setPreview(true);
          }}
        >
          <Eye className="h-4 w-4 mr-1 shrink-0" />
          Visualizar PDF
        </Button>
        <div className="[&_button]:w-full [&_button]:h-11 [&_button]:rounded-xl">
          <ClientOnlyPDF
            kind="download"
            orcamento={o}
            empresa={empresa}
            cliente={clientes.find((c) => c.id === o.cliente_id)}
          />
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="orcamento-status">
            {isAssistenciaTecnica ? "Status da OS" : "Etapa do projeto"}
          </Label>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {isAssistenciaTecnica
              ? "Acompanhe a OS do orçamento até a entrega do aparelho."
              : "Define em qual fase está este trabalho. Em Orçamento ele ainda é uma proposta."}
          </p>
        </div>
        <Select value={o.status} onValueChange={onStatusChange}>
          <SelectTrigger id="orcamento-status" className="w-full h-11 rounded-xl md:rounded-md md:max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {config.statusOrder.map((s) => (
              <SelectItem key={s} value={s}>
                {getStatusLabel(s, config.id)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isAssistenciaTecnica && o && <OsAparelhoFields o={o} onChange={(patch) => setO({ ...o, ...patch })} />}

      <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados do projeto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground">Identificação</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-1.5 lg:col-span-2">
                  <Label>Nome do projeto</Label>
                  <Input
                    value={o.nome_projeto}
                    onChange={(e) => setO({ ...o, nome_projeto: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 lg:col-span-2">
                  <Label>Cliente</Label>
                  <Select
                    value={o.cliente_id ?? ""}
                    onValueChange={(v) => setO({ ...o, cliente_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 lg:col-span-2">
                  <Label>Descrição</Label>
                  <Textarea
                    rows={3}
                    value={o.descricao || ""}
                    onChange={(e) => setO({ ...o, descricao: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="border-t pt-5 space-y-4">
              <p className="text-sm font-medium text-muted-foreground">Prazos e pagamento</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label>Forma de pagamento</Label>
                  <Select
                    value={o.forma_pagamento ?? ""}
                    onValueChange={(v) => setO({ ...o, forma_pagamento: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMAS_PAGAMENTO.map((fp) => (
                        <SelectItem key={fp} value={fp}>
                          {fp}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Prazo de entrega</Label>
                  <Input
                    type="date"
                    min={dataMinima}
                    value={dateInputFromTodayOrEmpty(o.prazo_entrega)}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (!v) {
                        setO({ ...o, prazo_entrega: undefined });
                        return;
                      }
                      if (!isDateInputOnOrAfterToday(v)) return;
                      setO({ ...o, prazo_entrega: dateInputToIso(v) });
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Validade da proposta</Label>
                  <Input
                    type="date"
                    min={dataMinima}
                    value={dateInputFromTodayOrEmpty(o.validade)}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (!v) {
                        setO({ ...o, validade: undefined });
                        return;
                      }
                      if (!isDateInputOnOrAfterToday(v)) return;
                      setO({ ...o, validade: dateInputToIso(v) });
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Garantia</Label>
                  <div className="flex gap-2">
                    <Input
                      className="w-20 shrink-0"
                      inputMode="numeric"
                      placeholder="0"
                      value={o.garantia_quantidade ?? ""}
                      onChange={(e) => {
                        const digits = onlyDigits(e.target.value);
                        setO({
                          ...o,
                          garantia_quantidade: digits ? parseInt(digits, 10) : undefined,
                          garantia_unidade: digits ? o.garantia_unidade ?? "dia" : o.garantia_unidade,
                        });
                      }}
                    />
                    <Select
                      value={o.garantia_unidade ?? "dia"}
                      onValueChange={(v) =>
                        setO({ ...o, garantia_unidade: v as GarantiaUnidade })
                      }
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue>
                          {garantiaUnidadeLabel(
                            o.garantia_unidade ?? "dia",
                            o.garantia_quantidade ?? 2,
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {GARANTIA_UNIDADES.map((u) => (
                          <SelectItem key={u} value={u}>
                            {garantiaUnidadeLabel(u, o.garantia_quantidade ?? 2)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      <Card>
        <CardHeader className="space-y-3">
          <CardTitle className="text-base">Itens</CardTitle>
          <ServicoCatalogoPicker
            servicos={servicos}
            value={servicoSelecionado}
            onValueChange={setServicoSelecionado}
            resetKey={servicoSelectKey}
          >
            {servicoSelecionado && (
              <Button
                type="button"
                size="sm"
                className="w-full shrink-0 md:w-auto"
                onClick={addServicoSelecionado}
              >
                <Plus className="h-4 w-4 mr-1" />
                Adicionar ao orçamento
                {servicoCatalogoSelecionado ? ` — ${servicoCatalogoSelecionado.nome}` : ""}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full shrink-0 md:w-auto"
              onClick={() => addItem()}
            >
              <Plus className="h-4 w-4 mr-1" /> Item em branco
            </Button>
          </ServicoCatalogoPicker>
          {isAssistenciaTecnica && (
            <div className="pt-2 border-t">
              <ProdutoEstoquePicker onAdd={(item) => setO({ ...o, itens: [...o.itens, item] })} />
            </div>
          )}
        </CardHeader>
        <CardContent>
          {o.itens.length === 0 && <p className="text-sm text-muted-foreground">Nenhum item.</p>}
          <div className="space-y-3">
            {o.itens.map((it, i) => (
              <div
                key={it.id}
                className="border rounded-md p-3 space-y-3 md:grid md:grid-cols-12 md:gap-2 md:items-start md:space-y-0"
              >
                <div className="md:col-span-4">
                  <Label className="text-xs">Serviço</Label>
                  <Input
                    value={it.nome}
                    onChange={(e) => updateItem(i, { nome: e.target.value })}
                  />
                </div>
                <div className="md:col-span-4">
                  <Label className="text-xs">Descrição</Label>
                  <Input
                    value={it.descricao || ""}
                    onChange={(e) => updateItem(i, { descricao: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2 md:contents">
                  <div className="md:col-span-1">
                    <Label className="text-xs">Qtd</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={it.quantidade}
                      onChange={(e) =>
                        updateItem(i, { quantidade: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label className="text-xs">Valor un.</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={it.valor_unitario}
                      onChange={(e) =>
                        updateItem(i, { valor_unitario: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 md:col-span-1 md:flex-col md:items-end md:justify-start">
                  <div className="md:text-right">
                    <Label className="text-xs">Total</Label>
                    <div className="text-sm font-medium">
                      {formatBRL(it.quantidade * it.valor_unitario)}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={i === 0}
                      title="Subir item"
                      onClick={() => moveItem(i, i - 1)}
                    >
                      <ChevronUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      disabled={i === o.itens.length - 1}
                      title="Descer item"
                      onClick={() => moveItem(i, i + 1)}
                    >
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      title="Remover item"
                      onClick={() => setItemToRemove(i)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="flex flex-col min-h-0">
          <CardHeader>
            <CardTitle className="text-base">Condições comerciais</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <Textarea
              className="min-h-[10rem] lg:min-h-[12rem]"
              rows={6}
              value={o.condicoes || ""}
              onChange={(e) => setO({ ...o, condicoes: e.target.value })}
            />
          </CardContent>
        </Card>
        <Card className="flex flex-col min-h-0">
          <CardHeader>
            <CardTitle className="text-base">Observações</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <Textarea
              className="min-h-[10rem] lg:min-h-[12rem]"
              rows={6}
              value={o.observacoes || ""}
              onChange={(e) => setO({ ...o, observacoes: e.target.value })}
            />
          </CardContent>
        </Card>
        <Card className="flex flex-col min-h-0">
          <CardHeader>
            <CardTitle className="text-base">Totais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 flex-1">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatBRL(subtotal)}</span>
            </div>
            <div className="space-y-1">
              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
                <Label className="sm:w-20 shrink-0">Desconto</Label>
                <Input
                  inputMode="numeric"
                  placeholder="0%"
                  className="font-mono"
                  value={formatPercentInput(o.desconto_percentual)}
                  onChange={(e) => {
                    const masked = maskPercent(e.target.value);
                    setO({ ...o, desconto_percentual: parsePercent(masked) });
                  }}
                />
              </div>
              {o.desconto_percentual > 0 && (
                <p className="text-xs text-muted-foreground text-right">
                  {formatPercentLabel(o.desconto_percentual)} do subtotal = −{" "}
                  {formatBRL(descontoValor)}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2">
              <Label className="sm:w-20 shrink-0">Acréscimo</Label>
              <Input
                type="number"
                step="0.01"
                value={o.acrescimo}
                onChange={(e) => setO({ ...o, acrescimo: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="border-t pt-3 flex justify-between text-lg font-semibold mt-auto">
              <span>Total</span>
              <span>{formatBRL(total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {o.historico.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Histórico</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {o.historico.map((h, i) => (
              <div key={i} className="text-muted-foreground">
                {new Date(h.data).toLocaleString("pt-BR")} — {STATUS_LABEL[h.de]} →{" "}
                {STATUS_LABEL[h.para]}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {original && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base text-destructive">Excluir registro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Esta ação remove permanentemente o {labelDocumento(o.status).toLowerCase()}{" "}
              <span className="font-mono">{o.numero}</span> e não pode ser desfeita.
            </p>
            <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4 mr-1" />
              Excluir {labelDocumento(o.status).toLowerCase()}
            </Button>
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={itemToRemove !== null}
        onOpenChange={(open) => !open && setItemToRemove(null)}
        title="Remover item?"
        description={
          itemToRemove !== null && o.itens[itemToRemove]
            ? `O item "${o.itens[itemToRemove].nome || "sem nome"}" será removido da lista. Salve o orçamento para persistir.`
            : ""
        }
        confirmLabel="Remover"
        variant="destructive"
        onConfirm={() => {
          if (itemToRemove !== null) removeItem(itemToRemove);
        }}
      />

      <MobileFormFooter
        label="Salvar orçamento"
        onSave={saveAndExit}
        loading={upsert.isPending}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Excluir ${labelDocumento(o.status).toLowerCase()}?`}
        description={`O registro ${o.numero} — "${o.nome_projeto || "Sem nome"}" será removido permanentemente.`}
        confirmLabel="Excluir"
        variant="destructive"
        onConfirm={() => remove.mutate(o.id, { onSuccess: () => navigate({ to: "/orcamentos" }) })}
      />

      <Dialog open={preview} onOpenChange={setPreview}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-5xl h-[min(90dvh,100vh-1rem)] p-0 flex flex-col">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>Pré-visualização do PDF</DialogTitle>
            <DialogDescription className="sr-only">
              Visualização do documento do orçamento ou pedido antes de baixar ou imprimir.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0">
            {preview && (
              <ClientOnlyPDF
                kind="preview"
                orcamento={o}
                empresa={empresa}
                cliente={clientes.find((c) => c.id === o.cliente_id)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
