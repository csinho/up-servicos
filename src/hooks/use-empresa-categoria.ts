import { useEmpresa } from "@/lib/store";
import {
  getCategoriaConfig,
  getHubSectionsForCategoria,
  getNavForCategoria,
  isAssistenciaTecnica,
  normalizeEmpresaCategoria,
  type CategoriaConfig,
  type EmpresaCategoria,
} from "@/lib/empresa-categorias";

export function useEmpresaCategoria(): {
  categoria: EmpresaCategoria;
  config: CategoriaConfig;
  nav: ReturnType<typeof getNavForCategoria>;
  hubSections: ReturnType<typeof getHubSectionsForCategoria>;
  isAssistenciaTecnica: boolean;
  isLoading: boolean;
} {
  const { data: empresa, isLoading } = useEmpresa();
  const categoria = normalizeEmpresaCategoria(empresa?.categoria);
  const config = getCategoriaConfig(categoria);

  return {
    categoria,
    config,
    nav: getNavForCategoria(categoria),
    hubSections: getHubSectionsForCategoria(categoria),
    isAssistenciaTecnica: isAssistenciaTecnica(categoria),
    isLoading,
  };
}
