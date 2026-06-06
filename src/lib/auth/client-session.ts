import type { AdminSessao } from "@/lib/admin/types";

const SESSAO_KEY = "freela_os_sessao";

export type ClientSessao = AdminSessao;

export function getClientSessao(): ClientSessao | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSAO_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ClientSessao;
    if (parsed?.tipo === "admin" && typeof parsed.id === "string") {
      return parsed;
    }
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
