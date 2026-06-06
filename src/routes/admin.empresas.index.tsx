import { createFileRoute } from "@tanstack/react-router";
import { AdminEmpresasTable } from "@/components/admin/AdminEmpresasTable";
import { useAdminRefreshTick } from "@/components/admin/admin-refresh-context";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/admin/empresas/")({
  head: () => ({ meta: [{ title: "Empresas — Admin Freela OS" }] }),
  component: AdminEmpresasPage,
});

function AdminEmpresasPage() {
  const tick = useAdminRefreshTick();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Empresas"
        description="Todas as empresas cadastradas — status operacional e de pagamento."
      />
      <AdminEmpresasTable refreshKey={tick} />
    </div>
  );
}
