import { createFileRoute } from "@tanstack/react-router";
import { pageTitle } from "@/lib/app-brand";
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useEmpresa, useSaveEmpresa } from "@/lib/store";
import type { Empresa, RedeSocial, RedeSocialTipo } from "@/lib/types";
import { REDE_SOCIAL_LABEL, REDES_SOCIAIS_OPCOES } from "@/lib/types";
import { buscarCep } from "@/lib/viacep";
import {
  documentoTipo,
  maskCep,
  maskDocumento,
  maskTelefone,
  validateCep,
  validateDocumento,
  validateEmail,
  validateTelefone,
} from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/empresa")({
  head: () => ({ meta: [{ title: pageTitle("Empresa") }] }),
  component: EmpresaPage,
});

const blank: Empresa = { id: "", nome: "", endereco: {}, redes_sociais: [] };

function FieldError({ msg }: { msg?: string | null }) {
  if (!msg) return null;
  return <p className="text-xs text-destructive mt-1">{msg}</p>;
}

function EmpresaPage() {
  const { data, isLoading } = useEmpresa();
  const save = useSaveEmpresa();
  const [e, setE] = useState<Empresa>(blank);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepErro, setCepErro] = useState<string | null>(null);
  const [submitErro, setSubmitErro] = useState<string | null>(null);
  const [novaRede, setNovaRede] = useState<RedeSocialTipo | "">("");

  useEffect(() => {
    if (data) setE({ ...data, redes_sociais: data.redes_sociais ?? [] });
  }, [data]);

  const docErro = useMemo(() => validateDocumento(e.documento || ""), [e.documento]);
  const telErro = useMemo(() => validateTelefone(e.telefone || ""), [e.telefone]);
  const emailErro = useMemo(() => validateEmail(e.email || ""), [e.email]);
  const cepErroFmt = useMemo(() => validateCep(e.endereco.cep || ""), [e.endereco.cep]);

  const docHint = useMemo(() => {
    const tipo = documentoTipo(e.documento || "");
    if (!tipo) return null;
    return tipo === "cpf" ? "CPF" : "CNPJ";
  }, [e.documento]);

  const redesUsadas = useMemo(
    () => new Set((e.redes_sociais ?? []).map((r) => r.rede)),
    [e.redes_sociais],
  );

  const redesDisponiveis = REDES_SOCIAIS_OPCOES.filter((r) => !redesUsadas.has(r));

  const onLogo = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setE((cur) => ({ ...cur, logo_url: String(reader.result) }));
    reader.readAsDataURL(file);
  };

  const onCepChange = async (raw: string) => {
    const masked = maskCep(raw);
    setE((cur) => ({ ...cur, endereco: { ...cur.endereco, cep: masked } }));
    setCepErro(null);

    const digits = masked.replace(/\D/g, "");
    if (digits.length !== 8) return;

    setCepLoading(true);
    try {
      const data = await buscarCep(masked);
      if (!data) {
        setCepErro("CEP não encontrado");
        return;
      }
      setE((cur) => ({
        ...cur,
        endereco: {
          ...cur.endereco,
          cep: data.cep || masked,
          rua: data.logradouro || cur.endereco.rua,
          bairro: data.bairro || cur.endereco.bairro,
          cidade: data.localidade || cur.endereco.cidade,
          estado: data.uf || cur.endereco.estado,
          complemento: data.complemento || cur.endereco.complemento,
        },
      }));
    } catch {
      setCepErro("Erro ao buscar CEP. Tente novamente.");
    } finally {
      setCepLoading(false);
    }
  };

  const adicionarRede = () => {
    if (!novaRede || redesUsadas.has(novaRede)) return;
    setE((cur) => ({
      ...cur,
      redes_sociais: [...(cur.redes_sociais ?? []), { rede: novaRede, url: "" }],
    }));
    setNovaRede("");
  };

  const atualizarRede = (idx: number, url: string) => {
    setE((cur) => {
      const redes = [...(cur.redes_sociais ?? [])];
      redes[idx] = { ...redes[idx], url };
      return { ...cur, redes_sociais: redes };
    });
  };

  const removerRede = (idx: number) => {
    setE((cur) => ({
      ...cur,
      redes_sociais: (cur.redes_sociais ?? []).filter((_, i) => i !== idx),
    }));
  };

  const validarFormulario = (): boolean => {
    if (!e.nome.trim()) {
      setSubmitErro("Informe o nome da empresa.");
      return false;
    }
    if (docErro || telErro || emailErro) {
      setSubmitErro("Corrija os campos destacados antes de salvar.");
      return false;
    }
    setSubmitErro(null);
    return true;
  };

  const onSalvar = () => {
    if (!validarFormulario()) return;
    save.mutate(e);
  };

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando…</p>;

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold sm:text-2xl">Dados da empresa</h1>
          <p className="text-sm text-muted-foreground">Usados automaticamente na geração do PDF.</p>
        </div>
        <Button onClick={onSalvar} disabled={save.isPending} className="shrink-0 w-full sm:w-auto">
          {save.isPending ? "Salvando…" : "Salvar"}
        </Button>
      </div>

      {submitErro && (
        <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-3 py-2">
          {submitErro}
        </p>
      )}

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Logo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="aspect-square rounded-md border bg-muted/30 flex items-center justify-center overflow-hidden">
              {e.logo_url ? (
                <img src={e.logo_url} alt="logo" className="max-h-full max-w-full" />
              ) : (
                <span className="text-xs text-muted-foreground">Sem logo</span>
              )}
            </div>
            <Input type="file" accept="image/*" onChange={(ev) => onLogo(ev.target.files?.[0])} />
            {e.logo_url && (
              <Button variant="ghost" size="sm" onClick={() => setE({ ...e, logo_url: undefined })}>
                Remover
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Identificação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Nome*</Label>
                <Input value={e.nome} onChange={(ev) => setE({ ...e, nome: ev.target.value })} />
              </div>

              <div className="space-y-1.5">
                <Label className="flex items-center gap-2">
                  CPF/CNPJ
                  {docHint && !docErro && (
                    <span className="text-xs font-normal text-muted-foreground">({docHint})</span>
                  )}
                </Label>
                <Input
                  value={e.documento || ""}
                  onChange={(ev) => setE({ ...e, documento: maskDocumento(ev.target.value) })}
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                  aria-invalid={!!docErro}
                  className={docErro ? "border-destructive" : ""}
                />
                <FieldError msg={docErro} />
              </div>

              <div className="space-y-1.5">
                <Label>Telefone</Label>
                <Input
                  value={e.telefone || ""}
                  onChange={(ev) => setE({ ...e, telefone: maskTelefone(ev.target.value) })}
                  placeholder="(71) 9 9675-5745"
                  aria-invalid={!!telErro}
                  className={telErro ? "border-destructive" : ""}
                />
                <FieldError msg={telErro} />
              </div>

              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={e.email || ""}
                  onChange={(ev) => setE({ ...e, email: ev.target.value })}
                  placeholder="contato@empresa.com.br"
                  aria-invalid={!!emailErro}
                  className={emailErro ? "border-destructive" : ""}
                />
                <FieldError msg={emailErro} />
              </div>

              <div className="space-y-1.5">
                <Label>Site/Portfólio</Label>
                <Input
                  value={e.site || ""}
                  onChange={(ev) => setE({ ...e, site: ev.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="border-t pt-5 space-y-4">
              <div>
                <p className="text-sm font-medium">Redes sociais</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Links exibidos no PDF do orçamento.
                </p>
              </div>

              {(e.redes_sociais ?? []).length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {(e.redes_sociais ?? []).map((rede, idx) => (
                    <div key={rede.rede} className="space-y-1.5">
                      <Label htmlFor={`rede-${rede.rede}`}>{REDE_SOCIAL_LABEL[rede.rede]}</Label>
                      <div className="flex gap-2">
                        <Input
                          id={`rede-${rede.rede}`}
                          className="min-w-0 flex-1"
                          value={rede.url}
                          onChange={(ev) => atualizarRede(idx, ev.target.value)}
                          placeholder="https://..."
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removerRede(idx)}
                          aria-label={`Remover ${REDE_SOCIAL_LABEL[rede.rede]}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {redesDisponiveis.length > 0 ? (
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:max-w-lg">
                  <Select value={novaRede} onValueChange={(v) => setNovaRede(v as RedeSocialTipo)}>
                    <SelectTrigger className="w-full sm:flex-1">
                      <SelectValue placeholder="Selecione a rede social" />
                    </SelectTrigger>
                    <SelectContent>
                      {redesDisponiveis.map((r) => (
                        <SelectItem key={r} value={r}>
                          {REDE_SOCIAL_LABEL[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="outline"
                    className="shrink-0"
                    onClick={adicionarRede}
                    disabled={!novaRede}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Adicionar
                  </Button>
                </div>
              ) : (
                (e.redes_sociais ?? []).length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Todas as redes disponíveis já foram adicionadas.
                  </p>
                )
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Endereço</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="sm:col-span-1 lg:col-span-2">
            <Label>CEP</Label>
            <Input
              value={e.endereco.cep || ""}
              onChange={(ev) => onCepChange(ev.target.value)}
              placeholder="00000-000"
              disabled={cepLoading}
              aria-invalid={!!(cepErro || cepErroFmt)}
              className={cepErro || cepErroFmt ? "border-destructive" : ""}
            />
            {cepLoading && <p className="text-xs text-muted-foreground mt-1">Buscando endereço…</p>}
            <FieldError msg={cepErroFmt || cepErro} />
          </div>

          <div className="sm:col-span-1 lg:col-span-4">
            <Label>Rua</Label>
            <Input
              value={e.endereco.rua || ""}
              onChange={(ev) => setE({ ...e, endereco: { ...e.endereco, rua: ev.target.value } })}
            />
          </div>

          <div>
            <Label>Número</Label>
            <Input
              value={e.endereco.numero || ""}
              onChange={(ev) =>
                setE({ ...e, endereco: { ...e.endereco, numero: ev.target.value } })
              }
            />
          </div>

          <div className="sm:col-span-1 lg:col-span-2">
            <Label>Complemento</Label>
            <Input
              value={e.endereco.complemento || ""}
              onChange={(ev) =>
                setE({ ...e, endereco: { ...e.endereco, complemento: ev.target.value } })
              }
            />
          </div>

          <div className="sm:col-span-1 lg:col-span-2">
            <Label>Bairro</Label>
            <Input
              value={e.endereco.bairro || ""}
              onChange={(ev) =>
                setE({ ...e, endereco: { ...e.endereco, bairro: ev.target.value } })
              }
            />
          </div>

          <div className="sm:col-span-1 lg:col-span-3">
            <Label>Cidade</Label>
            <Input
              value={e.endereco.cidade || ""}
              onChange={(ev) =>
                setE({ ...e, endereco: { ...e.endereco, cidade: ev.target.value } })
              }
            />
          </div>

          <div>
            <Label>UF</Label>
            <Input
              value={e.endereco.estado || ""}
              maxLength={2}
              onChange={(ev) =>
                setE({ ...e, endereco: { ...e.endereco, estado: ev.target.value.toUpperCase() } })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pagamento & textos padrão</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>Dados bancários / Chave Pix</Label>
            <Textarea
              rows={3}
              value={e.dados_bancarios || ""}
              onChange={(ev) => setE({ ...e, dados_bancarios: ev.target.value })}
            />
          </div>
          <div>
            <Label>Condições comerciais padrão</Label>
            <Textarea
              rows={5}
              value={e.condicoes_padrao || ""}
              onChange={(ev) => setE({ ...e, condicoes_padrao: ev.target.value })}
            />
          </div>
          <div>
            <Label>Observações padrão</Label>
            <Textarea
              rows={3}
              value={e.observacoes_padrao || ""}
              onChange={(ev) => setE({ ...e, observacoes_padrao: ev.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSalvar} disabled={save.isPending}>
          Salvar alterações
        </Button>
      </div>
    </div>
  );
}
