import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/empresa")({
  head: () => ({ meta: [{ title: "Empresa — Freela OS" }] }),
  component: EmpresaPage,
});

function EmpresaPage() {
  const { empresa, setEmpresa } = useApp();
  const [e, setE] = useState(empresa);

  const onLogo = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setE({ ...e, logo_url: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const save = () => { setEmpresa(e); toast.success("Dados salvos"); };

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Dados da empresa</h1>
          <p className="text-sm text-muted-foreground">Usados automaticamente na geração do PDF.</p>
        </div>
        <Button onClick={save}>Salvar</Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Logo</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="aspect-square rounded-md border bg-muted/30 flex items-center justify-center overflow-hidden">
              {e.logo_url ? <img src={e.logo_url} alt="logo" className="max-h-full max-w-full" /> : <span className="text-xs text-muted-foreground">Sem logo</span>}
            </div>
            <Input type="file" accept="image/*" onChange={(ev) => onLogo(ev.target.files?.[0])} />
            {e.logo_url && <Button variant="ghost" size="sm" onClick={() => setE({ ...e, logo_url: undefined })}>Remover</Button>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Identificação</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><Label>Nome*</Label><Input value={e.nome} onChange={(ev) => setE({ ...e, nome: ev.target.value })} /></div>
            <div><Label>CPF/CNPJ</Label><Input value={e.documento || ""} onChange={(ev) => setE({ ...e, documento: ev.target.value })} /></div>
            <div><Label>Telefone</Label><Input value={e.telefone || ""} onChange={(ev) => setE({ ...e, telefone: ev.target.value })} /></div>
            <div><Label>E-mail</Label><Input value={e.email || ""} onChange={(ev) => setE({ ...e, email: ev.target.value })} /></div>
            <div><Label>Site/Portfólio</Label><Input value={e.site || ""} onChange={(ev) => setE({ ...e, site: ev.target.value })} /></div>
            <div className="col-span-2"><Label>Redes sociais</Label><Input value={e.redes_sociais || ""} onChange={(ev) => setE({ ...e, redes_sociais: ev.target.value })} /></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Endereço</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-6 gap-3">
          <div className="col-span-4"><Label>Rua</Label><Input value={e.endereco.rua || ""} onChange={(ev) => setE({ ...e, endereco: { ...e.endereco, rua: ev.target.value } })} /></div>
          <div className="col-span-1"><Label>Número</Label><Input value={e.endereco.numero || ""} onChange={(ev) => setE({ ...e, endereco: { ...e.endereco, numero: ev.target.value } })} /></div>
          <div className="col-span-1"><Label>CEP</Label><Input value={e.endereco.cep || ""} onChange={(ev) => setE({ ...e, endereco: { ...e.endereco, cep: ev.target.value } })} /></div>
          <div className="col-span-2"><Label>Bairro</Label><Input value={e.endereco.bairro || ""} onChange={(ev) => setE({ ...e, endereco: { ...e.endereco, bairro: ev.target.value } })} /></div>
          <div className="col-span-3"><Label>Cidade</Label><Input value={e.endereco.cidade || ""} onChange={(ev) => setE({ ...e, endereco: { ...e.endereco, cidade: ev.target.value } })} /></div>
          <div className="col-span-1"><Label>UF</Label><Input value={e.endereco.estado || ""} onChange={(ev) => setE({ ...e, endereco: { ...e.endereco, estado: ev.target.value } })} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Pagamento & textos padrão</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>Dados bancários / Chave Pix</Label><Textarea rows={3} value={e.dados_bancarios || ""} onChange={(ev) => setE({ ...e, dados_bancarios: ev.target.value })} /></div>
          <div><Label>Condições comerciais padrão</Label><Textarea rows={5} value={e.condicoes_padrao || ""} onChange={(ev) => setE({ ...e, condicoes_padrao: ev.target.value })} /></div>
          <div><Label>Observações padrão</Label><Textarea rows={3} value={e.observacoes_padrao || ""} onChange={(ev) => setE({ ...e, observacoes_padrao: ev.target.value })} /></div>
        </CardContent>
      </Card>

      <div className="flex justify-end"><Button onClick={save}>Salvar alterações</Button></div>
    </div>
  );
}
