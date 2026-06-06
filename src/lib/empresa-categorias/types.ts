import type { LucideIcon } from "lucide-react";

export type EmpresaCategoria = "generico" | "assistencia_tecnica";

export type StatusOrcamentoGenerico =
  | "orcamento"
  | "em_producao"
  | "vistoria"
  | "entregue";

export type StatusOrcamentoAT =
  | "orcamento"
  | "entrada"
  | "diagnostico"
  | "aguardando_peca"
  | "em_reparo"
  | "pronto"
  | "entregue";

export type StatusOrcamento = StatusOrcamentoGenerico | StatusOrcamentoAT;

export type CategoriaProduto = "tela" | "bateria" | "conector" | "acessorio" | "outro";

export type CategoriaCaixa =
  | "servico"
  | "venda"
  | "compra_pecas"
  | "aluguel"
  | "energia"
  | "internet"
  | "salarios"
  | "outros";

export type OrigemFinanceiro = "automatico" | "manual";

export type MobileNavItem = {
  to: string;
  label: string;
  short: string;
  icon: LucideIcon;
  description?: string;
  desktopOnly?: boolean;
  /** Rota exclusiva de uma categoria (ex.: estoque só AT). */
  categorias?: EmpresaCategoria[];
};

export type MobileHubSection = {
  title: string;
  items: MobileNavItem[];
};

export type CategoriaConfig = {
  id: EmpresaCategoria;
  label: string;
  description: string;
  nav: MobileNavItem[];
  hubSections: MobileHubSection[];
  statusOrder: StatusOrcamento[];
  statusLabels: Record<string, string>;
  /** Status que dispara lançamento a receber no financeiro automático. */
  billingTriggerStatus: StatusOrcamento;
  orcamentosNavLabel: string;
  orcamentoSingular: string;
  novoOrcamentoLabel: string;
  produtoCategorias?: { value: CategoriaProduto; label: string }[];
  caixaCategorias?: { value: CategoriaCaixa; label: string }[];
  financeiroManual: boolean;
};
