import type { Orcamento, OrcamentoAssistencia } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

const CHECKLIST_ITEMS = [
  { key: "tela_trincada", label: "Tela trincada" },
  { key: "riscos", label: "Riscos no corpo" },
  { key: "sem_chip", label: "Sem chip" },
  { key: "sem_capa", label: "Sem capa/carregador" },
] as const;

type Props = {
  o: Orcamento;
  onChange: (patch: Partial<Orcamento>) => void;
};

export function OsAparelhoFields({ o, onChange }: Props) {
  const a: OrcamentoAssistencia = o.assistencia ?? { orcamento_id: o.id, checklist_entrada: {} };

  const setAssist = (patch: Partial<OrcamentoAssistencia>) => {
    onChange({
      assistencia: { ...a, orcamento_id: o.id, ...patch },
    });
  };

  const toggleCheck = (key: string, checked: boolean) => {
    const checklist = { ...(a.checklist_entrada ?? {}), [key]: checked };
    setAssist({ checklist_entrada: checklist });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Aparelho</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Marca</Label>
            <Input
              value={a.aparelho_marca ?? ""}
              onChange={(e) => setAssist({ aparelho_marca: e.target.value })}
              placeholder="Samsung, Apple…"
            />
          </div>
          <div className="space-y-2">
            <Label>Modelo</Label>
            <Input
              value={a.aparelho_modelo ?? ""}
              onChange={(e) => setAssist({ aparelho_modelo: e.target.value })}
              placeholder="Galaxy A54, iPhone 12…"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>IMEI / Serial</Label>
          <Input
            value={a.imei ?? ""}
            onChange={(e) => setAssist({ imei: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Defeito relatado</Label>
          <Textarea
            value={a.defeito_relatado ?? ""}
            onChange={(e) => setAssist({ defeito_relatado: e.target.value })}
            rows={3}
          />
        </div>
        <div className="space-y-2">
          <Label>Acessórios deixados</Label>
          <Input
            value={a.acessorios ?? ""}
            onChange={(e) => setAssist({ acessorios: e.target.value })}
            placeholder="Capa, chip, carregador…"
          />
        </div>
        <div className="space-y-2">
          <Label>Senha / padrão (uso interno)</Label>
          <Input
            type="password"
            autoComplete="off"
            value={a.senha_dispositivo ?? ""}
            onChange={(e) => setAssist({ senha_dispositivo: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">Não aparece no PDF enviado ao cliente.</p>
        </div>
        <div className="space-y-2">
          <Label>Checklist de entrada</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {CHECKLIST_ITEMS.map((item) => (
              <label key={item.key} className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={!!a.checklist_entrada?.[item.key]}
                  onCheckedChange={(v) => toggleCheck(item.key, v === true)}
                />
                {item.label}
              </label>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
