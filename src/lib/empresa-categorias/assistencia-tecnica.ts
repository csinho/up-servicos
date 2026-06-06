import {
  Building2,
  CreditCard,
  FileText,
  KanbanSquare,
  LayoutDashboard,
  Package,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import type { CategoriaConfig, MobileHubSection, MobileNavItem } from "./types";

const NAV: MobileNavItem[] = [
  { to: "/", label: "Dashboard", short: "Dashboard", icon: LayoutDashboard, description: "Visão geral" },
  { to: "/kanban", label: "Kanban", short: "Kanban", icon: KanbanSquare, description: "Quadro de OS", desktopOnly: true },
  {
    to: "/orcamentos",
    label: "Ordens de Serviço",
    short: "OS",
    icon: FileText,
    description: "Ordens e cotações",
  },
  { to: "/clientes", label: "Clientes", short: "Clientes", icon: Users, description: "Cadastro de clientes" },
  { to: "/servicos", label: "Serviços", short: "Serviços", icon: Wrench, description: "Mão de obra" },
  {
    to: "/estoque",
    label: "Estoque",
    short: "Estoque",
    icon: Package,
    description: "Peças e produtos",
    categorias: ["assistencia_tecnica"],
  },
  { to: "/financeiro", label: "Financeiro", short: "Financeiro", icon: Wallet, description: "Fluxo de caixa" },
  { to: "/plano", label: "Plano", short: "Plano", icon: CreditCard, description: "Assinatura e PIX" },
  { to: "/empresa", label: "Empresa", short: "Empresa", icon: Building2, description: "Dados e logo" },
];

const HUB_SECTIONS: MobileHubSection[] = [
  {
    title: "Operacional",
    items: [
      NAV.find((n) => n.to === "/orcamentos")!,
      NAV.find((n) => n.to === "/clientes")!,
      NAV.find((n) => n.to === "/servicos")!,
      NAV.find((n) => n.to === "/estoque")!,
    ],
  },
  {
    title: "Financeiro",
    items: [NAV.find((n) => n.to === "/financeiro")!, NAV.find((n) => n.to === "/plano")!],
  },
  {
    title: "Configuração",
    items: [NAV.find((n) => n.to === "/empresa")!],
  },
];

export const assistenciaTecnicaConfig: CategoriaConfig = {
  id: "assistencia_tecnica",
  label: "Assistência técnica",
  description: "Celulares, tablets e eletrônicos",
  nav: NAV,
  hubSections: HUB_SECTIONS,
  statusOrder: [
    "orcamento",
    "entrada",
    "diagnostico",
    "aguardando_peca",
    "em_reparo",
    "pronto",
    "entregue",
  ],
  statusLabels: {
    orcamento: "Cotação",
    entrada: "Entrada",
    diagnostico: "Diagnóstico",
    aguardando_peca: "Aguardando peça",
    em_reparo: "Em reparo",
    pronto: "Pronto",
    entregue: "Entregue",
  },
  billingTriggerStatus: "em_reparo",
  orcamentosNavLabel: "Ordens de Serviço",
  orcamentoSingular: "Ordem de Serviço",
  novoOrcamentoLabel: "Nova OS",
  produtoCategorias: [
    { value: "tela", label: "Tela" },
    { value: "bateria", label: "Bateria" },
    { value: "conector", label: "Conector" },
    { value: "acessorio", label: "Acessório" },
    { value: "outro", label: "Outro" },
  ],
  caixaCategorias: [
    { value: "servico", label: "Serviço" },
    { value: "venda", label: "Venda" },
    { value: "compra_pecas", label: "Compra de Peças" },
    { value: "aluguel", label: "Aluguel" },
    { value: "energia", label: "Energia" },
    { value: "internet", label: "Internet" },
    { value: "salarios", label: "Salários" },
    { value: "outros", label: "Outros" },
  ],
  financeiroManual: true,
};
