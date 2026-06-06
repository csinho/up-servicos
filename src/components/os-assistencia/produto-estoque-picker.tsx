import { useState } from "react";
import { Plus } from "lucide-react";
import { useProdutos, novoItem } from "@/lib/store";
import type { OrcamentoItem, Produto } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  onAdd: (item: OrcamentoItem) => void;
};

export function ProdutoEstoquePicker({ onAdd }: Props) {
  const { data: produtos = [] } = useProdutos();
  const [produtoId, setProdutoId] = useState("");
  const [qtd, setQtd] = useState(1);

  const adicionar = () => {
    const p = produtos.find((x) => x.id === produtoId);
    if (!p) return;
    onAdd({
      ...novoItem(),
      produto_id: p.id,
      nome: p.nome,
      unidade: "peça",
      quantidade: qtd,
      valor_unitario: p.preco_venda,
    });
    setProdutoId("");
    setQtd(1);
  };

  if (!produtos.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Cadastre peças em Estoque para adicionar à OS.
      </p>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">
      <div className="flex-1 space-y-1">
        <Select value={produtoId} onValueChange={setProdutoId}>
          <SelectTrigger>
            <SelectValue placeholder="Peça do estoque" />
          </SelectTrigger>
          <SelectContent>
            {produtos.map((p: Produto) => (
              <SelectItem key={p.id} value={p.id}>
                {p.nome} (estoque: {p.quantidade})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="w-24 space-y-1">
        <Input
          type="number"
          min={1}
          value={qtd}
          onChange={(e) => setQtd(Math.max(1, Number(e.target.value) || 1))}
        />
      </div>
      <Button type="button" variant="secondary" disabled={!produtoId} onClick={adicionar}>
        <Plus className="h-4 w-4 mr-1" />
        Adicionar peça
      </Button>
    </div>
  );
}
