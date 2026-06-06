import { useEffect, useState } from "react";
import type { CategoriaCaixa, Financeiro, TipoFinanceiro } from "@/lib/types";
import { newId } from "@/lib/id";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transacao?: Financeiro | null;
  categorias: { value: CategoriaCaixa; label: string }[];
  onSave: (f: Financeiro) => void;
  saving?: boolean;
};

export function TransacaoManualDialog({
  open,
  onOpenChange,
  transacao,
  categorias,
  onSave,
  saving,
}: Props) {
  const [tipoUi, setTipoUi] = useState<"entrada" | "saida">("entrada");
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState<CategoriaCaixa | "">("");
  const [valor, setValor] = useState(0);

  useEffect(() => {
    if (!open) return;
    if (transacao) {
      setTipoUi(transacao.tipo === "receber" ? "entrada" : "saida");
      setDescricao(transacao.descricao);
      setCategoria(transacao.categoria_caixa ?? "");
      setValor(transacao.valor);
    } else {
      setTipoUi("entrada");
      setDescricao("");
      setCategoria("");
      setValor(0);
    }
  }, [open, transacao]);

  const salvar = () => {
    const tipo: TipoFinanceiro = tipoUi === "entrada" ? "receber" : "pagar";
    onSave({
      id: transacao?.id ?? newId(),
      tipo,
      descricao: descricao.trim(),
      valor,
      vencimento: new Date().toISOString(),
      status: "pago",
      pagamento: new Date().toISOString(),
      origem: "manual",
      categoria_caixa: categoria || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{transacao ? "Editar transação" : "Nova transação manual"}</DialogTitle>
          <DialogDescription className="sr-only">
            Registre entrada ou saída no fluxo de caixa da assistência técnica.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Tipo</Label>
            <RadioGroup
              value={tipoUi}
              onValueChange={(v) => setTipoUi(v as "entrada" | "saida")}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="entrada" id="entrada" />
                <Label htmlFor="entrada">Entrada</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="saida" id="saida" />
                <Label htmlFor="saida">Saída</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label>Descrição *</Label>
            <Input
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex: Compra de peças para estoque"
            />
          </div>
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={categoria} onValueChange={(v) => setCategoria(v as CategoriaCaixa)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
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
          <div className="space-y-2">
            <Label>Valor *</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={valor}
              onChange={(e) => setValor(Number(e.target.value) || 0)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            type="button"
            disabled={!descricao.trim() || valor <= 0 || saving}
            onClick={salvar}
          >
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
