import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { calcTotal, formatBRL, formatDate, STATUS_LABEL, STATUS_ORDER, StatusOrcamento } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/kanban")({
  head: () => ({ meta: [{ title: "Kanban — Freela OS" }] }),
  component: KanbanPage,
});

function KanbanPage() {
  const { orcamentos, clientes, financeiro, moveOrcamento } = useApp();
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    const over = e.over?.id as StatusOrcamento | undefined;
    if (over && STATUS_ORDER.includes(over)) {
      moveOrcamento(String(e.active.id), over);
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
    const o = orcamentos.find((x) => x.id === id)!;
    const cli = clientes.find((c) => c.id === o.cliente_id);
    const fs = statusFin(o.id);
    return (
      <Card className="p-3 cursor-grab active:cursor-grabbing bg-card shadow-sm">
        <div className="text-xs text-muted-foreground">{o.numero}</div>
        <div className="font-medium text-sm leading-snug">{o.nome_projeto}</div>
        <div className="text-xs text-muted-foreground mt-1">{cli?.nome ?? "—"}</div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm font-semibold">{formatBRL(calcTotal(o))}</span>
          {fs && <Badge variant={fs.v} className="text-[10px]">{fs.label}</Badge>}
        </div>
        <div className="text-[11px] text-muted-foreground mt-1">
          Prazo: {formatDate(o.prazo_entrega)}
        </div>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Kanban</h1>
          <p className="text-sm text-muted-foreground">Arraste os cards entre as etapas.</p>
        </div>
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {STATUS_ORDER.map((s) => {
            const items = orcamentos.filter((o) => o.status === s);
            return (
              <Column key={s} status={s} count={items.length} total={items.reduce((a, o) => a + calcTotal(o), 0)}>
                {items.map((o) => (
                  <Draggable key={o.id} id={o.id} onOpen={() => navigate({ to: "/orcamentos/$id", params: { id: o.id } })}>
                    {renderCard(o.id)}
                  </Draggable>
                ))}
              </Column>
            );
          })}
        </div>
        <DragOverlay>{activeId ? renderCard(activeId) : null}</DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({ status, count, total, children }: { status: StatusOrcamento; count: number; total: number; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div ref={setNodeRef} className={`rounded-lg border bg-muted/40 p-3 min-h-[200px] transition-colors ${isOver ? "bg-accent" : ""}`}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-medium text-sm">{STATUS_LABEL[status]}</div>
          <div className="text-xs text-muted-foreground">{count} · {formatBRL(total)}</div>
        </div>
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Draggable({ id, children, onOpen }: { id: string; children: React.ReactNode; onOpen: () => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;
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
