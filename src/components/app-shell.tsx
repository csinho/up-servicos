import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, LogOut } from "lucide-react";
import { APP_NAME } from "@/lib/app-brand";
import { logoutClient } from "@/lib/auth/client-auth";
import { AppLogo } from "@/components/AppLogo";
import { EmpresaBillingBanner } from "@/components/empresa/EmpresaBillingBanner";
import { MobileBottomNav } from "@/components/mobile/mobile-bottom-nav";
import {
  currentPageTitle,
  getMobileHeaderBackLabel,
  getMobileHeaderBackTarget,
  normalizePath,
  shouldShowMobileBottomNav,
} from "@/lib/mobile-nav";
import { cn } from "@/lib/utils";
import { useEmpresaBranding } from "@/hooks/use-empresa-branding";
import { useEmpresaCategoria } from "@/hooks/use-empresa-categoria";
import { Button } from "@/components/ui/button";

function NavLinks({
  pathname,
  nav,
}: {
  pathname: string;
  nav: ReturnType<typeof useEmpresaCategoria>["nav"];
}) {
  return (
    <>
      {nav.map((n) => {
        const active = n.to === "/" ? pathname === "/" : pathname.startsWith(n.to);
        return (
          <Link
            key={n.to}
            to={n.to}
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

export function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const path = normalizePath(pathname);
  const { logoUrl, nome, isLoading } = useEmpresaBranding();
  const { nav, categoria } = useEmpresaCategoria();
  const pageTitle = currentPageTitle(pathname, categoria);
  const showBottomNav = shouldShowMobileBottomNav(path, categoria);
  const mobileBackTo = getMobileHeaderBackTarget(pathname);

  return (
    <div className="flex min-h-screen w-full bg-muted/30">
      <aside className="hidden md:flex w-60 flex-col border-r bg-card min-h-0 shrink-0">
        <div className="h-14 flex items-center px-5 border-b shrink-0">
          {nome === APP_NAME ? (
            <AppLogo size="compact" />
          ) : (
            <span className="font-semibold tracking-tight truncate">{nome}</span>
          )}
        </div>
        <nav className="flex-1 min-h-0 overflow-y-auto p-3 space-y-1">
          <NavLinks pathname={pathname} nav={nav} />
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
        <header className="h-14 border-b bg-card/80 backdrop-blur-md flex items-center gap-2 px-4 md:px-6 shrink-0 sticky top-0 z-30">
          {mobileBackTo && (
            <Link
              to={mobileBackTo}
              className="md:hidden flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground hover:bg-muted transition-colors"
              aria-label={getMobileHeaderBackLabel(pathname, categoria)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
          )}
          <span className="md:hidden font-semibold truncate flex-1 min-w-0">{pageTitle}</span>
          <span className="hidden md:block font-semibold truncate flex-1">{pageTitle}</span>
        </header>
        <main
          className={cn(
            "flex-1 flex flex-col p-4 sm:p-6 md:p-8 min-w-0 min-h-0 overflow-auto",
            showBottomNav && "pb-28 md:pb-8",
          )}
        >
          <EmpresaBillingBanner />
          <Outlet />
        </main>
        <MobileBottomNav />
      </div>
    </div>
  );
}
