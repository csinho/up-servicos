import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  KanbanSquare,
  FileText,
  Users,
  Wrench,
  Wallet,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/kanban", label: "Kanban", icon: KanbanSquare },
  { to: "/orcamentos", label: "Orçamentos", icon: FileText },
  { to: "/clientes", label: "Clientes", icon: Users },
  { to: "/servicos", label: "Serviços", icon: Wrench },
  { to: "/financeiro", label: "Financeiro", icon: Wallet },
  { to: "/empresa", label: "Empresa", icon: Building2 },
] as const;

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <aside className="hidden md:flex w-60 flex-col border-r bg-card">
        <div className="h-14 flex items-center px-5 border-b">
          <span className="font-semibold tracking-tight">Freela OS</span>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {NAV.map((n) => {
            const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 text-xs text-muted-foreground border-t">
          Dados mockados · localStorage
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b bg-card flex items-center px-4 md:px-6">
          <nav className="md:hidden flex gap-3 text-sm overflow-x-auto">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} className="text-muted-foreground hover:text-foreground">
                {n.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 p-4 md:p-8 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
