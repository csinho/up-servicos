# Migrando para Supabase (Lovable Cloud)

Hoje o sistema usa **Zustand + localStorage** como repositório (`src/lib/store.ts`). A camada está pronta para troca: a UI **não conhece** os detalhes do storage, ela apenas chama `useApp()`.

## Passo a passo

1. **Ative Lovable Cloud** no projeto (botão da barra lateral do Lovable).
2. Aplique o SQL de `docs/banco-de-dados.md` (Cloud → Database → SQL).
3. Crie um arquivo `src/lib/repository/supabase.ts` que exponha as mesmas funções do store atual usando o client `@/integrations/supabase/client`:

```ts
import { supabase } from "@/integrations/supabase/client";

export const clientesRepo = {
  list: async () => (await supabase.from("clientes").select("*")).data ?? [],
  upsert: async (c) => supabase.from("clientes").upsert(c),
  remove: async (id) => supabase.from("clientes").delete().eq("id", id),
};
// repita para servicos, orcamentos (com itens via join), financeiro, empresa.
```

4. Reescreva `store.ts` para chamar os repos (ou use TanStack Query com `useQuery`/`useMutation`). Mantenha a mesma API pública (`useApp().clientes`, `upsertCliente`, etc.) para não tocar nos componentes.
5. Para o módulo **Empresa**, suba a logo para Storage e salve `logo_url` (ou continue com data URL).
6. Importe seus dados atuais do `localStorage` (DevTools → Application → Local Storage → `freela-os-v1`) e cole no SQL Editor como `insert`.

## Por que essa estrutura?

- Componentes consomem `useApp()` — não importa se vem do localStorage ou da rede.
- Os tipos em `src/lib/types.ts` são compartilhados.
- O cálculo (`calcTotal`, `calcSubtotal`) é puro e independente do storage.

## Trocando dados mockados por reais

- **Sem Supabase ainda:** abra **Clientes / Serviços / Empresa** e edite/remova/cadastre. Para limpar tudo, no console do navegador:
  ```js
  localStorage.removeItem("freela-os-v1"); location.reload();
  ```
  (Recarrega com os dados de seed novamente.)
- **Com Supabase:** apague os seeds e use os formulários normalmente — tudo persiste no banco.
