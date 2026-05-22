export type StatusOrcamento = "orcamento" | "em_producao" | "vistoria" | "entregue";

export const STATUS_LABEL: Record<StatusOrcamento, string> = {
  orcamento: "Orçamento",
  em_producao: "Em produção",
  vistoria: "Vistoria",
  entregue: "Entregue",
};

export const STATUS_ORDER: StatusOrcamento[] = ["orcamento", "em_producao", "vistoria", "entregue"];

export type StatusFinanceiro = "pendente" | "pago" | "atrasado" | "parcial";
export type TipoFinanceiro = "pagar" | "receber";
export type UnidadeServico = "serviço" | "hora" | "mensalidade" | "pacote";

export interface Endereco {
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

export interface Empresa {
  id: string;
  nome: string;
  logo_url?: string; // data URL
  documento?: string;
  telefone?: string;
  email?: string;
  endereco: Endereco;
  site?: string;
  redes_sociais?: string;
  dados_bancarios?: string;
  condicoes_padrao?: string;
  observacoes_padrao?: string;
}

export interface Cliente {
  id: string;
  nome: string;
  telefone?: string;
  email?: string;
  documento?: string;
  endereco: Endereco;
  observacoes?: string;
  created_at: string;
}

export interface Servico {
  id: string;
  nome: string;
  descricao?: string;
  valor_padrao: number;
  unidade: UnidadeServico;
  ativo: boolean;
  observacoes?: string;
}

export interface OrcamentoItem {
  id: string;
  servico_id?: string;
  nome: string;
  descricao?: string;
  unidade: UnidadeServico;
  quantidade: number;
  valor_unitario: number;
}

export interface HistoricoStatus {
  data: string;
  de: StatusOrcamento;
  para: StatusOrcamento;
}

export interface Orcamento {
  id: string;
  numero: string;
  cliente_id: string;
  nome_projeto: string;
  descricao?: string;
  status: StatusOrcamento;
  itens: OrcamentoItem[];
  desconto: number;
  acrescimo: number;
  forma_pagamento?: string;
  prazo_entrega?: string;
  validade?: string;
  observacoes?: string;
  condicoes?: string;
  data_criacao: string;
  data_aprovacao?: string;
  data_entrega?: string;
  historico: HistoricoStatus[];
}

export interface Financeiro {
  id: string;
  tipo: TipoFinanceiro;
  descricao: string;
  cliente_id?: string;
  orcamento_id?: string;
  valor: number;
  vencimento: string;
  pagamento?: string;
  status: StatusFinanceiro;
  forma_pagamento?: string;
  observacoes?: string;
}

export function calcSubtotal(itens: OrcamentoItem[]): number {
  return itens.reduce((acc, i) => acc + i.quantidade * i.valor_unitario, 0);
}

export function calcTotal(o: Pick<Orcamento, "itens" | "desconto" | "acrescimo">): number {
  return calcSubtotal(o.itens) - (o.desconto || 0) + (o.acrescimo || 0);
}

export function formatBRL(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR");
}
