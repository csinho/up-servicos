import type { AdminSessao } from "@/lib/admin/types";
import type { EmpresaSessao } from "./types";

const SESSAO_KEY = "freela_os_sessao";

export type ClientSessao = AdminSessao | EmpresaSessao;

export function getClientSessao(): ClientSessao | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSAO_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ClientSessao;
    if (parsed?.tipo === "admin" && typeof parsed.id === "string") return parsed;
    if (parsed?.tipo === "empresa" && typeof parsed.id === "string") return parsed;
    return null;
  } catch {
    return null;
  }
}

export function setClientSessao(sessao: ClientSessao): void {
  localStorage.setItem(SESSAO_KEY, JSON.stringify(sessao));
}

export function clearClientSessao(): void {
  localStorage.removeItem(SESSAO_KEY);
}

export function isAdminSessao(sessao: ClientSessao | null): sessao is AdminSessao {
  return sessao?.tipo === "admin";
}

export function isEmpresaSessao(sessao: ClientSessao | null): sessao is EmpresaSessao {
  return sessao?.tipo === "empresa";
}

export function getEmpresaIdFromSessao(): string | null {
  const s = getClientSessao();
  return isEmpresaSessao(s) ? s.id : null;
}
