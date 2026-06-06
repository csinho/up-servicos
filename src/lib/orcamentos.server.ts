import { getSupabaseServer } from "@/integrations/supabase/server";
import { resolveEmpresaId } from "@/lib/billing/empresa.server";
import { getCategoriaConfig, normalizeEmpresaCategoria } from "@/lib/empresa-categorias";
import type { StatusOrcamento } from "@/lib/empresa-categorias/types";

async function garantirLancamentoReceber(
  sb: ReturnType<typeof getSupabaseServer>,
  params: {
    orcamentoId: string;
    empresaId: string;
    nomeProjeto: string;
    numero: string;
    clienteId?: string | null;
    prazoEntrega?: string | null;
    formaPagamento?: string | null;
    total: number;
  },
): Promise<void> {
  const { data: existentes } = await sb
    .from("financeiro")
    .select("id")
    .eq("orcamento_id", params.orcamentoId)
    .eq("tipo", "receber");

  const payload = {
    tipo: "receber" as const,
    empresa_id: params.empresaId,
    descricao: `Pedido — ${params.nomeProjeto} (${params.numero})`,
    cliente_id: params.clienteId || null,
    orcamento_id: params.orcamentoId,
    valor: params.total,
    vencimento: params.prazoEntrega ?? new Date().toISOString(),
    status: "pendente" as const,
    forma_pagamento: params.formaPagamento ?? null,
    origem: "automatico" as const,
  };

  if (!existentes?.length) {
    const { error: eFin } = await sb.from("financeiro").insert(payload);
    if (eFin) throw new Error(eFin.message);
    return;
  }

  const { error: eUpFin } = await sb
    .from("financeiro")
    .update({
      valor: payload.valor,
      descricao: payload.descricao,
      vencimento: payload.vencimento,
    })
    .eq("orcamento_id", params.orcamentoId)
    .eq("tipo", "receber");
  if (eUpFin) throw new Error(eUpFin.message);
}

async function baixarEstoqueOs(
  sb: ReturnType<typeof getSupabaseServer>,
  orcamentoId: string,
): Promise<void> {
  const { data: itens, error } = await sb
    .from("orcamento_itens")
    .select("produto_id, quantidade")
    .eq("orcamento_id", orcamentoId)
    .not("produto_id", "is", null);
  if (error) throw new Error(error.message);
  for (const item of itens ?? []) {
    if (!item.produto_id) continue;
    const { data: prod, error: pErr } = await sb
      .from("produtos")
      .select("quantidade")
      .eq("id", item.produto_id)
      .maybeSingle();
    if (pErr) throw new Error(pErr.message);
    if (!prod) continue;
    const nova = Math.max(0, Number(prod.quantidade) - Number(item.quantidade));
    const { error: uErr } = await sb
      .from("produtos")
      .update({ quantidade: nova })
      .eq("id", item.produto_id);
    if (uErr) throw new Error(uErr.message);
  }
}

export async function moverOrcamentoServer(
  id: string,
  status: StatusOrcamento,
  empresaIdExplicit?: string,
  env?: Record<string, string | undefined>,
): Promise<void> {
  const sb = getSupabaseServer(env);

  const { data: atual, error: getErr } = await sb
    .from("orcamentos")
    .select("*, orcamento_itens(*)")
    .eq("id", id)
    .maybeSingle();

  if (getErr) throw new Error(getErr.message);
  if (!atual) return;

  const empresaId = String(atual.empresa_id ?? resolveEmpresaId(empresaIdExplicit));

  const { data: empRow } = await sb
    .from("empresas")
    .select("categoria")
    .eq("id", empresaId)
    .maybeSingle();
  const categoria = normalizeEmpresaCategoria(empRow?.categoria);
  const catConfig = getCategoriaConfig(categoria);
  const billingTrigger = catConfig.billingTriggerStatus;

  const itensPreview = (atual.orcamento_itens ?? []).map((i: Record<string, unknown>) => ({
    quantidade: Number(i.quantidade) || 0,
    valor_unitario: Number(i.valor_unitario) || 0,
  }));
  const subPreview = itensPreview.reduce(
    (s: number, i: { quantidade: number; valor_unitario: number }) =>
      s + i.quantidade * i.valor_unitario,
    0,
  );
  const descontoPctPreview = Number(atual.desconto_percentual) || 0;
  const totalPreview =
    subPreview - subPreview * (descontoPctPreview / 100) + (Number(atual.acrescimo) || 0);

  if (atual.status === status && status === billingTrigger) {
    await garantirLancamentoReceber(sb, {
      orcamentoId: id,
      empresaId,
      nomeProjeto: atual.nome_projeto ?? "",
      numero: atual.numero,
      clienteId: atual.cliente_id,
      prazoEntrega: atual.prazo_entrega,
      formaPagamento: atual.forma_pagamento,
      total: totalPreview,
    });
    return;
  }

  if (atual.status === status) return;

  const patch: Record<string, unknown> = { status };
  const aprovacaoStatus =
    categoria === "assistencia_tecnica" ? "entrada" : "em_producao";
  if (status === aprovacaoStatus && !atual.data_aprovacao) {
    patch.data_aprovacao = new Date().toISOString();
  }
  if (status === "entregue" && !atual.data_entrega) {
    patch.data_entrega = new Date().toISOString();
  }

  const { error: eUp } = await sb.from("orcamentos").update(patch).eq("id", id);
  if (eUp) throw new Error(eUp.message);

  const { error: eHist } = await sb.from("historico_status").insert({
    orcamento_id: id,
    status_anterior: atual.status,
    status_novo: status,
    data: new Date().toISOString(),
  });
  if (eHist) throw new Error(eHist.message);

  const itens = (atual.orcamento_itens ?? []).map((i: Record<string, unknown>) => ({
    quantidade: Number(i.quantidade) || 0,
    valor_unitario: Number(i.valor_unitario) || 0,
  }));
  const sub = itens.reduce(
    (s: number, i: { quantidade: number; valor_unitario: number }) =>
      s + i.quantidade * i.valor_unitario,
    0,
  );
  const descontoPct = Number(atual.desconto_percentual) || 0;
  const total = sub - sub * (descontoPct / 100) + (Number(atual.acrescimo) || 0);

  if (status === billingTrigger) {
    await garantirLancamentoReceber(sb, {
      orcamentoId: id,
      empresaId,
      nomeProjeto: atual.nome_projeto ?? "",
      numero: atual.numero,
      clienteId: atual.cliente_id,
      prazoEntrega: atual.prazo_entrega,
      formaPagamento: atual.forma_pagamento,
      total,
    });
  }

  if (status === "entregue") {
    const { error: ePago } = await sb
      .from("financeiro")
      .update({
        status: "pago",
        pagamento: new Date().toISOString(),
      })
      .eq("orcamento_id", id)
      .eq("tipo", "receber");
    if (ePago) throw new Error(ePago.message);

    if (categoria === "assistencia_tecnica") {
      await baixarEstoqueOs(sb, id);
    }
  }
}
