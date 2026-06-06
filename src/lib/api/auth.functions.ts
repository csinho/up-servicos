import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { normalizeWhatsapp11 } from "@/lib/admin/allowlist.server";
import { getRuntimeEnv } from "@/lib/worker-env.server";
import {
  checkWhatsappRegistered,
  confirmAdminLoginOtpUnified,
  confirmEmpresaLoginOtp,
  registerEmpresaByAdmin,
  registerEmpresaWithAuth,
  requestAdminLoginOtpUnified,
  requestEmpresaLoginOtp,
  resolveLoginRole,
  verifyWhatsAppOnRegister,
} from "@/lib/auth/empresa-auth.server";

const whatsappInput = z.object({ whatsapp: z.string() });

export const resolveLoginRoleRemote = createServerFn({ method: "POST" })
  .inputValidator((data: { whatsapp: string }) => whatsappInput.parse(data))
  .handler(async ({ data }) => {
    const env = getRuntimeEnv();
    const whatsapp = normalizeWhatsapp11(data.whatsapp);
    return resolveLoginRole(whatsapp, env);
  });

export const checkWhatsappRegisteredRemote = createServerFn({ method: "POST" })
  .inputValidator((data: { whatsapp: string }) => whatsappInput.parse(data))
  .handler(async ({ data }) => {
    const env = getRuntimeEnv();
    const whatsapp = normalizeWhatsapp11(data.whatsapp);
    return checkWhatsappRegistered(whatsapp, env);
  });

export const verifyWhatsAppOnRegisterRemote = createServerFn({ method: "POST" })
  .inputValidator((data: { whatsapp: string }) => whatsappInput.parse(data))
  .handler(async ({ data }) => {
    const env = getRuntimeEnv();
    const whatsapp = normalizeWhatsapp11(data.whatsapp);
    return verifyWhatsAppOnRegister(whatsapp, env);
  });

export const registerEmpresaWithAuthRemote = createServerFn({ method: "POST" })
  .inputValidator(
    (data: { nome: string; whatsapp: string; categoria?: "generico" | "assistencia_tecnica" }) =>
      z
        .object({
          nome: z.string().min(2),
          whatsapp: z.string(),
          categoria: z.enum(["generico", "assistencia_tecnica"]).optional(),
        })
        .parse(data),
  )
  .handler(async ({ data }) => {
    const env = getRuntimeEnv();
    const whatsapp = normalizeWhatsapp11(data.whatsapp);
    return registerEmpresaWithAuth(data.nome, whatsapp, data.categoria ?? "generico", env);
  });

export const requestLoginOtpRemote = createServerFn({ method: "POST" })
  .inputValidator((data: { whatsapp: string; role: "admin" | "empresa" }) =>
    z
      .object({
        whatsapp: z.string(),
        role: z.enum(["admin", "empresa"]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const env = getRuntimeEnv();
    const whatsapp = normalizeWhatsapp11(data.whatsapp);
    if (data.role === "admin") {
      return requestAdminLoginOtpUnified(whatsapp, env);
    }
    return requestEmpresaLoginOtp(whatsapp, env);
  });

export const confirmLoginOtpRemote = createServerFn({ method: "POST" })
  .inputValidator((data: { whatsapp: string; code: string; role: "admin" | "empresa" }) =>
    z
      .object({
        whatsapp: z.string(),
        code: z.string(),
        role: z.enum(["admin", "empresa"]),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const env = getRuntimeEnv();
    const whatsapp = normalizeWhatsapp11(data.whatsapp);
    const code = data.code.replace(/\D/g, "");
    if (code.length !== 6) throw new Error("Código deve ter 6 dígitos.");

    if (data.role === "admin") {
      return confirmAdminLoginOtpUnified(whatsapp, code, env);
    }
    return confirmEmpresaLoginOtp(whatsapp, code, env);
  });

export const registerEmpresaByAdminRemote = createServerFn({ method: "POST" })
  .inputValidator((data: { adminWhatsapp: string; nome: string; whatsapp: string }) =>
    z
      .object({
        adminWhatsapp: z.string().regex(/^\d{11}$/),
        nome: z.string().min(2),
        whatsapp: z.string(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { assertAdminWhatsappAllowed } = await import("@/lib/admin/allowlist.server");
    const env = getRuntimeEnv();
    await assertAdminWhatsappAllowed(data.adminWhatsapp, env);
    const whatsapp = normalizeWhatsapp11(data.whatsapp);
    return registerEmpresaByAdmin(data.nome, whatsapp, env);
  });
