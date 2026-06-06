import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { getClientSessao, isAdminSessao } from "@/lib/auth/client-session";

export function RequireAdmin({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sessao = getClientSessao();
    if (!isAdminSessao(sessao)) {
      void navigate({ to: "/admin/login" });
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
