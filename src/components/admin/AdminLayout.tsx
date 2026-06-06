import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  Building2,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
} from "lucide-react";
import { AdminRefreshProvider } from "@/components/admin/admin-refresh-context";
import { RequireAdmin } from "@/components/admin/RequireAdmin";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { logoutClient } from "@/lib/auth/client-auth";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/empresas", label: "Empresas", icon: Building2 },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
] as const;

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {NAV.map((n) => {
        const active = pathname.startsWith(n.to);
        return (
          <Link
            key={n.to}
            to={n.to}
            onClick={() => onNavigate?.()}
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

export function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
  const logout = () => {
    void logoutClient().then(() => {
      window.location.href = "/login";
    });
  };

  return (
    <RequireAdmin>
      <AdminRefreshProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <aside className="hidden md:flex w-60 flex-col border-r bg-card min-h-0 shrink-0">
          <div className="h-14 flex items-center px-5 border-b shrink-0">
            <span className="font-semibold tracking-tight">Freela OS Admin</span>
          </div>
          <nav className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1">
            <NavLinks pathname={pathname} />
          </nav>
          <div className="shrink-0 p-3 border-t">
            <Button type="button" variant="ghost" className="w-full justify-start gap-2" onClick={logout}>
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
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
                <SheetTitle className="sr-only">Menu admin</SheetTitle>
                <div className="h-14 flex items-center px-5 border-b shrink-0">
                  <span className="font-semibold">Freela OS Admin</span>
                </div>
                <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                  <NavLinks
                    pathname={pathname}
                    onNavigate={() => setMenuOpen(false)}
                  />
                </nav>
                <div className="p-3 border-t">
                  <Button type="button" variant="ghost" className="w-full justify-start gap-2" onClick={logout}>
                    <LogOut className="h-4 w-4" />
                    Sair
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <span className="font-semibold truncate flex-1">Painel administrativo</span>
            <Button type="button" variant="outline" size="sm" className="hidden md:inline-flex" onClick={logout}>
              Sair
            </Button>
          </header>

          <main className="flex-1 p-4 sm:p-6 md:p-8 min-w-0 overflow-auto">
            <Outlet />
          </main>

          <nav className="md:hidden border-t bg-card flex justify-around py-2 shrink-0">
            {NAV.map((n) => {
              const active = pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={cn(
                    "flex flex-col items-center gap-0.5 px-3 py-1 text-xs",
                    active ? "text-primary font-medium" : "text-muted-foreground",
                  )}
                >
                  <n.icon className="h-5 w-5" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      </AdminRefreshProvider>
    </RequireAdmin>
  );
}
