import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getAdminSettingsRemote,
  saveAdminBillingPlanRemote,
  saveAdminContactWhatsappRemote,
} from "@/lib/api/admin.functions";
import type { AdminSettings } from "@/lib/admin/types";
import { useAdminRefreshTick } from "@/components/admin/admin-refresh-context";
import { getClientSessao } from "@/lib/auth/client-session";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/admin/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — Admin Freela OS" }] }),
  component: AdminConfiguracoesPage,
});

function AdminConfiguracoesPage() {
  const tick = useAdminRefreshTick();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [planReais, setPlanReais] = useState("");
  const [contactWhatsapp, setContactWhatsapp] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const sessao = getClientSessao();
    if (!sessao) return;
    setLoading(true);
    try {
      const data = await getAdminSettingsRemote({ data: { adminWhatsapp: sessao.id } });
      setSettings(data);
      setPlanReais((data.planValueCents / 100).toFixed(2).replace(".", ","));
      setContactWhatsapp(data.contactWhatsapp);
    } catch (e) {
      toast.error((e as Error).message ?? "Falha ao carregar configurações");
    } finally {
      setLoading(false);
    }
  }, [tick]);

  useEffect(() => {
    void load();
  }, [load]);

  const savePlan = async () => {
    const sessao = getClientSessao();
    if (!sessao) return;
    const normalized = planReais.replace(",", ".");
    const value = parseFloat(normalized);
    if (!Number.isFinite(value) || value <= 0) {
      toast.error("Valor do plano inválido.");
      return;
    }
    setSaving(true);
    try {
      const updated = await saveAdminBillingPlanRemote({
        data: { adminWhatsapp: sessao.id, planValueReais: value },
      });
      setSettings(updated);
      toast.success("Valor do plano atualizado. Novas cobranças usarão o novo preço.");
    } catch (e) {
      toast.error((e as Error).message ?? "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const saveContact = async () => {
    const sessao = getClientSessao();
    if (!sessao) return;
    setSaving(true);
    try {
      const updated = await saveAdminContactWhatsappRemote({
        data: { adminWhatsapp: sessao.id, contactWhatsapp },
      });
      setSettings(updated);
      toast.success("Contato de suporte salvo.");
    } catch (e) {
      toast.error((e as Error).message ?? "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <PageHeader
        title="Configurações"
        description="Parâmetros globais — valor do plano e contato de suporte."
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Valor do plano</CardTitle>
              <CardDescription>
                Persistido em system_settings (centavos). Não altera pagamentos já registrados.
                {settings ? ` Atual: ${settings.planLabel}` : null}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="plan-value">Valor (R$/mês)</Label>
                <Input
                  id="plan-value"
                  inputMode="decimal"
                  placeholder="39,90"
                  value={planReais}
                  onChange={(e) => setPlanReais(e.target.value)}
                />
              </div>
              <Button type="button" disabled={saving} onClick={() => void savePlan()}>
                Salvar valor do plano
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contato de suporte</CardTitle>
              <CardDescription>WhatsApp exibido para empresas (apenas dígitos).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="support-wa">WhatsApp suporte</Label>
                <Input
                  id="support-wa"
                  inputMode="numeric"
                  placeholder="5571999999999"
                  value={contactWhatsapp}
                  onChange={(e) => setContactWhatsapp(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <Button type="button" variant="secondary" disabled={saving} onClick={() => void saveContact()}>
                Salvar contato
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
