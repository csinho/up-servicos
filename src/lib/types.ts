export type {
  CategoriaCaixa,
  CategoriaProduto,
  EmpresaCategoria,
  OrigemFinanceiro,
  StatusOrcamento,
} from "./empresa-categorias/types";

import type { StatusOrcamento as StatusOrcamentoType } from "./empresa-categorias/types";
import { genericoConfig } from "./empresa-categorias/generico";

/** Labels padrão (empresa genérica) — prefira getStatusLabel(categoria) em telas multi-categoria. */
export const STATUS_LABEL: Record<string, string> = genericoConfig.statusLabels;

export const STATUS_ORDER: StatusOrcamentoType[] = genericoConfig.statusOrder;

/** Enquanto status é `orcamento`, o documento é um orçamento; depois vira pedido/OS. */
export function isFaseOrcamento(status: string): boolean {
  return status === "orcamento";
}

export function labelDocumento(status: string): "Orçamento" | "Pedido" {
  return isFaseOrcamento(status) ? "Orçamento" : "Pedido";
}

export function labelDocumentoLower(status: string): "orçamento" | "pedido" {
  return isFaseOrcamento(status) ? "orçamento" : "pedido";
}

export type StatusFinanceiro = "pendente" | "pago" | "atrasado" | "parcial";
export type TipoFinanceiro = "pagar" | "receber";
export type UnidadeServico = "serviço" | "hora" | "mensalidade" | "pacote" | "peça";

export const FORMAS_PAGAMENTO = ["Pix", "Débito", "Crédito"] as const;
export type FormaPagamento = (typeof FORMAS_PAGAMENTO)[number];

export type GarantiaUnidade = "dia" | "semana" | "mes" | "ano";

export const GARANTIA_UNIDADES: GarantiaUnidade[] = ["dia", "semana", "mes", "ano"];

const GARANTIA_FORMS: Record<GarantiaUnidade, [singular: string, plural: string]> = {
  dia: ["dia", "dias"],
  semana: ["semana", "semanas"],
  mes: ["mês", "meses"],
  ano: ["ano", "anos"],
};

/** Aceita valores legados (dias, semanas…) gravados antes da normalização. */
export function normalizeGarantiaUnidade(raw?: string | null): GarantiaUnidade | undefined {
  if (!raw) return undefined;
  const map: Record<string, GarantiaUnidade> = {
    dia: "dia",
    dias: "dia",
    semana: "semana",
    semanas: "semana",
    mes: "mes",
    mês: "mes",
    meses: "mes",
    ano: "ano",
    anos: "ano",
  };
  return map[raw.toLowerCase()] ?? map[raw];
}

export function garantiaUnidadeLabel(unidade: GarantiaUnidade, quantidade: number): string {
  const q = Math.max(0, Math.floor(quantidade));
  const [singular, plural] = GARANTIA_FORMS[unidade];
  return q === 1 ? singular : plural;
}

export function formatGarantia(
  quantidade?: number,
  unidade?: GarantiaUnidade,
): string | undefined {
  if (quantidade == null || quantidade <= 0 || !unidade) return undefined;
  return `${quantidade} ${garantiaUnidadeLabel(unidade, quantidade)}`;
}

export interface Endereco {
  rua?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}

export type RedeSocialTipo = "facebook" | "instagram" | "youtube" | "linkedin";

export interface RedeSocial {
  rede: RedeSocialTipo;
  url: string;
}

export const REDE_SOCIAL_LABEL: Record<RedeSocialTipo, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  linkedin: "LinkedIn",
};

export const REDES_SOCIAIS_OPCOES: RedeSocialTipo[] = [
  "facebook",
  "instagram",
  "youtube",
  "linkedin",
];

export function parseRedesSociais(raw?: string | null): RedeSocial[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r): r is RedeSocial =>
        typeof r === "object" &&
        r !== null &&
        "rede" in r &&
        "url" in r &&
        typeof (r as RedeSocial).url === "string" &&
        REDES_SOCIAIS_OPCOES.includes((r as RedeSocial).rede),
    );
  } catch {
    return [];
  }
}

export function serializeRedesSociais(redes: RedeSocial[]): string | undefined {
  if (!redes.length) return undefined;
  return JSON.stringify(redes);
}

export interface Empresa {
  id: string;
  nome: string;
  categoria?: import("./empresa-categorias/types").EmpresaCategoria;
  logo_url?: string; // data URL
  documento?: string;
  telefone?: string;
  email?: string;
  endereco: Endereco;
  site?: string;
  redes_sociais?: RedeSocial[];
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
  produto_id?: string;
  nome: string;
  descricao?: string;
  unidade: UnidadeServico;
  quantidade: number;
  valor_unitario: number;
}

export interface HistoricoStatus {
  data: string;
  de: string;
  para: string;
}

export interface OrcamentoAssistencia {
  orcamento_id: string;
  aparelho_marca?: string;
  aparelho_modelo?: string;
  imei?: string;
  defeito_relatado?: string;
  acessorios?: string;
  senha_dispositivo?: string;
  checklist_entrada?: Record<string, boolean>;
}

export interface Produto {
  id: string;
  nome: string;
  categoria: import("./empresa-categorias/types").CategoriaProduto;
  quantidade: number;
  qtd_minima: number;
  preco_custo: number;
  preco_venda: number;
  ativo: boolean;
  created_at?: string;
}

export interface Orcamento {
  id: string;
  numero: string;
  cliente_id: string;
  nome_projeto: string;
  descricao?: string;
  status: string;
  assistencia?: OrcamentoAssistencia;
  itens: OrcamentoItem[];
  /** Percentual sobre o subtotal (0–100). */
  desconto_percentual: number;
  acrescimo: number;
  forma_pagamento?: string;
  prazo_entrega?: string;
  validade?: string;
  garantia_quantidade?: number;
  garantia_unidade?: GarantiaUnidade;
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
  origem?: import("./empresa-categorias/types").OrigemFinanceiro;
  categoria_caixa?: import("./empresa-categorias/types").CategoriaCaixa;
}

export function calcSubtotal(itens: OrcamentoItem[]): number {
  return itens.reduce((acc, i) => acc + i.quantidade * i.valor_unitario, 0);
}

export function calcDescontoValor(
  subtotal: number,
  percentual: number,
): number {
  if (!percentual || subtotal <= 0) return 0;
  return Math.round(((subtotal * percentual) / 100) * 100) / 100;
}

export function calcTotal(
  o: Pick<Orcamento, "itens" | "desconto_percentual" | "acrescimo">,
): number {
  const sub = calcSubtotal(o.itens);
  return sub - calcDescontoValor(sub, o.desconto_percentual ?? 0) + (o.acrescimo || 0);
}

export function formatPercentLabel(percentual: number): string {
  if (!percentual) return "0%";
  return `${percentual.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
}

export function formatBRL(n: number): string {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Extrai YYYY-MM-DD do início de uma ISO (ignora deslocamento de fuso). */
export function calendarPartsFromIso(iso?: string): { y: number; m: number; d: number } | null {
  if (!iso) return null;
  const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

/** Valor do `<input type="date">` → ISO (meio-dia local, evita voltar um dia no PDF). */
export function dateInputToIso(dateStr: string): string {
  const parts = calendarPartsFromIso(dateStr);
  if (!parts) return dateStr;
  const { y, m, d } = parts;
  return new Date(y, m - 1, d, 12, 0, 0, 0).toISOString();
}

/** ISO do banco → valor do `<input type="date">`. */
export function isoToDateInput(iso?: string): string {
  const parts = calendarPartsFromIso(iso);
  if (!parts) return "";
  const { y, m, d } = parts;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** Data de hoje no formato `<input type="date">` (fuso local). */
export function todayDateInput(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** Retorna vazio se a data for anterior a hoje (bloqueio de retroativo). */
export function dateInputFromTodayOrEmpty(iso?: string): string {
  const value = isoToDateInput(iso);
  if (!value) return "";
  return value < todayDateInput() ? "" : value;
}

export function isDateInputOnOrAfterToday(dateStr: string): boolean {
  return dateStr >= todayDateInput();
}

/** Datas “só dia” (validade, prazo) — sem perder um dia por UTC. */
export function formatCalendarDate(iso?: string): string {
  const parts = calendarPartsFromIso(iso);
  if (!parts) return "—";
  const { y, m, d } = parts;
  return new Date(y, m - 1, d).toLocaleDateString("pt-BR");
}

/** Data/hora de evento (emissão, histórico) no fuso local. */
export function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
}
