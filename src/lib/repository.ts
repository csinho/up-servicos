import { supabase } from "@/integrations/supabase/client";
import type {
  Cliente,
  Empresa,
  Financeiro,
  HistoricoStatus,
  Orcamento,
  OrcamentoItem,
  Servico,
  StatusOrcamento,
  UnidadeServico,
} from "./types";
import { calcTotal } from "./types";

function err<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  return data as T;
}

// ============ Empresa ============
const EMPRESA_ID = "11111111-1111-1111-1111-111111111111";

export const empresaRepo = {
  async get(): Promise<Empresa> {
    const { data, error } = await supabase.from("empresas").select("*").maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      return {
        id: EMPRESA_ID,
        nome: "Minha Empresa",
        endereco: {},
      };
    }
    return {
      id: data.id,
      nome: data.nome,
      logo_url: data.logo_url ?? undefined,
      documento: data.documento ?? undefined,
      telefone: data.telefone ?? undefined,
      email: data.email ?? undefined,
      endereco: (data.endereco as Record<string, string>) ?? {},
      site: data.site ?? undefined,
      redes_sociais: data.redes_sociais ?? undefined,
      dados_bancarios: data.dados_bancarios ?? undefined,
      condicoes_padrao: data.condicoes_padrao ?? undefined,
      observacoes_padrao: data.observacoes_padrao ?? undefined,
    };
  },
  async upsert(e: Empresa): Promise<void> {
    const payload = {
      id: e.id || EMPRESA_ID,
      nome: e.nome,
      logo_url: e.logo_url ?? null,
      documento: e.documento ?? null,
      telefone: e.telefone ?? null,
      email: e.email ?? null,
      endereco: e.endereco ?? {},
      site: e.site ?? null,
      redes_sociais: e.redes_sociais ?? null,
      dados_bancarios: e.dados_bancarios ?? null,
      condicoes_padrao: e.condicoes_padrao ?? null,
      observacoes_padrao: e.observacoes_padrao ?? null,
    };
    const { error } = await supabase.from("empresas").upsert(payload);
    if (error) throw new Error(error.message);
  },
};

// ============ Clientes ============
export const clientesRepo = {
  async list(): Promise<Cliente[]> {
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .order("created_at", { ascending: false });
    return err(data, error).map((r: any) => ({
      id: r.id,
      nome: r.nome,
      telefone: r.telefone ?? undefined,
      email: r.email ?? undefined,
      documento: r.documento ?? undefined,
      endereco: r.endereco ?? {},
      observacoes: r.observacoes ?? undefined,
      created_at: r.created_at,
    }));
  },
  async upsert(c: Cliente): Promise<void> {
    const { error } = await supabase.from("clientes").upsert({
      id: c.id,
      nome: c.nome,
      telefone: c.telefone ?? null,
      email: c.email ?? null,
      documento: c.documento ?? null,
      endereco: c.endereco ?? {},
      observacoes: c.observacoes ?? null,
    });
    if (error) throw new Error(error.message);
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("clientes").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

// ============ Serviços ============
export const servicosRepo = {
  async list(): Promise<Servico[]> {
    const { data, error } = await supabase.from("servicos").select("*").order("nome");
    return err(data, error).map((r: any) => ({
      id: r.id,
      nome: r.nome,
      descricao: r.descricao ?? undefined,
      valor_padrao: Number(r.valor_padrao) || 0,
      unidade: (r.unidade as UnidadeServico) ?? "serviço",
      ativo: !!r.ativo,
      observacoes: r.observacoes ?? undefined,
    }));
  },
  async upsert(s: Servico): Promise<void> {
    const { error } = await supabase.from("servicos").upsert({
      id: s.id,
      nome: s.nome,
      descricao: s.descricao ?? null,
      valor_padrao: s.valor_padrao,
      unidade: s.unidade,
      ativo: s.ativo,
      observacoes: s.observacoes ?? null,
    });
    if (error) throw new Error(error.message);
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("servicos").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

// ============ Orçamentos ============
function mapOrcamento(r: any): Orcamento {
  const itens: OrcamentoItem[] = (r.orcamento_itens ?? [])
    .slice()
    .sort((a: any, b: any) => (a.ordem ?? 0) - (b.ordem ?? 0))
    .map((i: any) => ({
      id: i.id,
      servico_id: i.servico_id ?? undefined,
      nome: i.nome ?? "",
      descricao: i.descricao ?? undefined,
      unidade: (i.unidade as UnidadeServico) ?? "serviço",
      quantidade: Number(i.quantidade) || 0,
      valor_unitario: Number(i.valor_unitario) || 0,
    }));
  const historico: HistoricoStatus[] = (r.historico_status ?? [])
    .slice()
    .sort((a: any, b: any) => +new Date(a.data) - +new Date(b.data))
    .map((h: any) => ({
      data: h.data,
      de: h.status_anterior as StatusOrcamento,
      para: h.status_novo as StatusOrcamento,
    }));
  return {
    id: r.id,
    numero: r.numero,
    cliente_id: r.cliente_id ?? "",
    nome_projeto: r.nome_projeto ?? "",
    descricao: r.descricao ?? undefined,
    status: (r.status as StatusOrcamento) ?? "orcamento",
    itens,
    desconto: Number(r.desconto) || 0,
    acrescimo: Number(r.acrescimo) || 0,
    forma_pagamento: r.forma_pagamento ?? undefined,
    prazo_entrega: r.prazo_entrega ?? undefined,
    validade: r.validade ?? undefined,
    observacoes: r.observacoes ?? undefined,
    condicoes: r.condicoes ?? undefined,
    data_criacao: r.data_criacao,
    data_aprovacao: r.data_aprovacao ?? undefined,
    data_entrega: r.data_entrega ?? undefined,
    historico,
  };
}

const ORC_SELECT = "*, orcamento_itens(*), historico_status(*)";

export const orcamentosRepo = {
  async list(): Promise<Orcamento[]> {
    const { data, error } = await supabase
      .from("orcamentos")
      .select(ORC_SELECT)
      .order("data_criacao", { ascending: false });
    return err(data, error).map(mapOrcamento);
  },
  async get(id: string): Promise<Orcamento | null> {
    const { data, error } = await supabase
      .from("orcamentos")
      .select(ORC_SELECT)
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapOrcamento(data) : null;
  },
  async upsert(o: Orcamento): Promise<void> {
    const head = {
      id: o.id,
      numero: o.numero,
      cliente_id: o.cliente_id || null,
      nome_projeto: o.nome_projeto,
      descricao: o.descricao ?? null,
      status: o.status,
      desconto: o.desconto,
      acrescimo: o.acrescimo,
      forma_pagamento: o.forma_pagamento ?? null,
      prazo_entrega: o.prazo_entrega ?? null,
      validade: o.validade ?? null,
      observacoes: o.observacoes ?? null,
      condicoes: o.condicoes ?? null,
      data_criacao: o.data_criacao,
      data_aprovacao: o.data_aprovacao ?? null,
      data_entrega: o.data_entrega ?? null,
    };
    const { error: e1 } = await supabase.from("orcamentos").upsert(head);
    if (e1) throw new Error(e1.message);

    // substituir itens
    const { error: eDel } = await supabase
      .from("orcamento_itens")
      .delete()
      .eq("orcamento_id", o.id);
    if (eDel) throw new Error(eDel.message);

    if (o.itens.length > 0) {
      const rows = o.itens.map((it, idx) => ({
        id: it.id,
        orcamento_id: o.id,
        servico_id: it.servico_id ?? null,
        nome: it.nome,
        descricao: it.descricao ?? null,
        unidade: it.unidade,
        quantidade: it.quantidade,
        valor_unitario: it.valor_unitario,
        ordem: idx,
      }));
      const { error: eIns } = await supabase.from("orcamento_itens").insert(rows);
      if (eIns) throw new Error(eIns.message);
    }
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("orcamentos").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
  async move(id: string, status: StatusOrcamento): Promise<void> {
    const atual = await this.get(id);
    if (!atual || atual.status === status) return;

    const patch: Record<string, unknown> = { status };
    if (status === "em_producao" && !atual.data_aprovacao) {
      patch.data_aprovacao = new Date().toISOString();
    }
    if (status === "entregue" && !atual.data_entrega) {
      patch.data_entrega = new Date().toISOString();
    }
    const { error: eUp } = await supabase.from("orcamentos").update(patch).eq("id", id);
    if (eUp) throw new Error(eUp.message);

    const { error: eHist } = await supabase.from("historico_status").insert({
      orcamento_id: id,
      status_anterior: atual.status,
      status_novo: status,
      data: new Date().toISOString(),
    });
    if (eHist) throw new Error(eHist.message);

    // criar conta a receber automaticamente ao aprovar
    if (status === "em_producao") {
      const { data: existentes } = await supabase
        .from("financeiro")
        .select("id")
        .eq("orcamento_id", id)
        .eq("tipo", "receber");
      if (!existentes || existentes.length === 0) {
        const total = calcTotal(atual);
        await supabase.from("financeiro").insert({
          tipo: "receber",
          descricao: `Recebimento — ${atual.nome_projeto} (${atual.numero})`,
          cliente_id: atual.cliente_id || null,
          orcamento_id: id,
          valor: total,
          vencimento: atual.prazo_entrega ?? new Date().toISOString(),
          status: "pendente",
          forma_pagamento: atual.forma_pagamento ?? null,
        });
      }
    }
  },
};

// ============ Financeiro ============
export const financeiroRepo = {
  async list(): Promise<Financeiro[]> {
    const { data, error } = await supabase
      .from("financeiro")
      .select("*")
      .order("vencimento", { ascending: true });
    return err(data, error).map((r: any) => ({
      id: r.id,
      tipo: r.tipo,
      descricao: r.descricao ?? "",
      cliente_id: r.cliente_id ?? undefined,
      orcamento_id: r.orcamento_id ?? undefined,
      valor: Number(r.valor) || 0,
      vencimento: r.vencimento,
      pagamento: r.pagamento ?? undefined,
      status: r.status,
      forma_pagamento: r.forma_pagamento ?? undefined,
      observacoes: r.observacoes ?? undefined,
    }));
  },
  async upsert(f: Financeiro): Promise<void> {
    const { error } = await supabase.from("financeiro").upsert({
      id: f.id,
      tipo: f.tipo,
      descricao: f.descricao,
      cliente_id: f.cliente_id ?? null,
      orcamento_id: f.orcamento_id ?? null,
      valor: f.valor,
      vencimento: f.vencimento,
      pagamento: f.pagamento ?? null,
      status: f.status,
      forma_pagamento: f.forma_pagamento ?? null,
      observacoes: f.observacoes ?? null,
    });
    if (error) throw new Error(error.message);
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("financeiro").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
