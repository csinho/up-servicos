import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { listarEmpresasAdminRemote, setEmpresaPausadaAdminRemote } from "@/lib/api/admin.functions";
import type { AdminEmpresaListItem } from "@/lib/admin/types";
import { formatDatePt } from "@/lib/billing/dates";
import { getClientSessao } from "@/lib/auth/client-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const BILLING_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  ativo: "default",
  trial: "secondary",
  pendente: "destructive",
  inadimplente: "destructive",
};

type AdminEmpresasTableProps = {
  refreshKey?: number;
};

export function AdminEmpresasTable({ refreshKey = 0 }: AdminEmpresasTableProps) {
  const [items, setItems] = useState<AdminEmpresaListItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const sessao = getClientSessao();
    if (!sessao) return;
    setLoading(true);
    try {
      const list = await listarEmpresasAdminRemote({
        data: { adminWhatsapp: sessao.id, search: search || undefined },
      });
      setItems(list);
    } catch (e) {
      toast.error((e as Error).message ?? "Falha ao carregar empresas");
    } finally {
      setLoading(false);
    }
  }, [search, refreshKey]);

  useEffect(() => {
    void load();
  }, [load]);

  const togglePausa = async (empresa: AdminEmpresaListItem) => {
    const sessao = getClientSessao();
    if (!sessao) return;
    setTogglingId(empresa.id);
    try {
      await setEmpresaPausadaAdminRemote({
        data: {
          adminWhatsapp: sessao.id,
          empresaId: empresa.id,
          pausada: empresa.status === "ativo",
        },
      });
      toast.success(empresa.status === "ativo" ? "Empresa pausada." : "Empresa reativada.");
      await load();
    } catch (e) {
      toast.error((e as Error).message ?? "Falha ao alterar status");
    } finally {
      setTogglingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <Input
          placeholder="Buscar por nome ou telefone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button type="button" variant="secondary" onClick={() => void load()}>
          Buscar
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando empresas…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma empresa encontrada.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Operacional</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Pausar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((e) => (
              <TableRow key={e.id}>
                <TableCell>
                  <Link
                    to="/admin/empresas/$empresaId"
                    params={{ empresaId: e.id }}
                    className="font-medium hover:underline"
                  >
                    {e.nome}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{e.telefone ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant={e.status === "ativo" ? "default" : "secondary"}>
                    {e.status === "ativo" ? "Ativo" : "Pausado"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={BILLING_VARIANT[e.billingStatus] ?? "outline"}>
                    {e.billingStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {e.billingStatus === "trial"
                    ? formatDatePt(e.trialEndsAt)
                    : formatDatePt(e.nextBillingAt)}
                </TableCell>
                <TableCell className="text-right">
                  <Switch
                    checked={e.status === "inativo"}
                    disabled={togglingId === e.id}
                    onCheckedChange={() => void togglePausa(e)}
                    aria-label={e.status === "ativo" ? "Pausar empresa" : "Ativar empresa"}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
