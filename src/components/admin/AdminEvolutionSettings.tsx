import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getEvolutionQrAdminRemote,
  refreshEvolutionConnectionAdminRemote,
  saveEvolutionInstanceAdminRemote,
} from "@/lib/api/admin.functions";
import type { AdminSettings } from "@/lib/admin/types";
import { getClientSessao } from "@/lib/auth/client-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

type Props = {
  settings: AdminSettings | null;
  onUpdated: () => void;
};

export function AdminEvolutionSettings({ settings, onUpdated }: Props) {
  const [instanceName, setInstanceName] = useState("");
  const [connectionState, setConnectionState] = useState("unknown");
  const [qrBase64, setQrBase64] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (settings) {
      setInstanceName(settings.evolutionInstanceName);
      setConnectionState(settings.evolutionConnectionState);
    }
  }, [settings]);

  const saveInstance = async () => {
    const sessao = getClientSessao();
    if (!sessao || sessao.tipo !== "admin") return;
    setLoading(true);
    try {
      const result = await saveEvolutionInstanceAdminRemote({
        data: { adminWhatsapp: sessao.id, instanceName },
      });
      setConnectionState(result.connectionState);
      toast.success("Instância salva no Supabase. Gere o QR para conectar o WhatsApp.");
      onUpdated();
    } catch (e) {
      toast.error((e as Error).message ?? "Falha ao salvar instância");
    } finally {
      setLoading(false);
    }
  };

  const generateQr = async () => {
    const sessao = getClientSessao();
    if (!sessao || sessao.tipo !== "admin") return;
    setLoading(true);
    try {
      const result = await getEvolutionQrAdminRemote({ data: { adminWhatsapp: sessao.id } });
      setQrBase64(result.base64);
      setPairingCode(result.pairingCode);
      setConnectionState(result.connectionState);
      if (result.pairingCode) {
        toast.message(`Código de pareamento: ${result.pairingCode}`);
      }
      onUpdated();
    } catch (e) {
      toast.error((e as Error).message ?? "Falha ao gerar QR");
    } finally {
      setLoading(false);
    }
  };

  const refreshState = async () => {
    const sessao = getClientSessao();
    if (!sessao || sessao.tipo !== "admin") return;
    setLoading(true);
    try {
      const result = await refreshEvolutionConnectionAdminRemote({
        data: { adminWhatsapp: sessao.id },
      });
      setConnectionState(result.connectionState);
      if (result.connectionState === "open") {
        toast.success("WhatsApp conectado!");
        setQrBase64(null);
      } else {
        toast.message(`Estado: ${result.connectionState}`);
      }
      onUpdated();
    } catch (e) {
      toast.error((e as Error).message ?? "Falha ao verificar conexão");
    } finally {
      setLoading(false);
    }
  };

  const stateVariant =
    connectionState === "open" ? "default" : connectionState === "connecting" ? "secondary" : "destructive";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 flex-wrap">
          WhatsApp (Evolution API)
          <Badge variant={stateVariant}>{connectionState}</Badge>
        </CardTitle>
        <CardDescription>
          Troque a instância, gere novo QR e conecte outro número. URL e API key continuam nos secrets
          do servidor (GitHub / Cloudflare).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="evo-instance">Nome da instância</Label>
          <Input
            id="evo-instance"
            placeholder="erp-up-servicos-producao"
            value={instanceName}
            onChange={(e) => setInstanceName(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Deve ser igual ao nome no painel Evolution. Salvar aqui grava em system_settings e passa a
            ter prioridade sobre EVOLUTION_INSTANCE do .env.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" disabled={loading} onClick={() => void saveInstance()}>
            Salvar instância
          </Button>
          <Button type="button" disabled={loading} onClick={() => void generateQr()}>
            Gerar QR Code
          </Button>
          <Button type="button" variant="outline" disabled={loading} onClick={() => void refreshState()}>
            Verificar conexão
          </Button>
        </div>

        {pairingCode && (
          <p className="text-sm">
            Código de pareamento: <strong>{pairingCode}</strong> (use 55 + seu WhatsApp no app)
          </p>
        )}

        {qrBase64 && (
          <div className="flex flex-col items-center gap-2 p-4 border rounded-lg bg-white">
            <img
              src={qrBase64.startsWith("data:") ? qrBase64 : `data:image/png;base64,${qrBase64}`}
              alt="QR Code Evolution WhatsApp"
              className="max-w-[240px] w-full"
            />
            <p className="text-xs text-muted-foreground text-center">
              Escaneie no WhatsApp → Aparelhos conectados → Conectar aparelho
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
