import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PhoneField } from "@/components/auth/PhoneField";
import {
  confirmLoginOtpRemote,
  requestLoginOtpRemote,
  resolveLoginRoleRemote,
} from "@/lib/api/auth.functions";
import { applyAuthSession } from "@/lib/auth/client-auth";
import { getClientSessao, isAdminSessao, isEmpresaSessao } from "@/lib/auth/client-session";
import type { LoginRole } from "@/lib/auth/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login — Freela OS" }] }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [whatsapp, setWhatsapp] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"whatsapp" | "otp">("whatsapp");
  const [role, setRole] = useState<LoginRole | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sessao = getClientSessao();
    if (isAdminSessao(sessao)) {
      void navigate({ to: "/admin/dashboard" });
      return;
    }
    if (isEmpresaSessao(sessao)) {
      void navigate({ to: "/" });
    }
  }, [navigate]);

  const sendOtp = async () => {
    if (whatsapp.length < 11) {
      toast.error("Informe o WhatsApp completo.");
      return;
    }
    setLoading(true);
    try {
      const resolved = await resolveLoginRoleRemote({ data: { whatsapp } });
      if (resolved.role === "none") {
        toast.error("WhatsApp não cadastrado.");
        return;
      }
      setRole(resolved.role);
      const result = await requestLoginOtpRemote({
        data: { whatsapp, role: resolved.role },
      });
      if (result.mockCode) {
        toast.message(`Dev: código ${result.mockCode}`);
      } else {
        toast.success(result.message);
      }
      setStep("otp");
    } catch (e) {
      toast.error((e as Error).message ?? "Falha ao enviar código");
    } finally {
      setLoading(false);
    }
  };

  const confirmOtp = async () => {
    if (!role || code.length !== 6) {
      toast.error("Informe o código de 6 dígitos.");
      return;
    }
    setLoading(true);
    try {
      const result = await confirmLoginOtpRemote({ data: { whatsapp, code, role } });
      if (result.sessao.tipo === "admin") {
        await applyAuthSession(result.sessao);
        toast.success("Bem-vindo, administração.");
        void navigate({ to: "/admin/dashboard" });
        return;
      }
      await applyAuthSession(result.sessao, "auth" in result ? result.auth : undefined);
      toast.success(`Bem-vindo, ${result.sessao.nome}!`);
      void navigate({ to: "/" });
    } catch (e) {
      toast.error((e as Error).message ?? "Código inválido");
    } finally {
      setLoading(false);
    }
  };

  const roleLabel =
    role === "admin" ? "Acesso administrativo" : role === "empresa" ? "Acesso da empresa" : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Freela OS</CardTitle>
          <CardDescription>
            Entre com seu WhatsApp. O código chega por mensagem.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {step === "whatsapp" ? (
            <>
              <PhoneField value={whatsapp} onChange={(digits) => setWhatsapp(digits)} />
              <Button
                type="button"
                className="w-full"
                disabled={loading || whatsapp.length < 11}
                onClick={() => void sendOtp()}
              >
                Enviar código
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Primeira vez?{" "}
                <Link to="/cadastro/empresa" className="text-primary underline-offset-4 hover:underline">
                  Criar conta
                </Link>
              </p>
            </>
          ) : (
            <>
              {roleLabel && (
                <p className="text-sm text-muted-foreground text-center">{roleLabel}</p>
              )}
              <p className="text-sm text-muted-foreground text-center">
                Código enviado para <strong>{maskDisplay(whatsapp)}</strong>
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
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setStep("whatsapp");
                  setCode("");
                  setRole(null);
                }}
              >
                Voltar
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function maskDisplay(digits: string): string {
  if (digits.length < 11) return digits;
  return `(${digits.slice(0, 2)}) ${digits[2]} ${digits.slice(3, 7)}-${digits.slice(7)}`;
}
