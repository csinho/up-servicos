import type { CategoriaProduto, Produto } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  produto: Produto;
  categorias: { value: CategoriaProduto; label: string }[];
  onSave: (p: Produto) => void;
  saving?: boolean;
};

export function ProdutoFormDialog({
  open,
  onOpenChange,
  produto,
  categorias,
  onSave,
  saving,
}: Props) {
  const [form, setForm] = useState(produto);

  useEffect(() => {
    if (open) setForm(produto);
  }, [open, produto]);

  const isNew = !produto.nome;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isNew ? "Novo Produto" : "Editar produto"}</DialogTitle>
          <DialogDescription className="sr-only">
            {isNew
              ? "Cadastre peça ou produto no estoque com quantidade e preços."
              : "Altere os dados do produto no estoque."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Nome *</Label>
            <Input
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              placeholder="Nome do produto/peça"
            />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select
              value={form.categoria}
              onValueChange={(v) => setForm({ ...form, categoria: v as CategoriaProduto })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min={0}
                value={form.quantidade}
                onChange={(e) => setForm({ ...form, quantidade: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Qtd mínima</Label>
              <Input
                type="number"
                min={0}
                value={form.qtd_minima}
                onChange={(e) => setForm({ ...form, qtd_minima: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Preço de custo</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.preco_custo}
                onChange={(e) => setForm({ ...form, preco_custo: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label>Preço de venda</Label>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.preco_venda}
                onChange={(e) => setForm({ ...form, preco_venda: Number(e.target.value) || 0 })}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!form.nome.trim() || saving}
            onClick={() => onSave(form)}
          >
            {isNew ? "Adicionar" : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
