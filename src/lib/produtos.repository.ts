import { supabase } from "@/integrations/supabase/client";
import { getEmpresaIdFromSessao } from "@/lib/auth/client-session";
import { normalizeEmpresaCategoria, type CategoriaProduto } from "@/lib/empresa-categorias";
import type { Produto } from "./types";

function err<T>(data: T | null, error: { message: string } | null): T {
  if (error) throw new Error(error.message);
  return data as T;
}

function requireEmpresaId(): string {
  const id = getEmpresaIdFromSessao();
  if (!id) throw new Error("Sessão da empresa não encontrada.");
  return id;
}

function mapProduto(r: Record<string, unknown>): Produto {
  return {
    id: String(r.id),
    nome: String(r.nome),
    categoria: (r.categoria as CategoriaProduto) ?? "outro",
    quantidade: Number(r.quantidade) || 0,
    qtd_minima: Number(r.qtd_minima) || 0,
    preco_custo: Number(r.preco_custo) || 0,
    preco_venda: Number(r.preco_venda) || 0,
    ativo: r.ativo !== false,
    created_at: r.created_at ? String(r.created_at) : undefined,
  };
}

export const produtosRepo = {
  async list(): Promise<Produto[]> {
    const empresaId = requireEmpresaId();
    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("ativo", true)
      .order("nome");
    return err(data, error).map(mapProduto);
  },

  async upsert(p: Produto): Promise<void> {
    const empresaId = requireEmpresaId();
    const { error } = await supabase.from("produtos").upsert({
      id: p.id,
      empresa_id: empresaId,
      nome: p.nome,
      categoria: p.categoria,
      quantidade: p.quantidade,
      qtd_minima: p.qtd_minima,
      preco_custo: p.preco_custo,
      preco_venda: p.preco_venda,
      ativo: p.ativo,
    });
    if (error) throw new Error(error.message);
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("produtos").update({ ativo: false }).eq("id", id);
    if (error) throw new Error(error.message);
  },

  async adjustQuantidade(id: string, delta: number): Promise<void> {
    const empresaId = requireEmpresaId();
    const { data, error: getErr } = await supabase
      .from("produtos")
      .select("quantidade")
      .eq("id", id)
      .eq("empresa_id", empresaId)
      .maybeSingle();
    if (getErr) throw new Error(getErr.message);
    if (!data) return;
    const nova = Math.max(0, Number(data.quantidade) + delta);
    const { error } = await supabase.from("produtos").update({ quantidade: nova }).eq("id", id);
    if (error) throw new Error(error.message);
  },
};

export function isEstoqueBaixo(p: Produto): boolean {
  return p.qtd_minima > 0 && p.quantidade <= p.qtd_minima;
}
