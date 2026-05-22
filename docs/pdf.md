# Geração de PDF

Implementada em `src/components/pdf-preview.tsx` usando `@react-pdf/renderer`.

## Componentes exportados

- `OrcamentoDoc` — componente `<Document>` do orçamento (estrutura completa).
- `PDFPreview` — envolve `OrcamentoDoc` em `<PDFViewer>` (iframe inline).
- `DownloadBtn` — botão com `<PDFDownloadLink>` que baixa `ORC-….pdf`.

Esses componentes só rodam no **navegador** (PDFViewer usa APIs do DOM). Em `orcamentos.$id.tsx` eles são importados via `import()` dentro de `useEffect`, evitando erro de SSR.

## Layout do PDF

Inspirado no modelo enviado pelo usuário (`PED-20260517-00022.pdf`):

1. **Cabeçalho** — logo + dados da empresa à esquerda; bloco "ORÇAMENTO Nº", data, validade, prazo à direita. Linha preta inferior.
2. **Cliente + Projeto** — dois cards lado a lado.
3. **Tabela de itens** — colunas: #, Serviço/Descrição, Un., Qtd, Valor un., Subtotal. Cabeçalho com fundo preto.
4. **Totais** — caixa à direita: Subtotal, Desconto, Acréscimo, **Total** destacado.
5. **Condições + Observações** — dois cards. Inclui dados bancários da empresa.
6. **Aceite** — linha dupla para data e assinatura do cliente.
7. **Rodapé** — empresa + número + data.

## Como customizar

Tudo está em `pdf-preview.tsx`. As cores, espaçamentos e larguras de coluna estão no objeto `s` (StyleSheet). Para adicionar/remover seção, edite o JSX dentro do `<Page>`.

### Trocar fonte

`@react-pdf` aceita registro de fontes via `Font.register(...)`. Por padrão usamos Helvetica (built-in).

## Dados usados

A função recebe `{ orcamento, empresa, cliente }`. Tudo vem do store:
- `empresa` — dados da sua empresa (módulo Empresa).
- `cliente` — `clientes.find(c => c.id === orcamento.cliente_id)`.
- `orcamento` — o registro atual (com `itens`, totais, condições etc.).
