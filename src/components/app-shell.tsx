import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  KanbanSquare,
  FileText,
  Users,
  Wrench,
  Wallet,
  Building2,
  Menu,
  CreditCard,
  LogOut,
} from "lucide-react";
import { logoutClient } from "@/lib/auth/client-auth";
import { EmpresaBillingBanner } from "@/components/empresa/EmpresaBillingBanner";
import { cn } from "@/lib/utils";
import { useEmpresaBranding } from "@/hooks/use-empresa-branding";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, short: "Dashboard" },
  { to: "/kanban", label: "Kanban", icon: KanbanSquare, short: "Kanban" },
  { to: "/orcamentos", label: "Orçamentos e pedidos", icon: FileText, short: "Orçamentos" },
  { to: "/clientes", label: "Clientes", icon: Users, short: "Clientes" },
  { to: "/servicos", label: "Serviços", icon: Wrench, short: "Serviços" },
  { to: "/financeiro", label: "Financeiro", icon: Wallet, short: "Financeiro" },
  { to: "/plano", label: "Plano", icon: CreditCard, short: "Plano" },
  { to: "/empresa", label: "Empresa", icon: Building2, short: "Empresa" },
] as const;

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <>
      {NAV.map((n) => {
        const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
        return (
          <Link
            key={n.to}
            to={n.to}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <n.icon className="h-4 w-4 shrink-0" />
            <span>{n.label}</span>
          </Link>
        );
      })}
    </>
  );
}

function currentPageTitle(pathname: string): string {
  const item = NAV.find((n) => (n.to === "/" ? pathname === "/" : pathname.startsWith(n.to)));
  return item?.short ?? "Freela OS";
}

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { logoUrl, nome, isLoading } = useEmpresaBranding();
  const [menuOpen, setMenuOpen] = useState(false);
  const pageTitle = currentPageTitle(pathname);

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <aside className="hidden md:flex w-60 flex-col border-r bg-card min-h-0 shrink-0">
        <div className="h-14 flex items-center px-5 border-b shrink-0">
          <span className="font-semibold tracking-tight truncate">{nome}</span>
        </div>
        <nav className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1">
          <NavLinks pathname={pathname} />
        </nav>
        <div className="shrink-0 p-3 border-t">
          <Button
            type="button"
            variant="ghost"
            className="w-full justify-start gap-2"
            onClick={() => void logoutClient().then(() => { window.location.href = "/login"; })}
          >
            <LogOut className="h-4 w-4" />
            Sair
          </Button>
        </div>
        <div className="shrink-0 p-4 border-t bg-muted/20">
          {logoUrl ? (
            <div className="flex flex-col items-center gap-2">
              <div className="w-full flex justify-center rounded-md bg-background/80 border p-2">
                <img
                  src={logoUrl}
                  alt={`Logo ${nome}`}
                  className="h-12 w-auto max-w-full object-contain"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center truncate w-full" title={nome}>
                {nome}
              </p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center">
              {isLoading ? "Carregando…" : "Adicione a logo em Empresa"}
            </p>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <header className="h-14 border-b bg-card flex items-center gap-3 px-4 md:px-6 shrink-0">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden shrink-0"
              aria-label="Abrir menu"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <SheetContent side="left" className="w-[min(100vw-2rem,18rem)] p-0 flex flex-col">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="h-14 flex items-center px-5 border-b shrink-0">
                <span className="font-semibold tracking-tight truncate">{nome}</span>
              </div>
              <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                <NavLinks pathname={pathname} onNavigate={() => setMenuOpen(false)} />
              </nav>
              {logoUrl && (
                <div className="shrink-0 p-4 border-t">
                  <img
                    src={logoUrl}
                    alt={`Logo ${nome}`}
                    className="h-10 w-auto max-w-full object-contain mx-auto"
                  />
                </div>
              )}
            </SheetContent>
          </Sheet>
          <span className="md:hidden font-semibold truncate flex-1 min-w-0">{pageTitle}</span>
        </header>
        <main className="flex-1 flex flex-col p-4 sm:p-6 md:p-8 min-w-0 min-h-0 overflow-auto">
          <EmpresaBillingBanner />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
