import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, AlertTriangle } from "lucide-react";
import { pageTitle } from "@/lib/app-brand";
import { RequireCategoria } from "@/components/auth/RequireCategoria";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MobileCard } from "@/components/mobile/mobile-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useEmpresaCategoria } from "@/hooks/use-empresa-categoria";
import { useProdutos, useRemoveProduto, useUpsertProduto } from "@/lib/store";
import { formatBRL } from "@/lib/types";
import { isEstoqueBaixo } from "@/lib/produtos.repository";
import type { CategoriaProduto, Produto } from "@/lib/types";
import { newId } from "@/lib/id";
import { ProdutoFormDialog } from "@/components/estoque/produto-form-dialog";

export const Route = createFileRoute("/estoque/")({
  head: () => ({ meta: [{ title: pageTitle("Estoque") }] }),
  component: EstoquePage,
});

function EstoquePage() {
  return (
    <RequireCategoria allowed={["assistencia_tecnica"]}>
      <EstoqueContent />
    </RequireCategoria>
  );
}

function EstoqueContent() {
  const { config } = useEmpresaCategoria();
  const { data: produtos = [], isLoading } = useProdutos();
  const upsert = useUpsertProduto();
  const remove = useRemoveProduto();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Produto | null>(null);

  const abrirNovo = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const abrirEditar = (p: Produto) => {
    setEditing(p);
    setDialogOpen(true);
  };

  const salvar = (p: Produto) => {
    upsert.mutate(p, {
      onSuccess: () => setDialogOpen(false),
    });
  };

  const excluir = (id: string) => {
    if (!confirm("Remover este produto do estoque?")) return;
    remove.mutate(id);
  };

  const novoProduto = (): Produto => ({
    id: newId(),
    nome: "",
    categoria: "outro",
    quantidade: 0,
    qtd_minima: 0,
    preco_custo: 0,
    preco_venda: 0,
    ativo: true,
  });

  const labelCategoria = (cat: CategoriaProduto) =>
    config.produtoCategorias?.find((c) => c.value === cat)?.label ?? cat;

  return (
    <div className="space-y-6">
      <PageHeader title="Estoque" description="Peças e produtos para reparo">
        <Button type="button" className="w-full sm:w-auto" onClick={abrirNovo}>
          <Plus className="h-4 w-4 mr-1" />
          Novo produto
        </Button>
      </PageHeader>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando estoque…</p>
      ) : produtos.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-muted/30 px-6 py-10 text-center space-y-4">
          <p className="text-sm text-muted-foreground">Nenhum produto cadastrado.</p>
          <Button type="button" onClick={abrirNovo}>
            <Plus className="h-4 w-4 mr-1" />
            Cadastrar primeiro produto
          </Button>
        </div>
      ) : (
        <>
          <div className="hidden md:block rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="text-right">Qtd</TableHead>
                  <TableHead className="text-right">Mín.</TableHead>
                  <TableHead className="text-right">P. custo</TableHead>
                  <TableHead className="text-right">P. venda</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.map((p) => (
                  <TableRow key={p.id} className="cursor-pointer" onClick={() => abrirEditar(p)}>
                    <TableCell className="font-medium">
                      <span className="inline-flex items-center gap-2">
                        {p.nome}
                        {isEstoqueBaixo(p) && (
                          <Badge variant="destructive" className="text-[10px]">
                            Baixo
                          </Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>{labelCategoria(p.categoria)}</TableCell>
                    <TableCell className="text-right">{p.quantidade}</TableCell>
                    <TableCell className="text-right">{p.qtd_minima}</TableCell>
                    <TableCell className="text-right">{formatBRL(p.preco_custo)}</TableCell>
                    <TableCell className="text-right">{formatBRL(p.preco_venda)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          excluir(p.id);
                        }}
                      >
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="md:hidden space-y-3">
            {produtos.map((p) => (
              <MobileCard key={p.id} onClick={() => abrirEditar(p)}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{p.nome}</p>
                    <p className="text-xs text-muted-foreground">{labelCategoria(p.categoria)}</p>
                  </div>
                  {isEstoqueBaixo(p) && (
                    <Badge variant="destructive" className="shrink-0 gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Baixo
                    </Badge>
                  )}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                  <span>Qtd: {p.quantidade}</span>
                  <span>Mín: {p.qtd_minima}</span>
                  <span>Custo: {formatBRL(p.preco_custo)}</span>
                  <span>Venda: {formatBRL(p.preco_venda)}</span>
                </div>
              </MobileCard>
            ))}
          </div>
        </>
      )}

      <ProdutoFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        produto={editing ?? novoProduto()}
        categorias={config.produtoCategorias ?? []}
        onSave={salvar}
        saving={upsert.isPending}
      />
    </div>
  );
}
