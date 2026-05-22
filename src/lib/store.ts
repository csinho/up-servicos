import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Cliente,
  Empresa,
  Financeiro,
  Orcamento,
  OrcamentoItem,
  Servico,
  StatusOrcamento,
} from "./types";
import { seedClientes, seedEmpresa, seedFinanceiro, seedOrcamentos, seedServicos } from "./seed";

interface AppState {
  empresa: Empresa;
  clientes: Cliente[];
  servicos: Servico[];
  orcamentos: Orcamento[];
  financeiro: Financeiro[];

  setEmpresa: (e: Empresa) => void;

  upsertCliente: (c: Cliente) => void;
  removeCliente: (id: string) => void;

  upsertServico: (s: Servico) => void;
  removeServico: (id: string) => void;

  upsertOrcamento: (o: Orcamento) => void;
  removeOrcamento: (id: string) => void;
  moveOrcamento: (id: string, status: StatusOrcamento) => void;

  upsertFinanceiro: (f: Financeiro) => void;
  removeFinanceiro: (id: string) => void;

  resetSeed: () => void;
}

const initial = {
  empresa: seedEmpresa,
  clientes: seedClientes,
  servicos: seedServicos,
  orcamentos: seedOrcamentos,
  financeiro: seedFinanceiro,
};

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      ...initial,
      setEmpresa: (empresa) => set({ empresa }),
      upsertCliente: (c) =>
        set((s) => {
          const i = s.clientes.findIndex((x) => x.id === c.id);
          const clientes = [...s.clientes];
          if (i >= 0) clientes[i] = c;
          else clientes.unshift(c);
          return { clientes };
        }),
      removeCliente: (id) => set((s) => ({ clientes: s.clientes.filter((c) => c.id !== id) })),

      upsertServico: (sv) =>
        set((s) => {
          const i = s.servicos.findIndex((x) => x.id === sv.id);
          const servicos = [...s.servicos];
          if (i >= 0) servicos[i] = sv;
          else servicos.unshift(sv);
          return { servicos };
        }),
      removeServico: (id) => set((s) => ({ servicos: s.servicos.filter((x) => x.id !== id) })),

      upsertOrcamento: (o) =>
        set((s) => {
          const i = s.orcamentos.findIndex((x) => x.id === o.id);
          const orcamentos = [...s.orcamentos];
          if (i >= 0) orcamentos[i] = o;
          else orcamentos.unshift(o);
          return { orcamentos };
        }),
      removeOrcamento: (id) =>
        set((s) => ({ orcamentos: s.orcamentos.filter((x) => x.id !== id) })),

      moveOrcamento: (id, status) =>
        set((s) => {
          const orcamentos = s.orcamentos.map((o) => {
            if (o.id !== id) return o;
            if (o.status === status) return o;
            const updated: Orcamento = {
              ...o,
              status,
              historico: [
                ...o.historico,
                { data: new Date().toISOString(), de: o.status, para: status },
              ],
            };
            if (status === "em_producao" && !o.data_aprovacao) {
              updated.data_aprovacao = new Date().toISOString();
            }
            if (status === "entregue" && !o.data_entrega) {
              updated.data_entrega = new Date().toISOString();
            }
            return updated;
          });

          // auto-criar conta a receber ao aprovar
          let financeiro = s.financeiro;
          const o = orcamentos.find((x) => x.id === id);
          if (
            o &&
            status === "em_producao" &&
            !s.financeiro.some((f) => f.orcamento_id === o.id && f.tipo === "receber")
          ) {
            const total =
              o.itens.reduce((a, i) => a + i.quantidade * i.valor_unitario, 0) -
              o.desconto +
              o.acrescimo;
            financeiro = [
              {
                id: crypto.randomUUID(),
                tipo: "receber",
                descricao: `Recebimento — ${o.nome_projeto} (${o.numero})`,
                cliente_id: o.cliente_id,
                orcamento_id: o.id,
                valor: total,
                vencimento: o.prazo_entrega || new Date().toISOString(),
                status: "pendente",
                forma_pagamento: o.forma_pagamento,
              },
              ...s.financeiro,
            ];
          }

          return { orcamentos, financeiro };
        }),

      upsertFinanceiro: (f) =>
        set((s) => {
          const i = s.financeiro.findIndex((x) => x.id === f.id);
          const financeiro = [...s.financeiro];
          if (i >= 0) financeiro[i] = f;
          else financeiro.unshift(f);
          return { financeiro };
        }),
      removeFinanceiro: (id) =>
        set((s) => ({ financeiro: s.financeiro.filter((x) => x.id !== id) })),

      resetSeed: () => set(initial),
    }),
    { name: "freela-os-v1" }
  )
);

export function gerarNumeroOrcamento(existentes: Orcamento[]): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const prefix = `ORC-${ymd}-`;
  const seq = existentes.filter((o) => o.numero.startsWith(prefix)).length + 1;
  return `${prefix}${String(seq).padStart(5, "0")}`;
}

export function novoItem(parcial?: Partial<OrcamentoItem>): OrcamentoItem {
  return {
    id: crypto.randomUUID(),
    nome: "",
    quantidade: 1,
    valor_unitario: 0,
    unidade: "serviço",
    ...parcial,
  };
}
