import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { toast } from "sonner";
import {
  listarEmpresasAdminRemote,
  setEmpresaCategoriaAdminRemote,
  setEmpresaPausadaAdminRemote,
} from "@/lib/api/admin.functions";
import type { AdminEmpresaListItem } from "@/lib/admin/types";
import { EMPRESA_CATEGORIAS, normalizeEmpresaCategoria } from "@/lib/empresa-categorias";
import type { EmpresaCategoria } from "@/lib/empresa-categorias/types";
import { formatDatePt } from "@/lib/billing/dates";
import { getClientSessao } from "@/lib/auth/client-session";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [savingCategoriaId, setSavingCategoriaId] = useState<string | null>(null);

  const categoriaLabel = (value: EmpresaCategoria) =>
    EMPRESA_CATEGORIAS.find((c) => c.value === value)?.label ?? value;

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

  const salvarCategoria = async (empresa: AdminEmpresaListItem, categoria: EmpresaCategoria) => {
    if (empresa.categoria === categoria) return;
    const sessao = getClientSessao();
    if (!sessao) return;
    setSavingCategoriaId(empresa.id);
    try {
      await setEmpresaCategoriaAdminRemote({
        data: { adminWhatsapp: sessao.id, empresaId: empresa.id, categoria },
      });
      toast.success(`Categoria alterada para ${categoriaLabel(categoria)}.`);
      await load();
    } catch (e) {
      toast.error((e as Error).message ?? "Falha ao salvar categoria");
    } finally {
      setSavingCategoriaId(null);
    }
  };

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
              <TableHead>Categoria</TableHead>
              <TableHead>Operacional</TableHead>
              <TableHead>Pagamento</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((e) => {
              const categoria = normalizeEmpresaCategoria(e.categoria);
              return (
              <TableRow key={e.id}>
                <TableCell className="font-medium">{e.nome}</TableCell>
                <TableCell className="text-muted-foreground">{e.telefone ?? "—"}</TableCell>
                <TableCell>
                  <Select
                    value={categoria}
                    disabled={savingCategoriaId === e.id}
                    onValueChange={(v) => void salvarCategoria(e, v as EmpresaCategoria)}
                  >
                    <SelectTrigger className="h-8 w-[11.5rem] text-xs">
                      <SelectValue>{categoriaLabel(categoria)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {EMPRESA_CATEGORIAS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
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
                  <div className="flex items-center justify-end gap-2">
                    <Button type="button" variant="outline" size="sm" asChild>
                      <Link
                        to="/admin/empresas/$empresaId"
                        params={{ empresaId: e.id }}
                        preload="intent"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1" />
                        Detalhes
                      </Link>
                    </Button>
                    <Switch
                      checked={e.status === "inativo"}
                      disabled={togglingId === e.id}
                      onCheckedChange={() => void togglePausa(e)}
                      aria-label={e.status === "ativo" ? "Pausar empresa" : "Ativar empresa"}
                    />
                  </div>
                </TableCell>
              </TableRow>
            );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
