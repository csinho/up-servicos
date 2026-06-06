import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { pageTitle } from "@/lib/app-brand";
import { getMobileHubSections } from "@/lib/mobile-nav";
import { useEmpresaCategoria } from "@/hooks/use-empresa-categoria";
import { logoutClient } from "@/lib/auth/client-auth";
import { getClientSessao, isEmpresaSessao } from "@/lib/auth/client-session";
import { useEmpresaBranding } from "@/hooks/use-empresa-branding";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/menu")({
  head: () => ({ meta: [{ title: pageTitle("Menu") }] }),
  component: MenuHubPage,
});

function MenuHubPage() {
  const { nome: empresaNome } = useEmpresaBranding();
  const { hubSections, isAssistenciaTecnica } = useEmpresaCategoria();
  const [contaNome, setContaNome] = useState(empresaNome);

  useEffect(() => {
    const sessao = getClientSessao();
    if (isEmpresaSessao(sessao) && sessao.nome) {
      setContaNome(sessao.nome);
      return;
    }
    setContaNome(empresaNome);
  }, [empresaNome]);

  const sair = () => {
    void logoutClient().then(() => {
      window.location.href = "/login";
    });
  };

  return (
    <>
      <p className="hidden md:block text-sm text-muted-foreground">
        O menu rápido mobile está disponível apenas em telas pequenas. Use a barra lateral.
      </p>
      <div className="space-y-6 md:hidden pb-4">
        <p className="text-sm text-muted-foreground">
          {isAssistenciaTecnica
            ? "OS, estoque, clientes, financeiro e configurações."
            : "Orçamentos, clientes, financeiro e configurações da empresa."}
        </p>

        {hubSections.map((section) => (
          <section key={section.title} className="space-y-3">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
              {section.title}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {section.items.map((item) => (
                <Link key={item.to} to={item.to} className="block group">
                  <div className="relative flex h-full min-h-[8.5rem] flex-col items-center justify-center gap-2.5 rounded-2xl border border-border bg-card p-4 text-center shadow-sm transition-all active:scale-[0.98] group-hover:shadow-md">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-background">
                      <item.icon className="h-5 w-5 text-foreground" strokeWidth={2} />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-sm font-semibold leading-tight text-foreground">
                        {item.short}
                      </div>
                      {item.description && (
                        <p className="text-[11px] leading-snug text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <section className="space-y-3 pt-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
            Conta
          </h2>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm space-y-4">
            <p className="text-base font-semibold text-foreground truncate">{contaNome}</p>
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 rounded-xl justify-center gap-2 text-base font-semibold"
              onClick={sair}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              Sair da conta
            </Button>
          </div>
        </section>
      </div>
    </>
  );
}
