import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useEmpresaDataReady } from "@/hooks/use-empresa-data-ready";
import type {
  Cliente,
  Empresa,
  Financeiro,
  Orcamento,
  OrcamentoItem,
  Produto,
  Servico,
} from "./types";
import { produtosRepo } from "./produtos.repository";
import { newId } from "./id";
import { moverOrcamentoComBillingRemote } from "@/lib/api/billing.functions";
import { getEmpresaIdFromSessao } from "@/lib/auth/client-session";
import {
  clientesRepo,
  empresaRepo,
  financeiroRepo,
  orcamentosRepo,
  servicosRepo,
} from "./repository";

const QK = {
  empresa: ["empresa"] as const,
  clientes: ["clientes"] as const,
  servicos: ["servicos"] as const,
  orcamentos: ["orcamentos"] as const,
  orcamento: (id: string) => ["orcamentos", id] as const,
  financeiro: ["financeiro"] as const,
  produtos: ["produtos"] as const,
};

const ok = (msg: string) => () => toast.success(msg);
const fail = (msg: string) => (e: unknown) =>
  toast.error(`${msg}: ${(e as Error)?.message ?? "erro"}`);

function useEmpresaQueryGate() {
  const { ready, empresaId } = useEmpresaDataReady();
  return { enabled: ready, empresaId };
}

// ============ Empresa ============
export const useEmpresa = () => {
  const { enabled, empresaId } = useEmpresaQueryGate();
  return useQuery({
    queryKey: empresaId ? [...QK.empresa, empresaId] : QK.empresa,
    queryFn: () => empresaRepo.get(),
    enabled,
  });
};

export function useSaveEmpresa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (e: Empresa) => empresaRepo.upsert(e),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.empresa });
      ok("Dados salvos")();
    },
    onError: fail("Falha ao salvar"),
  });
}

// ============ Clientes ============
export const useClientes = () => {
  const { enabled, empresaId } = useEmpresaQueryGate();
  return useQuery({
    queryKey: empresaId ? [...QK.clientes, empresaId] : QK.clientes,
    queryFn: () => clientesRepo.list(),
    enabled,
  });
};

export function useUpsertCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (c: Cliente) => clientesRepo.upsert(c),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.clientes });
      ok("Cliente salvo")();
    },
    onError: fail("Falha"),
  });
}
export function useRemoveCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => clientesRepo.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.clientes });
      ok("Removido")();
    },
    onError: fail("Falha"),
  });
}

// ============ Serviços ============
export const useServicos = () => {
  const { enabled, empresaId } = useEmpresaQueryGate();
  return useQuery({
    queryKey: empresaId ? [...QK.servicos, empresaId] : QK.servicos,
    queryFn: () => servicosRepo.list(),
    enabled,
  });
};

export function useUpsertServico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (s: Servico) => servicosRepo.upsert(s),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.servicos });
      ok("Serviço salvo")();
    },
    onError: fail("Falha"),
  });
}
export function useRemoveServico() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => servicosRepo.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.servicos });
      ok("Removido")();
    },
    onError: fail("Falha"),
  });
}

// ============ Orçamentos ============
export const useOrcamentos = () => {
  const { enabled, empresaId } = useEmpresaQueryGate();
  return useQuery({
    queryKey: empresaId ? [...QK.orcamentos, empresaId] : QK.orcamentos,
    queryFn: () => orcamentosRepo.list(),
    enabled,
  });
};

export const useOrcamento = (id: string) => {
  const { enabled, empresaId } = useEmpresaQueryGate();
  return useQuery({
    queryKey: empresaId ? [...QK.orcamento(id), empresaId] : QK.orcamento(id),
    queryFn: () => orcamentosRepo.get(id),
    enabled: enabled && !!id,
  });
};

export function useUpsertOrcamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (o: Orcamento) => orcamentosRepo.upsert(o),
    onSuccess: (_d, o) => {
      qc.invalidateQueries({ queryKey: QK.orcamentos });
      qc.invalidateQueries({ queryKey: QK.orcamento(o.id) });
      ok("Orçamento salvo")();
    },
    onError: fail("Falha"),
  });
}
export function useRemoveOrcamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => orcamentosRepo.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.orcamentos });
      ok("Removido")();
    },
    onError: fail("Falha"),
  });
}
export function useMoveOrcamento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      moverOrcamentoComBillingRemote({
        data: { id, status, empresaId: getEmpresaIdFromSessao() ?? undefined },
      }),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: QK.orcamentos });
      qc.invalidateQueries({ queryKey: QK.orcamento(v.id) });
      qc.invalidateQueries({ queryKey: QK.financeiro });
    },
    onError: fail("Falha ao mover"),
  });
}

// ============ Financeiro ============
export const useFinanceiro = () => {
  const { enabled, empresaId } = useEmpresaQueryGate();
  return useQuery({
    queryKey: empresaId ? [...QK.financeiro, empresaId] : QK.financeiro,
    queryFn: () => financeiroRepo.list(),
    enabled,
  });
};

export function useUpsertFinanceiro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (f: Financeiro) => financeiroRepo.upsert(f),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.financeiro });
      ok("Lançamento salvo")();
    },
    onError: fail("Falha"),
  });
}
export function useRemoveFinanceiro() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financeiroRepo.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.financeiro });
      ok("Removido")();
    },
    onError: fail("Falha"),
  });
}

// ============ Helpers ============
export function gerarNumeroOrcamento(existentes: Orcamento[]): string {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const prefix = `ORC-${ymd}-`;
  const seq = existentes.filter((o) => o.numero.startsWith(prefix)).length + 1;
  return `${prefix}${String(seq).padStart(5, "0")}`;
}

export function novoItem(parcial?: Partial<OrcamentoItem>): OrcamentoItem {
  return {
    id: newId(),
    nome: "",
    quantidade: 1,
    valor_unitario: 0,
    unidade: "serviço",
    ...parcial,
  };
}

// ============ Produtos (estoque AT) ============
export const useProdutos = () => {
  const { enabled, empresaId } = useEmpresaQueryGate();
  return useQuery({
    queryKey: empresaId ? [...QK.produtos, empresaId] : QK.produtos,
    queryFn: () => produtosRepo.list(),
    enabled,
  });
};

export function useUpsertProduto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: Produto) => produtosRepo.upsert(p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.produtos });
      ok("Produto salvo")();
    },
    onError: fail("Falha"),
  });
}

export function useRemoveProduto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => produtosRepo.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK.produtos });
      ok("Produto removido")();
    },
    onError: fail("Falha"),
  });
}
