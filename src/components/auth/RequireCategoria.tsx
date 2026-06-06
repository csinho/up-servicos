import type { ReactNode } from "react";
import { useEmpresaCategoria } from "@/hooks/use-empresa-categoria";
import type { EmpresaCategoria } from "@/lib/empresa-categorias";

export function RequireCategoria({
  allowed,
  children,
}: {
  allowed: EmpresaCategoria[];
  children: ReactNode;
}) {
  const { categoria, isLoading } = useEmpresaCategoria();

  if (isLoading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Carregando…
      </div>
    );
  }

  if (!allowed.includes(categoria)) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        Este módulo não está disponível para o tipo da sua empresa.
      </div>
    );
  }

  return <>{children}</>;
}
