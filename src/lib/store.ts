import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  Cliente,
  Empresa,
  Financeiro,
  Orcamento,
  OrcamentoItem,
  Servico,
  StatusOrcamento,
} from "./types";
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
};

const ok = (msg: string) => () => toast.success(msg);
const fail = (msg: string) => (e: unknown) =>
  toast.error(`${msg}: ${(e as Error)?.message ?? "erro"}`);

// ============ Empresa ============
export const useEmpresa = () =>
  useQuery({ queryKey: QK.empresa, queryFn: () => empresaRepo.get() });

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
export const useClientes = () =>
  useQuery({ queryKey: QK.clientes, queryFn: () => clientesRepo.list() });

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
export const useServicos = () =>
  useQuery({ queryKey: QK.servicos, queryFn: () => servicosRepo.list() });

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
export const useOrcamentos = () =>
  useQuery({ queryKey: QK.orcamentos, queryFn: () => orcamentosRepo.list() });

export const useOrcamento = (id: string) =>
  useQuery({
    queryKey: QK.orcamento(id),
    queryFn: () => orcamentosRepo.get(id),
    enabled: !!id,
  });

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
    mutationFn: ({ id, status }: { id: string; status: StatusOrcamento }) =>
      orcamentosRepo.move(id, status),
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: QK.orcamentos });
      qc.invalidateQueries({ queryKey: QK.orcamento(v.id) });
      qc.invalidateQueries({ queryKey: QK.financeiro });
    },
    onError: fail("Falha ao mover"),
  });
}

// ============ Financeiro ============
export const useFinanceiro = () =>
  useQuery({ queryKey: QK.financeiro, queryFn: () => financeiroRepo.list() });

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
    id: crypto.randomUUID(),
    nome: "",
    quantidade: 1,
    valor_unitario: 0,
    unidade: "serviço",
    ...parcial,
  };
}
