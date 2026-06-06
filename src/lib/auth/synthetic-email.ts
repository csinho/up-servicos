export type AuthSyntheticTipo = "empresa" | "admin";

const PREFIX = "freela_os";

export function syntheticAuthEmail(tipo: AuthSyntheticTipo, whatsapp11: string): string {
  return `${PREFIX}_${tipo}_${whatsapp11}@auth.freelaos.local`;
}
