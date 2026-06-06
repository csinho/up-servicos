import type { LucideIcon } from "lucide-react";
import {
  getHubSectionsForCategoria,
  getNavForCategoria,
  normalizeEmpresaCategoria,
  type EmpresaCategoria,
  type MobileHubSection,
  type MobileNavItem,
} from "@/lib/empresa-categorias";

export type { MobileHubSection, MobileNavItem };

/** @deprecated use getNavForCategoria(categoria) */
export const EMPRESA_NAV = getNavForCategoria("generico");

export function getMobileHubNav(categoria?: string | null): MobileNavItem[] {
  return getNavForCategoria(categoria).filter((n) => !n.desktopOnly && n.to !== "/");
}

export function getMobileHubSections(categoria?: string | null): MobileHubSection[] {
  return getHubSectionsForCategoria(categoria);
}

/** @deprecated */
export const MOBILE_HUB_NAV = getMobileHubNav("generico");

/** @deprecated */
export const MOBILE_HUB_SECTIONS = getMobileHubSections("generico");

export const MOBILE_HUB_ROUTES = getMobileHubNav("generico").map((n) => n.to);

function hubRoutesFor(categoria?: string | null): string[] {
  return getMobileHubNav(categoria).map((n) => n.to);
}

const BOTTOM_NAV_LIST_ROUTES_BASE = ["/orcamentos", "/clientes", "/servicos", "/financeiro"];

export function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname;
}

export function isMobileFormFocusPath(pathname: string): boolean {
  const p = normalizePath(pathname);
  if (/^\/orcamentos\/[^/]+/.test(p)) return true;
  if (p === "/clientes/novo" || /^\/clientes\/[^/]+/.test(p)) return true;
  if (p === "/servicos/novo" || /^\/servicos\/[^/]+/.test(p)) return true;
  if (p === "/estoque") return false;
  return false;
}

export function isMobileHubChildPage(pathname: string, categoria?: string | null): boolean {
  const p = normalizePath(pathname);
  if (p === "/menu") return false;
  if (isMobileFormFocusPath(p)) return false;
  const routes = hubRoutesFor(categoria);
  return routes.some((route) => p === route || p.startsWith(`${route}/`));
}

export function getMobileHeaderBackTarget(pathname: string): string | null {
  const p = normalizePath(pathname);
  if (/^\/orcamentos\/[^/]+/.test(p)) return "/orcamentos";
  if (p === "/clientes/novo" || /^\/clientes\/[^/]+/.test(p)) return "/clientes";
  if (p === "/servicos/novo" || /^\/servicos\/[^/]+/.test(p)) return "/servicos";
  if (p === "/menu") return null;
  const hubRoutes = ["/orcamentos", "/clientes", "/servicos", "/financeiro", "/estoque", "/plano", "/empresa"];
  if (hubRoutes.includes(p)) return "/menu";
  return null;
}

export function getMobileHeaderBackLabel(pathname: string, categoria?: string | null): string {
  const p = normalizePath(pathname);
  const cat = normalizeEmpresaCategoria(categoria);
  if (p.startsWith("/orcamentos/")) {
    return cat === "assistencia_tecnica" ? "Voltar para OS" : "Voltar para orçamentos";
  }
  if (p.startsWith("/clientes")) return "Voltar para clientes";
  if (p.startsWith("/servicos")) return "Voltar para serviços";
  if (p === "/estoque") return "Voltar para Mais opções";
  return "Voltar para Mais opções";
}

export function shouldShowMobileBottomNav(pathname: string, categoria?: string | null): boolean {
  const p = normalizePath(pathname);
  if (isMobileFormFocusPath(p)) return false;
  if (p === "/empresa" || p === "/plano") return false;
  if (p === "/" || p === "/menu") return true;
  const listRoutes = [
    ...BOTTOM_NAV_LIST_ROUTES_BASE,
    ...(normalizeEmpresaCategoria(categoria) === "assistencia_tecnica" ? ["/estoque"] : []),
  ];
  return listRoutes.includes(p);
}

/** @deprecated use shouldShowMobileBottomNav(pathname, categoria) */
export function shouldHideMobileBottomNav(pathname: string): boolean {
  return !shouldShowMobileBottomNav(pathname);
}

export function currentPageTitle(pathname: string, categoria?: string | null): string {
  const cat = normalizeEmpresaCategoria(categoria);
  const nav = getNavForCategoria(cat);
  if (pathname === "/menu") return "Mais opções";
  const item = nav.find((n) => (n.to === "/" ? pathname === "/" : pathname.startsWith(n.to)));
  if (pathname === "/clientes/novo") return "Novo cliente";
  if (pathname.startsWith("/clientes/")) return "Editar cliente";
  if (pathname === "/servicos/novo") return "Novo serviço";
  if (pathname.startsWith("/servicos/")) return "Editar serviço";
  if (pathname.startsWith("/orcamentos/")) {
    return cat === "assistencia_tecnica" ? "Ordem de Serviço" : "Orçamento";
  }
  if (pathname === "/estoque") return "Estoque";
  return item?.short ?? "Up Serviços";
}
