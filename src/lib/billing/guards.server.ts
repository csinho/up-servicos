import { fetchEmpresaBilling } from "./empresa.server";
import { billingBlocksMutation, empresaBlocksMutation, getBillingUiState } from "./state";

export async function assertEmpresaAllowsMutation(
  empresaId?: string,
  env?: Record<string, string | undefined>,
): Promise<void> {
  const empresa = await fetchEmpresaBilling(empresaId, env);
  if (empresaBlocksMutation(empresa)) {
    throw new Error("Conta pausada pela administração — entre em contato com o suporte.");
  }
}

export async function assertBillingAllowsMutation(
  empresaId?: string,
  env?: Record<string, string | undefined>,
): Promise<void> {
  await assertEmpresaAllowsMutation(empresaId, env);
  const empresa = await fetchEmpresaBilling(empresaId, env);
  const state = getBillingUiState(empresa);
  if (billingBlocksMutation(state)) {
    throw new Error("Plano pendente — acesse Plano para pagar e liberar novas ações.");
  }
}

export async function getBillingMutationAllowed(
  empresaId?: string,
  env?: Record<string, string | undefined>,
): Promise<{ allowed: boolean; message?: string }> {
  const empresa = await fetchEmpresaBilling(empresaId, env);
  if (empresaBlocksMutation(empresa)) {
    return {
      allowed: false,
      message: "Conta pausada pela administração — entre em contato com o suporte.",
    };
  }
  const state = getBillingUiState(empresa);
  if (billingBlocksMutation(state)) {
    return {
      allowed: false,
      message: "Plano pendente — acesse Plano para pagar e liberar novas ações.",
    };
  }
  return { allowed: true };
}
