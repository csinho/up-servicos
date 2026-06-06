import { createFileRoute } from "@tanstack/react-router";
import { adminPageTitle } from "@/lib/app-brand";
import { AdminEmpresasTable } from "@/components/admin/AdminEmpresasTable";
import { AdminNovaEmpresaDialog } from "@/components/admin/AdminNovaEmpresaDialog";
import { useAdminRefreshTick } from "@/components/admin/admin-refresh-context";
import { PageHeader } from "@/components/page-header";
import { useState } from "react";

export const Route = createFileRoute("/admin/empresas/")({
  head: () => ({ meta: [{ title: adminPageTitle("Empresas") }] }),
  component: AdminEmpresasPage,
});

function AdminEmpresasPage() {
  const tick = useAdminRefreshTick();
  const [reload, setReload] = useState(0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Empresas"
        description="Todas as empresas cadastradas — status operacional e de pagamento."
      >
        <AdminNovaEmpresaDialog onCreated={() => setReload((n) => n + 1)} />
      </PageHeader>
      <AdminEmpresasTable refreshKey={tick + reload} />
    </div>
  );
}
