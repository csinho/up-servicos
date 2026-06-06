import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, LayoutGrid, FilePlus2, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { billingBlocksMutation } from "@/lib/billing/state";
import { useEmpresaBilling } from "@/lib/billing/use-empresa-billing";
import { useOrcamentos, useClientes, useEmpresa, gerarNumeroOrcamento } from "@/lib/store";
import { startNovoOrcamento } from "@/lib/novo-orcamento";
import {
  isMobileHubChildPage,
  normalizePath,
  shouldShowMobileBottomNav,
} from "@/lib/mobile-nav";
import { useEmpresaCategoria } from "@/hooks/use-empresa-categoria";
import { cn } from "@/lib/utils";

type NavTabProps = {
  to: string;
  icon: LucideIcon;
  label: string;
  active: boolean;
  ariaLabel: string;
};

function NavTab({ to, icon: Icon, label, active, ariaLabel }: NavTabProps) {
  return (
    <Link
      to={to}
      preload="intent"
      aria-label={ariaLabel}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center justify-center rounded-full transition-all duration-300 ease-out",
        active
          ? "gap-2 bg-foreground px-4 py-2.5 min-w-[5.5rem] text-background"
          : "h-11 w-11 text-muted-foreground hover:bg-muted active:scale-95",
      )}
    >
      <Icon className={cn("shrink-0", active ? "h-5 w-5" : "h-6 w-6")} strokeWidth={active ? 2.25 : 2} />
      {active && <span className="text-sm font-semibold whitespace-nowrap">{label}</span>}
    </Link>
  );
}

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { billing } = useEmpresaBilling();
  const { data: orcamentos = [] } = useOrcamentos();
  const { data: clientes = [] } = useClientes();
  const { data: empresa } = useEmpresa();
  const { categoria, isAssistenciaTecnica } = useEmpresaCategoria();

  const path = normalizePath(pathname);

  if (!shouldShowMobileBottomNav(path, categoria)) return null;

  const isHome = path === "/";
  const isMenu = path === "/menu" || isMobileHubChildPage(path);

  const criarOrcamento = () => {
    if (billing && billingBlocksMutation(billing)) {
      toast.error("Plano pendente — acesse Plano para pagar e criar novos orçamentos.");
      return;
    }
    const o = startNovoOrcamento(orcamentos, clientes, empresa, gerarNumeroOrcamento);
    void navigate({ to: "/orcamentos/$id", params: { id: o.id } });
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 pointer-events-none"
      aria-label="Navegação principal"
    >
      <div className="pointer-events-auto flex w-full max-w-sm items-center justify-between gap-1 rounded-full border border-border/60 bg-background/95 px-2 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] backdrop-blur-xl">
        <NavTab to="/" icon={Home} label="Home" active={isHome} ariaLabel="Dashboard" />

        <button
          type="button"
          onClick={criarOrcamento}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all hover:bg-muted/60 active:scale-95"
          aria-label={isAssistenciaTecnica ? "Nova OS" : "Criar orçamento"}
        >
          <FilePlus2 className="h-6 w-6" strokeWidth={2} />
        </button>

        <NavTab to="/menu" icon={LayoutGrid} label="Mais" active={isMenu} ariaLabel="Mais opções" />
      </div>
    </nav>
  );
}
