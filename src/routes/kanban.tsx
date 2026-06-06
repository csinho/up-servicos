import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Search, X } from "lucide-react";
import { pageTitle } from "@/lib/app-brand";
import { billingBlocksMutation } from "@/lib/billing/state";
import { useEmpresaBilling } from "@/lib/billing/use-empresa-billing";
import { useOrcamentos, useClientes, useFinanceiro, useMoveOrcamento } from "@/lib/store";
import type { Cliente, Orcamento } from "@/lib/types";
import {
  calcTotal,
  calendarPartsFromIso,
  formatBRL,
  formatCalendarDate,
  formatDate,
  STATUS_LABEL,
  STATUS_ORDER,
  StatusOrcamento,
} from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/kanban")({
  head: () => ({ meta: [{ title: pageTitle("Kanban") }] }),
  component: KanbanPage,
});

type DateFilters = {
  emissaoDe: string;
  emissaoAte: string;
  validadeDe: string;
  validadeAte: string;
  prazoDe: string;
  prazoAte: string;
};

const emptyDates = (): DateFilters => ({
  emissaoDe: "",
  emissaoAte: "",
  validadeDe: "",
  validadeAte: "",
  prazoDe: "",
  prazoAte: "",
});

function dayStart(iso: string): number {
  const parts = calendarPartsFromIso(iso);
  if (parts) {
    const { y, m, d } = parts;
    return new Date(y, m - 1, d, 0, 0, 0, 0).getTime();
  }
  const d = new Date(iso);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function matchesDateRange(iso: string | undefined, de: string, ate: string): boolean {
  if (!de && !ate) return true;
  if (!iso) return false;
  const t = dayStart(iso);
  if (de && t < dayStart(de)) return false;
  if (ate && t > dayStart(ate)) return false;
  return true;
}

function matchesSearch(o: Orcamento, q: string, clientes: Cliente[]): boolean {
  const term = q.trim().toLowerCase();
  if (!term) return true;
  const cli = clientes.find((c) => c.id === o.cliente_id);
  if (o.numero.toLowerCase().includes(term)) return true;
  if (o.nome_projeto.toLowerCase().includes(term)) return true;
  if (cli?.nome.toLowerCase().includes(term)) return true;
  if (
    o.itens.some(
      (i) =>
        i.nome.toLowerCase().includes(term) || (i.descricao?.toLowerCase().includes(term) ?? false),
    )
  ) {
    return true;
  }
  return false;
}

function KanbanPage() {
  const { data: orcamentos = [] } = useOrcamentos();
  const { data: clientes = [] } = useClientes();
  const { data: financeiro = [] } = useFinanceiro();
  const move = useMoveOrcamento();
  const { billing } = useEmpresaBilling();
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [dates, setDates] = useState<DateFilters>(emptyDates);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const filtered = useMemo(() => {
    return orcamentos.filter((o) => {
      if (!matchesSearch(o, search, clientes)) return false;
      if (!matchesDateRange(o.data_criacao, dates.emissaoDe, dates.emissaoAte)) return false;
      if (!matchesDateRange(o.validade, dates.validadeDe, dates.validadeAte)) return false;
      if (!matchesDateRange(o.prazo_entrega, dates.prazoDe, dates.prazoAte)) return false;
      return true;
    });
  }, [orcamentos, clientes, search, dates]);

  const hasFilters = !!search.trim() || Object.values(dates).some((v) => v);

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const over = e.over?.id as StatusOrcamento | undefined;
    if (over && STATUS_ORDER.includes(over)) {
      if (over === "em_producao" && billing && billingBlocksMutation(billing)) {
        toast.error("Plano pendente — acesse Plano para pagar e aprovar pedidos.");
        return;
      }
      move.mutate({ id: String(e.active.id), status: over });
    }
  };

  const statusFin = (orcId: string) => {
    const fs = financeiro.filter((f) => f.orcamento_id === orcId && f.tipo === "receber");
    if (fs.length === 0) return null;
    const total = fs.reduce((a, f) => a + f.valor, 0);
    const pago = fs.filter((f) => f.status === "pago").reduce((a, f) => a + f.valor, 0);
    if (pago === 0) return { label: "Pendente", v: "destructive" as const };
    if (pago >= total) return { label: "Pago", v: "default" as const };
    return { label: "Parcial", v: "secondary" as const };
  };

  const renderCard = (id: string) => {
    const o = filtered.find((x) => x.id === id) ?? orcamentos.find((x) => x.id === id);
    if (!o) return null;
    const cli = clientes.find((c) => c.id === o.cliente_id);
    const fs = statusFin(o.id);
    return (
      <Card className="p-3 cursor-grab active:cursor-grabbing bg-card shadow-sm">
        <div className="text-xs text-muted-foreground">{o.numero}</div>
        <div className="font-medium text-sm leading-snug">{o.nome_projeto}</div>
        <div className="text-xs text-muted-foreground mt-1">{cli?.nome ?? "—"}</div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-semibold">{formatBRL(calcTotal(o))}</span>
          {fs && (
            <Badge variant={fs.v} className="text-[10px]">
              {fs.label}
            </Badge>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground mt-1 space-y-0.5">
          <div>Emissão: {formatDate(o.data_criacao)}</div>
          {o.validade && <div>Validade: {formatCalendarDate(o.validade)}</div>}
          {o.prazo_entrega && <div>Prazo: {formatCalendarDate(o.prazo_entrega)}</div>}
        </div>
      </Card>
    );
  };

  const clearFilters = () => {
    setSearch("");
    setDates(emptyDates());
  };

  return (
    <div className="flex flex-col flex-1 min-h-[calc(100dvh-7.5rem)] gap-3">
      <div className="shrink-0 space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">Kanban</h1>
            <p className="text-sm text-muted-foreground">
              Arraste os cards entre as etapas.{" "}
              {hasFilters && `${filtered.length} de ${orcamentos.length} exibidos.`}
            </p>
          </div>
          {hasFilters && (
            <Button type="button" variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Limpar filtros
            </Button>
          )}
        </div>

        <Card className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por cliente, nº do pedido, projeto ou serviço…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <DateRangeFilter
              label="Emissão"
              de={dates.emissaoDe}
              ate={dates.emissaoAte}
              onDe={(v) => setDates((d) => ({ ...d, emissaoDe: v }))}
              onAte={(v) => setDates((d) => ({ ...d, emissaoAte: v }))}
            />
            <DateRangeFilter
              label="Validade"
              de={dates.validadeDe}
              ate={dates.validadeAte}
              onDe={(v) => setDates((d) => ({ ...d, validadeDe: v }))}
              onAte={(v) => setDates((d) => ({ ...d, validadeAte: v }))}
            />
            <DateRangeFilter
              label="Prazo"
              de={dates.prazoDe}
              ate={dates.prazoAte}
              onDe={(v) => setDates((d) => ({ ...d, prazoDe: v }))}
              onAte={(v) => setDates((d) => ({ ...d, prazoAte: v }))}
            />
          </div>
        </Card>
      </div>

      <div className="flex flex-col flex-1 min-h-0">
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="flex-1 min-h-0 overflow-x-auto pb-1 h-full flex flex-col -mx-1 px-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 flex-1 min-h-0 xl:min-w-[56rem]">
              {STATUS_ORDER.map((s) => {
                const items = filtered.filter((o) => o.status === s);
                return (
                  <Column
                    key={s}
                    status={s}
                    count={items.length}
                    total={items.reduce((a, o) => a + calcTotal(o), 0)}
                  >
                    {items.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6 px-2">
                        Nenhum card
                      </p>
                    ) : (
                      items.map((o) => (
                        <Draggable
                          key={o.id}
                          id={o.id}
                          onOpen={() => navigate({ to: "/orcamentos/$id", params: { id: o.id } })}
                        >
                          {renderCard(o.id)}
                        </Draggable>
                      ))
                    )}
                  </Column>
                );
              })}
            </div>
          </div>
          <DragOverlay>{activeId ? renderCard(activeId) : null}</DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}

function DateRangeFilter({
  label,
  de,
  ate,
  onDe,
  onAte,
}: {
  label: string;
  de: string;
  ate: string;
  onDe: (v: string) => void;
  onAte: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input
          type="date"
          value={de}
          onChange={(e) => onDe(e.target.value)}
          className="text-xs flex-1 min-w-0"
        />
        <span className="text-xs text-muted-foreground shrink-0 hidden sm:inline">até</span>
        <Input
          type="date"
          value={ate}
          onChange={(e) => onAte(e.target.value)}
          className="text-xs flex-1 min-w-0"
        />
      </div>
    </div>
  );
}

function Column({
  status,
  count,
  total,
  children,
}: {
  status: StatusOrcamento;
  count: number;
  total: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col h-full min-h-0 rounded-lg border bg-muted/40 transition-colors ${
        isOver ? "bg-accent ring-2 ring-primary/20" : ""
      }`}
    >
      <div className="shrink-0 p-3 border-b bg-muted/60 rounded-t-lg">
        <div className="font-medium text-sm">{STATUS_LABEL[status]}</div>
        <div className="text-xs text-muted-foreground">
          {count} · {formatBRL(total)}
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2">{children}</div>
    </div>
  );
}

function Draggable({
  id,
  children,
  onOpen,
}: {
  id: string;
  children: React.ReactNode;
  onOpen: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        if (!isDragging) onOpen();
        e.stopPropagation();
      }}
      className={isDragging ? "opacity-40" : ""}
    >
      {children}
    </div>
  );
}
