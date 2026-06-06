import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  assertAdminWhatsappAllowed,
  isAdminWhatsappAllowed,
  normalizeWhatsapp11,
} from "@/lib/admin/allowlist.server";
import {
  listarEmpresasAdmin,
  obterEmpresaAdmin,
  setEmpresaCategoriaAdmin,
  setEmpresaPausadaAdmin,
} from "@/lib/admin/empresas.server";
import { getAdminDashboard } from "@/lib/admin/metrics.server";
import {
  confirmAdminLoginOtpUnified,
  requestAdminLoginOtpUnified,
} from "@/lib/auth/empresa-auth.server";
import {
  getAdminSettings,
  saveAdminBillingPlan,
  saveAdminContactWhatsapp,
} from "@/lib/admin/system-settings.server";
import {
  getEvolutionQrAdmin,
  refreshEvolutionConnectionAdmin,
  saveEvolutionInstanceAdmin,
} from "@/lib/evolution/admin.server";
import { listarPagamentosPlano } from "@/lib/billing/payments.server";

const adminWhatsappSchema = z.object({ adminWhatsapp: z.string().regex(/^\d{11}$/) });

async function assertFromInput(adminWhatsapp: string) {
  await assertAdminWhatsappAllowed(adminWhatsapp);
}

export const checkAdminWhatsappAllowedRemote = createServerFn({ method: "POST" })
  .inputValidator((data: { whatsapp: string }) => data)
  .handler(async ({ data }) => {
    const whatsapp = normalizeWhatsapp11(data.whatsapp);
    return { allowed: await isAdminWhatsappAllowed(whatsapp) };
  });

export const requestAdminLoginOtpRemote = createServerFn({ method: "POST" })
  .inputValidator((data: { whatsapp: string }) => data)
  .handler(async ({ data }) => {
    const whatsapp = normalizeWhatsapp11(data.whatsapp);
    return requestAdminLoginOtpUnified(whatsapp);
  });

export const confirmAdminLoginOtpRemote = createServerFn({ method: "POST" })
  .inputValidator((data: { whatsapp: string; code: string }) => data)
  .handler(async ({ data }) => {
    const whatsapp = normalizeWhatsapp11(data.whatsapp);
    const code = data.code.replace(/\D/g, "");
    if (code.length !== 6) throw new Error("Código deve ter 6 dígitos.");
    return confirmAdminLoginOtpUnified(whatsapp, code);
  });

export const listarEmpresasAdminRemote = createServerFn({ method: "POST" })
  .inputValidator((data: { adminWhatsapp: string; search?: string }) =>
    adminWhatsappSchema.extend({ search: z.string().optional() }).parse(data),
  )
  .handler(async ({ data }) => {
    await assertFromInput(data.adminWhatsapp);
    return listarEmpresasAdmin(data.search);
  });

export const obterEmpresaAdminRemote = createServerFn({ method: "POST" })
  .inputValidator((data: { adminWhatsapp: string; empresaId: string }) =>
    adminWhatsappSchema.extend({ empresaId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data }) => {
    await assertFromInput(data.adminWhatsapp);
    return obterEmpresaAdmin(data.empresaId);
  });

export const setEmpresaCategoriaAdminRemote = createServerFn({ method: "POST" })
  .inputValidator((data: { adminWhatsapp: string; empresaId: string; categoria: string }) =>
    adminWhatsappSchema
      .extend({
        empresaId: z.string().uuid(),
        categoria: z.enum(["generico", "assistencia_tecnica"]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await assertFromInput(data.adminWhatsapp);
    await setEmpresaCategoriaAdmin(data.empresaId, data.categoria);
    return { ok: true };
  });

export const setEmpresaPausadaAdminRemote = createServerFn({ method: "POST" })
  .inputValidator((data: { adminWhatsapp: string; empresaId: string; pausada: boolean }) =>
    adminWhatsappSchema
      .extend({ empresaId: z.string().uuid(), pausada: z.boolean() })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await assertFromInput(data.adminWhatsapp);
    await setEmpresaPausadaAdmin(data.empresaId, data.pausada);
    return { ok: true };
  });

export const listarPagamentosPlanoAdminRemote = createServerFn({ method: "POST" })
  .inputValidator((data: { adminWhatsapp: string; empresaId: string; dateFrom?: string; dateTo?: string }) =>
    adminWhatsappSchema
      .extend({
        empresaId: z.string().uuid(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await assertFromInput(data.adminWhatsapp);
    return listarPagamentosPlano({
      empresaId: data.empresaId,
      dateFrom: data.dateFrom,
      dateTo: data.dateTo,
    });
  });

export const getAdminSettingsRemote = createServerFn({ method: "POST" })
  .inputValidator((data: { adminWhatsapp: string }) => adminWhatsappSchema.parse(data))
  .handler(async ({ data }) => {
    await assertFromInput(data.adminWhatsapp);
    return getAdminSettings();
  });

export const saveAdminBillingPlanRemote = createServerFn({ method: "POST" })
  .inputValidator((data: { adminWhatsapp: string; planValueReais: number }) =>
    adminWhatsappSchema.extend({ planValueReais: z.number().positive() }).parse(data),
  )
  .handler(async ({ data }) => {
    await assertFromInput(data.adminWhatsapp);
    return saveAdminBillingPlan(data.planValueReais);
  });

export const saveAdminContactWhatsappRemote = createServerFn({ method: "POST" })
  .inputValidator((data: { adminWhatsapp: string; contactWhatsapp: string }) =>
    adminWhatsappSchema.extend({ contactWhatsapp: z.string() }).parse(data),
  )
  .handler(async ({ data }) => {
    await assertFromInput(data.adminWhatsapp);
    return saveAdminContactWhatsapp(data.contactWhatsapp);
  });

export const saveEvolutionInstanceAdminRemote = createServerFn({ method: "POST" })
  .inputValidator((data: { adminWhatsapp: string; instanceName: string; connectionPhone: string; recreate?: boolean }) =>
    adminWhatsappSchema
      .extend({
        instanceName: z.string().min(1),
        connectionPhone: z.string().regex(/^\d{11}$/),
        recreate: z.boolean().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    await assertFromInput(data.adminWhatsapp);
    return saveEvolutionInstanceAdmin(data.instanceName, data.connectionPhone, undefined, {
      recreate: data.recreate,
    });
  });

export const getEvolutionQrAdminRemote = createServerFn({ method: "POST" })
  .inputValidator((data: { adminWhatsapp: string }) => adminWhatsappSchema.parse(data))
  .handler(async ({ data }) => {
    await assertFromInput(data.adminWhatsapp);
    return getEvolutionQrAdmin();
  });

export const refreshEvolutionConnectionAdminRemote = createServerFn({ method: "POST" })
  .inputValidator((data: { adminWhatsapp: string }) => adminWhatsappSchema.parse(data))
  .handler(async ({ data }) => {
    await assertFromInput(data.adminWhatsapp);
    return refreshEvolutionConnectionAdmin();
  });

export const getAdminDashboardRemote = createServerFn({ method: "POST" })
  .inputValidator((data: { adminWhatsapp: string; from: string; to: string }) =>
    adminWhatsappSchema.extend({ from: z.string(), to: z.string() }).parse(data),
  )
  .handler(async ({ data }) => {
    await assertFromInput(data.adminWhatsapp);
    return getAdminDashboard(data.from, data.to);
  });
