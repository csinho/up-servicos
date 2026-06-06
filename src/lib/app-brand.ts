export const APP_NAME = "Up Serviços";
export const APP_NAME_ADMIN = "Up Serviços Admin";
export const APP_LOGO_INITIALS = "US";
export const APP_DESCRIPTION =
  "Gestão de orçamentos, pedidos e financeiro para prestadores de serviço";

export function pageTitle(suffix: string): string {
  return `${suffix} — ${APP_NAME}`;
}

export function adminPageTitle(suffix: string): string {
  return `${suffix} — ${APP_NAME_ADMIN}`;
}
