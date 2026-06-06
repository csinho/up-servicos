import { assistenciaTecnicaConfig } from "./assistencia-tecnica";
import { genericoConfig } from "./generico";
import type {
  CategoriaConfig,
  EmpresaCategoria,
  MobileHubSection,
  MobileNavItem,
  StatusOrcamento,
} from "./types";

export * from "./types";

const CONFIGS: Record<EmpresaCategoria, CategoriaConfig> = {
  generico: genericoConfig,
  assistencia_tecnica: assistenciaTecnicaConfig,
};

export const EMPRESA_CATEGORIAS: { value: EmpresaCategoria; label: string; description: string }[] = [
  { value: "generico", label: genericoConfig.label, description: genericoConfig.description },
  {
    value: "assistencia_tecnica",
    label: assistenciaTecnicaConfig.label,
    description: assistenciaTecnicaConfig.description,
  },
];

export function normalizeEmpresaCategoria(raw?: string | null): EmpresaCategoria {
  if (raw === "assistencia_tecnica") return "assistencia_tecnica";
  return "generico";
}

export function getCategoriaConfig(categoria?: string | null): CategoriaConfig {
  return CONFIGS[normalizeEmpresaCategoria(categoria)];
}

export function getNavForCategoria(categoria?: string | null): MobileNavItem[] {
  return getCategoriaConfig(categoria).nav;
}

export function getHubSectionsForCategoria(categoria?: string | null): MobileHubSection[] {
  return getCategoriaConfig(categoria).hubSections;
}

export function getStatusOrder(categoria?: string | null): StatusOrcamento[] {
  return getCategoriaConfig(categoria).statusOrder;
}

export function getStatusLabel(status: string, categoria?: string | null): string {
  const cfg = getCategoriaConfig(categoria);
  return cfg.statusLabels[status] ?? status;
}

export function isFaseOrcamento(status: string, categoria?: string | null): boolean {
  return status === "orcamento";
}

export function labelDocumento(
  status: string,
  categoria?: string | null,
): "Orçamento" | "Pedido" | "OS" {
  if (normalizeEmpresaCategoria(categoria) === "assistencia_tecnica") {
    return isFaseOrcamento(status, categoria) ? "OS" : "OS";
  }
  return isFaseOrcamento(status, categoria) ? "Orçamento" : "Pedido";
}

export function labelDocumentoLower(status: string, categoria?: string | null): string {
  const d = labelDocumento(status, categoria);
  return d === "OS" ? "OS" : d === "Orçamento" ? "orçamento" : "pedido";
}

export function isAssistenciaTecnica(categoria?: string | null): boolean {
  return normalizeEmpresaCategoria(categoria) === "assistencia_tecnica";
}
