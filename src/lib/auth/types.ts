export type EmpresaSessao = {
  tipo: "empresa";
  id: string;
  nome: string;
  whatsapp: string;
};

export type LoginRole = "admin" | "empresa" | "none";

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type LoginConfirmResult = {
  sessao: EmpresaSessao | import("@/lib/admin/types").AdminSessao;
  auth?: AuthTokens;
};
