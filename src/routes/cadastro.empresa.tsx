import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PhoneField } from "@/components/auth/PhoneField";
import { registerEmpresaWithAuthRemote } from "@/lib/api/auth.functions";
import { loginAndRedirect } from "@/lib/auth/client-auth";
import { AppLogo } from "@/components/AppLogo";
import { pageTitle } from "@/lib/app-brand";
import { EMPRESA_CATEGORIAS, type EmpresaCategoria } from "@/lib/empresa-categorias";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/cadastro/empresa")({
  head: () => ({ meta: [{ title: pageTitle("Criar conta") }] }),
  component: CadastroEmpresaPage,
});

function CadastroEmpresaPage() {
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [categoria, setCategoria] = useState<EmpresaCategoria>("generico");
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
      const result = await registerEmpresaWithAuthRemote({
        data: { nome, whatsapp, categoria },
      });
      toast.success("Conta criada com sucesso!");
      await loginAndRedirect(result.sessao, result.auth);
    } catch (e) {
      toast.error((e as Error).message ?? "Falha ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  const categoriaInfo = EMPRESA_CATEGORIAS.find((c) => c.value === categoria);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <AppLogo className="mx-auto" />
          <CardTitle className="text-center">Criar conta</CardTitle>
          <CardDescription>
            Nome, tipo de negócio e WhatsApp. Você entra direto no painel.
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
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select value={categoria} onValueChange={(v) => setCategoria(v as EmpresaCategoria)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EMPRESA_CATEGORIAS.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {categoriaInfo && (
              <p className="text-xs text-muted-foreground">{categoriaInfo.description}</p>
            )}
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
