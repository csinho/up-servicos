import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PhoneField } from "@/components/auth/PhoneField";
import { registerEmpresaWithAuthRemote } from "@/lib/api/auth.functions";
import { applyAuthSession } from "@/lib/auth/client-auth";
import { AppLogo } from "@/components/AppLogo";
import { pageTitle } from "@/lib/app-brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/cadastro/empresa")({
  head: () => ({ meta: [{ title: pageTitle("Criar conta") }] }),
  component: CadastroEmpresaPage,
});

function CadastroEmpresaPage() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (nome.trim().length < 2) {
      toast.error("Informe o nome da empresa.");
      return;
    }
    if (whatsapp.length < 11) {
      toast.error("Informe o WhatsApp completo.");
      return;
    }
    setLoading(true);
    try {
      const result = await registerEmpresaWithAuthRemote({ data: { nome, whatsapp } });
      await applyAuthSession(result.sessao, result.auth);
      toast.success("Conta criada com sucesso!");
      void navigate({ to: "/" });
    } catch (e) {
      toast.error((e as Error).message ?? "Falha ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <AppLogo className="mx-auto" />
          <CardTitle className="text-center">Criar conta</CardTitle>
          <CardDescription>
            Primeiro acesso — nome da empresa e WhatsApp. Você entra direto no painel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome-empresa">Nome da empresa</Label>
            <Input
              id="nome-empresa"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Sua Empresa Ltda"
            />
          </div>
          <PhoneField value={whatsapp} onChange={(digits) => setWhatsapp(digits)} />
          <Button type="button" className="w-full" disabled={loading} onClick={() => void submit()}>
            Criar conta e entrar
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="text-primary underline-offset-4 hover:underline">
              Fazer login
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
