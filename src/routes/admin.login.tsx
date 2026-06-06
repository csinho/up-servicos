import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  checkAdminWhatsappAllowedRemote,
  confirmAdminLoginOtpRemote,
  requestAdminLoginOtpRemote,
} from "@/lib/api/admin.functions";
import { getClientSessao, isAdminSessao, setClientSessao } from "@/lib/auth/client-session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export const Route = createFileRoute("/admin/login")({
  head: () => ({ meta: [{ title: "Login Admin — Freela OS" }] }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [whatsapp, setWhatsapp] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"whatsapp" | "otp">("whatsapp");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sessao = getClientSessao();
    if (isAdminSessao(sessao)) {
      void navigate({ to: "/admin/dashboard" });
    }
  }, [navigate]);

  const requestOtp = async () => {
    setLoading(true);
    try {
      const { allowed } = await checkAdminWhatsappAllowedRemote({ data: { whatsapp } });
      if (!allowed) {
        toast.error("WhatsApp não autorizado para administração.");
        return;
      }
      await requestAdminLoginOtpRemote({ data: { whatsapp } });
      toast.success("Código enviado (verifique logs do servidor se WhatsApp não estiver configurado).");
      setStep("otp");
    } catch (e) {
      toast.error((e as Error).message ?? "Falha ao solicitar código");
    } finally {
      setLoading(false);
    }
  };

  const confirmOtp = async () => {
    if (code.length !== 6) {
      toast.error("Informe o código de 6 dígitos.");
      return;
    }
    setLoading(true);
    try {
      const { sessao } = await confirmAdminLoginOtpRemote({ data: { whatsapp, code } });
      setClientSessao(sessao);
      toast.success("Login realizado.");
      void navigate({ to: "/admin/dashboard" });
    } catch (e) {
      toast.error((e as Error).message ?? "Código inválido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Administração Freela OS</CardTitle>
          <CardDescription>
            Acesso restrito — WhatsApp deve estar na allowlist do servidor.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "whatsapp" ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="admin-wa">WhatsApp (11 dígitos)</Label>
                <Input
                  id="admin-wa"
                  inputMode="numeric"
                  placeholder="71999999999"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, "").slice(0, 11))}
                />
              </div>
              <Button type="button" className="w-full" disabled={loading || whatsapp.length < 11} onClick={() => void requestOtp()}>
                Enviar código
              </Button>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Código enviado para <strong>{whatsapp}</strong>
              </p>
              <div className="flex justify-center">
                <InputOTP maxLength={6} value={code} onChange={setCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button type="button" className="w-full" disabled={loading} onClick={() => void confirmOtp()}>
                Entrar
              </Button>
              <Button type="button" variant="ghost" className="w-full" onClick={() => setStep("whatsapp")}>
                Voltar
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
