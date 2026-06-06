import {
  Building2,
  CreditCard,
  FileText,
  KanbanSquare,
  LayoutDashboard,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import type { CategoriaConfig, MobileHubSection, MobileNavItem } from "./types";

const NAV: MobileNavItem[] = [
  { to: "/", label: "Dashboard", short: "Dashboard", icon: LayoutDashboard, description: "Visão geral" },
  { to: "/kanban", label: "Kanban", short: "Kanban", icon: KanbanSquare, description: "Quadro visual", desktopOnly: true },
  { to: "/orcamentos", label: "Orçamentos e pedidos", short: "Orçamentos", icon: FileText, description: "Propostas e pedidos" },
  { to: "/clientes", label: "Clientes", short: "Clientes", icon: Users, description: "Cadastro de clientes" },
  { to: "/servicos", label: "Serviços", short: "Serviços", icon: Wrench, description: "Catálogo de serviços" },
  { to: "/financeiro", label: "Financeiro", short: "Financeiro", icon: Wallet, description: "Contas a receber" },
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

export const genericoConfig: CategoriaConfig = {
  id: "generico",
  label: "Serviços gerais",
  description: "Pedreiro, freelancer, prestador de serviço em geral",
  nav: NAV,
  hubSections: HUB_SECTIONS,
  statusOrder: ["orcamento", "em_producao", "vistoria", "entregue"],
  statusLabels: {
    orcamento: "Orçamento",
    em_producao: "Em produção",
    vistoria: "Vistoria",
    entregue: "Entregue",
  },
  billingTriggerStatus: "em_producao",
  orcamentosNavLabel: "Orçamentos e pedidos",
  orcamentoSingular: "Orçamento",
  novoOrcamentoLabel: "Novo orçamento",
  financeiroManual: false,
};
