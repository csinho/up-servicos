import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { getClientSessao, isEmpresaSessao } from "@/lib/auth/client-session";

export function RequireEmpresa({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sessao = getClientSessao();
    if (!isEmpresaSessao(sessao)) {
      void navigate({ to: "/login" });
      return;
    }
    setReady(true);
  }, [navigate]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Verificando sessão…
      </div>
    );
  }

  return <>{children}</>;
}
