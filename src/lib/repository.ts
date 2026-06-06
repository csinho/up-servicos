import { supabase } from "@/integrations/supabase/client";
import { getEmpresaIdFromSessao } from "@/lib/auth/client-session";
import { normalizeEmpresaCategoria } from "@/lib/empresa-categorias";
import type {
  Cliente,
  Empresa,
  Financeiro,
  HistoricoStatus,
  Orcamento,
  OrcamentoAssistencia,
  OrcamentoItem,
  Servico,
  UnidadeServico,
} from "./types";
import {
  calcDescontoValor,
  calcSubtotal,
  calcTotal,
  normalizeGarantiaUnidade,
  parseRedesSociais,
  serializeRedesSociais,
} from "./types";

function err<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  return data as T;
}

// ============ Empresa ============
function requireEmpresaId(): string {
  const empresaId = getEmpresaIdFromSessao();
  if (!empresaId) throw new Error("Sessão da empresa não encontrada.");
  return empresaId;
}

export const empresaRepo = {
  async get(): Promise<Empresa> {
    const empresaId = requireEmpresaId();
    const { data, error } = await supabase.from("empresas").select("*").eq("id", empresaId).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      return {
        id: empresaId,
        nome: "Minha Empresa",
        categoria: "generico",
        endereco: {},
      };
    }
    return {
      id: data.id,
      nome: data.nome,
      categoria: normalizeEmpresaCategoria(data.categoria),
      logo_url: data.logo_url ?? undefined,
      documento: data.documento ?? undefined,
      telefone: data.telefone ?? undefined,
      email: data.email ?? undefined,
      endereco: (data.endereco as Record<string, string>) ?? {},
      site: data.site ?? undefined,
      redes_sociais: parseRedesSociais(data.redes_sociais),
      dados_bancarios: data.dados_bancarios ?? undefined,
      condicoes_padrao: data.condicoes_padrao ?? undefined,
      observacoes_padrao: data.observacoes_padrao ?? undefined,
    };
  },
  async upsert(e: Empresa): Promise<void> {
    const empresaId = requireEmpresaId();
    const payload = {
      id: e.id || empresaId,
      nome: e.nome,
      logo_url: e.logo_url ?? null,
      documento: e.documento ?? null,
      telefone: e.telefone ?? null,
      email: e.email ?? null,
      endereco: e.endereco ?? {},
      site: e.site ?? null,
      redes_sociais: serializeRedesSociais(e.redes_sociais ?? []) ?? null,
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
    const empresaId = requireEmpresaId();
    const { data, error } = await supabase
      .from("clientes")
      .select("*")
      .eq("empresa_id", empresaId)
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
    const empresaId = requireEmpresaId();
    const { error } = await supabase.from("clientes").upsert({
      id: c.id,
      empresa_id: empresaId,
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
    const empresaId = requireEmpresaId();
    const { data, error } = await supabase.from("servicos").select("*").eq("empresa_id", empresaId).order("nome");
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
    const empresaId = requireEmpresaId();
    const { error } = await supabase.from("servicos").upsert({
      id: s.id,
      empresa_id: empresaId,
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
      produto_id: i.produto_id ?? undefined,
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
      de: h.status_anterior,
      para: h.status_novo,
    }));
  const assistRaw = Array.isArray(r.orcamento_assistencia)
    ? r.orcamento_assistencia[0]
    : r.orcamento_assistencia;
  const assistencia: OrcamentoAssistencia | undefined = assistRaw
    ? {
        orcamento_id: r.id,
        aparelho_marca: assistRaw.aparelho_marca ?? undefined,
        aparelho_modelo: assistRaw.aparelho_modelo ?? undefined,
        imei: assistRaw.imei ?? undefined,
        defeito_relatado: assistRaw.defeito_relatado ?? undefined,
        acessorios: assistRaw.acessorios ?? undefined,
        senha_dispositivo: assistRaw.senha_dispositivo ?? undefined,
        checklist_entrada: (assistRaw.checklist_entrada as Record<string, boolean>) ?? undefined,
      }
    : undefined;
  return {
    id: r.id,
    numero: r.numero,
    cliente_id: r.cliente_id ?? "",
    nome_projeto: r.nome_projeto ?? "",
    descricao: r.descricao ?? undefined,
    status: r.status ?? "orcamento",
    assistencia,
    itens,
    desconto_percentual: resolveDescontoPercentual(r, itens),
    acrescimo: Number(r.acrescimo) || 0,
    forma_pagamento: r.forma_pagamento ?? undefined,
    prazo_entrega: r.prazo_entrega ?? undefined,
    validade: r.validade ?? undefined,
    garantia_quantidade:
      r.garantia_quantidade != null ? Number(r.garantia_quantidade) : undefined,
    garantia_unidade: normalizeGarantiaUnidade(r.garantia_unidade as string | null),
    observacoes: r.observacoes ?? undefined,
    condicoes: r.condicoes ?? undefined,
    data_criacao: r.data_criacao,
    data_aprovacao: r.data_aprovacao ?? undefined,
    data_entrega: r.data_entrega ?? undefined,
    historico,
  };
}

function resolveDescontoPercentual(
  r: { desconto_percentual?: unknown; desconto?: unknown },
  itens: Orcamento["itens"],
): number {
  if (r.desconto_percentual != null && r.desconto_percentual !== "") {
    return Math.min(100, Number(r.desconto_percentual) || 0);
  }
  const sub = calcSubtotal(itens);
  const legacy = Number(r.desconto) || 0;
  if (legacy <= 0 || sub <= 0) return 0;
  if (legacy <= 100) return legacy;
  return Math.min(100, Math.round((legacy / sub) * 10000) / 100);
}

const ORC_SELECT = "*, orcamento_itens(*), historico_status(*), orcamento_assistencia(*)";

export const orcamentosRepo = {
  async list(): Promise<Orcamento[]> {
    const empresaId = requireEmpresaId();
    const { data, error } = await supabase
      .from("orcamentos")
      .select(ORC_SELECT)
      .eq("empresa_id", empresaId)
      .order("data_criacao", { ascending: false });
    return err(data, error).map(mapOrcamento);
  },
  async get(id: string): Promise<Orcamento | null> {
    const empresaId = requireEmpresaId();
    const { data, error } = await supabase
      .from("orcamentos")
      .select(ORC_SELECT)
      .eq("id", id)
      .eq("empresa_id", empresaId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? mapOrcamento(data) : null;
  },
  async upsert(o: Orcamento): Promise<void> {
    const empresaId = requireEmpresaId();
    const sub = calcSubtotal(o.itens);
    const descontoValor = calcDescontoValor(sub, o.desconto_percentual ?? 0);
    const head: Record<string, unknown> = {
      id: o.id,
      empresa_id: empresaId,
      numero: o.numero,
      cliente_id: o.cliente_id || null,
      nome_projeto: o.nome_projeto,
      descricao: o.descricao ?? null,
      status: o.status,
      desconto: descontoValor,
      desconto_percentual: o.desconto_percentual ?? 0,
      acrescimo: o.acrescimo,
      forma_pagamento: o.forma_pagamento ?? null,
      prazo_entrega: o.prazo_entrega ?? null,
      validade: o.validade ?? null,
      garantia_quantidade: o.garantia_quantidade ?? null,
      garantia_unidade: o.garantia_unidade ?? null,
      observacoes: o.observacoes ?? null,
      condicoes: o.condicoes ?? null,
      data_criacao: o.data_criacao,
      data_aprovacao: o.data_aprovacao ?? null,
      data_entrega: o.data_entrega ?? null,
    };
    const { error: e1 } = await supabase.from("orcamentos").upsert(head);
    if (e1) throw new Error(e1.message);

    if (o.assistencia) {
      const { error: eAssist } = await supabase.from("orcamento_assistencia").upsert({
        orcamento_id: o.id,
        aparelho_marca: o.assistencia.aparelho_marca ?? null,
        aparelho_modelo: o.assistencia.aparelho_modelo ?? null,
        imei: o.assistencia.imei ?? null,
        defeito_relatado: o.assistencia.defeito_relatado ?? null,
        acessorios: o.assistencia.acessorios ?? null,
        senha_dispositivo: o.assistencia.senha_dispositivo ?? null,
        checklist_entrada: o.assistencia.checklist_entrada ?? {},
      });
      if (eAssist) throw new Error(eAssist.message);
    }

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
        produto_id: it.produto_id ?? null,
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

    if (o.status !== "orcamento") {
      const total = calcTotal(o);
      const payload = {
        tipo: "receber" as const,
        empresa_id: empresaId,
        descricao: `Pedido — ${o.nome_projeto} (${o.numero})`,
        cliente_id: o.cliente_id || null,
        orcamento_id: o.id,
        valor: total,
        vencimento: o.prazo_entrega ?? new Date().toISOString(),
        status: "pendente" as const,
        forma_pagamento: o.forma_pagamento ?? null,
      };
      const { data: existentes } = await supabase
        .from("financeiro")
        .select("id")
        .eq("orcamento_id", o.id)
        .eq("tipo", "receber");
      if (existentes?.length) {
        const { error: eFin } = await supabase
          .from("financeiro")
          .update({
            valor: payload.valor,
            descricao: payload.descricao,
            vencimento: payload.vencimento,
          })
          .eq("orcamento_id", o.id)
          .eq("tipo", "receber");
        if (eFin) throw new Error(eFin.message);
      } else {
        const { error: eFin } = await supabase.from("financeiro").insert(payload);
        if (eFin) throw new Error(eFin.message);
      }
    }
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("orcamentos").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
  async move(id: string, status: string): Promise<void> {
    const empresaId = requireEmpresaId();
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

    const total = calcTotal(atual);

    // Pedido aprovado (em produção): gera lançamento a receber
    if (status === "em_producao") {
      const { data: existentes } = await supabase
        .from("financeiro")
        .select("id")
        .eq("orcamento_id", id)
        .eq("tipo", "receber");
      if (!existentes || existentes.length === 0) {
        const { error: eFin } = await supabase.from("financeiro").insert({
          tipo: "receber",
          empresa_id: empresaId,
          descricao: `Pedido — ${atual.nome_projeto} (${atual.numero})`,
          cliente_id: atual.cliente_id || null,
          orcamento_id: id,
          valor: total,
          vencimento: atual.prazo_entrega ?? new Date().toISOString(),
          status: "pendente",
          forma_pagamento: atual.forma_pagamento ?? null,
        });
        if (eFin) throw new Error(eFin.message);
      } else {
        const { error: eUpFin } = await supabase
          .from("financeiro")
          .update({
            valor: total,
            descricao: `Pedido — ${atual.nome_projeto} (${atual.numero})`,
            vencimento: atual.prazo_entrega ?? new Date().toISOString(),
          })
          .eq("orcamento_id", id)
          .eq("tipo", "receber");
        if (eUpFin) throw new Error(eUpFin.message);
      }
    }

    // Entregue: marca o lançamento do pedido como pago
    if (status === "entregue") {
      const { error: ePago } = await supabase
        .from("financeiro")
        .update({
          status: "pago",
          pagamento: new Date().toISOString(),
        })
        .eq("orcamento_id", id)
        .eq("tipo", "receber");
      if (ePago) throw new Error(ePago.message);
    }
  },
};

// ============ Financeiro ============
export const financeiroRepo = {
  async list(): Promise<Financeiro[]> {
    const empresaId = requireEmpresaId();
    const { data, error } = await supabase
      .from("financeiro")
      .select("*")
      .eq("empresa_id", empresaId)
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
      origem: r.origem ?? (r.orcamento_id ? "automatico" : "manual"),
      categoria_caixa: r.categoria_caixa ?? undefined,
    }));
  },
  async upsert(f: Financeiro): Promise<void> {
    const empresaId = requireEmpresaId();
    const { error } = await supabase.from("financeiro").upsert({
      id: f.id,
      empresa_id: empresaId,
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
      origem: f.origem ?? (f.orcamento_id ? "automatico" : "manual"),
      categoria_caixa: f.categoria_caixa ?? null,
    });
    if (error) throw new Error(error.message);
  },
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("financeiro").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};
