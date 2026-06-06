import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { listarPagamentosPlanoAdminRemote } from "@/lib/api/admin.functions";
import type { BillingPaymentListItem } from "@/lib/billing/types";
import { formatDatePt } from "@/lib/billing/dates";
import { getClientSessao } from "@/lib/auth/client-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function formatBRLCents(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

type Props = {
  empresaId: string;
  refreshKey?: number;
};

export function AdminEmpresaBillingPayments({ empresaId, refreshKey = 0 }: Props) {
  const [items, setItems] = useState<BillingPaymentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = useCallback(async () => {
    const sessao = getClientSessao();
    if (!sessao) return;
    setLoading(true);
    try {
      const list = await listarPagamentosPlanoAdminRemote({
        data: {
          adminWhatsapp: sessao.id,
          empresaId,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        },
      });
      setItems(list);
    } catch (e) {
      toast.error((e as Error).message ?? "Falha ao carregar pagamentos");
    } finally {
      setLoading(false);
    }
  }, [empresaId, dateFrom, dateTo, refreshKey]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3 items-end">
        <div className="space-y-1">
          <Label htmlFor="admin-pay-from">De</Label>
          <Input
            id="admin-pay-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="admin-pay-to">Até</Label>
          <Input
            id="admin-pay-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>
        <Button type="button" variant="secondary" onClick={() => void load()}>
          Filtrar
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando histórico…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum pagamento registrado.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Correlation ID</TableHead>
              <TableHead>End-to-end</TableHead>
              <TableHead>Estorno sugerido</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{formatDatePt(p.paidAt)}</TableCell>
                <TableCell>{formatBRLCents(p.valueCents)}</TableCell>
                <TableCell>
                  <Badge variant={p.status === "pago" ? "default" : "secondary"}>{p.status}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs max-w-[120px] truncate">
                  {p.correlationId ?? "—"}
                </TableCell>
                <TableCell className="font-mono text-xs max-w-[120px] truncate">
                  {p.endToEndId ?? "—"}
                </TableCell>
                <TableCell>
                  {p.suggestedRefundCents != null
                    ? formatBRLCents(p.suggestedRefundCents)
                    : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
