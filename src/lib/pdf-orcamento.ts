import type { Cliente, Empresa, Orcamento } from "./types";

/** Tipos mínimos do docDefinition (evita importar pdfmake no bundle SSR). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PdfContent = any;
type PdfDocDefinition = {
  pageSize?: string;
  pageMargins?: number[];
  defaultStyle?: Record<string, unknown>;
  styles?: Record<string, unknown>;
  footer?: () => PdfContent;
  content: PdfContent[];
};
import {
  calcDescontoValor,
  calcSubtotal,
  calcTotal,
  formatBRL,
  formatGarantia,
  formatCalendarDate,
  formatDate,
  formatPercentLabel,
} from "./types";
import { labelDocumento, labelDocumentoLower } from "./empresa-categorias";

function enderecoLinha(e?: {
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
}): string {
  if (!e) return "";
  const p1 = [e.rua, e.numero].filter(Boolean).join(", ");
  const p2 = [e.bairro, e.cidade && `${e.cidade}/${e.estado || ""}`].filter(Boolean).join(" — ");
  return [p1, p2, e.cep && `CEP ${e.cep}`].filter(Boolean).join(" — ");
}

/** Linha de assinatura + rótulo centralizado na mesma coluna. */
function signatureField(label: string): PdfContent {
  return {
    width: "*",
    stack: [
      {
        table: {
          widths: ["*"],
          body: [[{ text: " ", margin: [0, 20, 0, 0] }]],
        },
        layout: {
          hLineWidth: (i: number, node: { table: { body: unknown[] } }) =>
            i === node.table.body.length ? 0.5 : 0,
          vLineWidth: () => 0,
          hLineColor: () => "#111111",
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0,
        },
      },
      { text: label, style: "small", alignment: "center", margin: [0, 4, 0, 0] },
    ],
  };
}

function card(title: string, body: PdfContent[]): PdfContent {
  return {
    margin: [0, 0, 0, 8],
    table: {
      widths: ["*"],
      body: [[{ stack: [{ text: title, style: "sectionTitle", margin: [0, 0, 0, 4] }, ...body] }]],
    },
    layout: {
      hLineWidth: () => 1,
      vLineWidth: () => 1,
      hLineColor: () => "#dddddd",
      vLineColor: () => "#dddddd",
      paddingLeft: () => 8,
      paddingRight: () => 8,
      paddingTop: () => 8,
      paddingBottom: () => 8,
    },
  };
}

export function buildOrcamentoPdfDoc(
  orcamento: Orcamento,
  empresa: Empresa,
  cliente?: Cliente,
): PdfDocDefinition {
  const subtotal = calcSubtotal(orcamento.itens);
  const descontoValor = calcDescontoValor(subtotal, orcamento.desconto_percentual);
  const total = calcTotal(orcamento);
  const cat = empresa.categoria;
  const docLabel = labelDocumento(orcamento.status, cat).toUpperCase();
  const itensTitulo = `Itens do ${labelDocumentoLower(orcamento.status, cat)}`;
  const assistencia = orcamento.assistencia;

  const empresaCol: PdfContent[] = [
    { text: empresa.nome, style: "companyName" },
    ...(empresa.documento ? [{ text: empresa.documento, style: "small" }] : []),
    ...((empresa.telefone || empresa.email)
      ? [{ text: [empresa.telefone, empresa.email].filter(Boolean).join(" · "), style: "small" }]
      : []),
    { text: enderecoLinha(empresa.endereco), style: "small" },
    ...(empresa.site ? [{ text: empresa.site, style: "small" }] : []),
  ];

  const headerLeft: PdfContent = empresa.logo_url
    ? {
        columns: [
          { image: empresa.logo_url, width: 48, margin: [0, 2, 0, 0] },
          { stack: empresaCol, width: "*" },
        ],
        columnGap: 18,
      }
    : { stack: empresaCol };

  const itemRows: PdfContent[][] = [
    [
      { text: "#", style: "tableHeader" },
      { text: "Serviço / Descrição", style: "tableHeader" },
      { text: "Un.", style: "tableHeader", alignment: "center" },
      { text: "Qtd", style: "tableHeader", alignment: "right" },
      { text: "Valor un.", style: "tableHeader", alignment: "right" },
      { text: "Subtotal", style: "tableHeader", alignment: "right" },
    ],
    ...orcamento.itens.map((it, i) => [
      { text: String(i + 1), style: "tableCell" },
      {
        stack: [
          { text: it.nome, bold: true, fontSize: 8 },
          ...(it.descricao ? [{ text: it.descricao, fontSize: 7, color: "#555555" }] : []),
        ],
        style: "tableCell",
      },
      { text: it.unidade, style: "tableCell", alignment: "center" },
      { text: String(it.quantidade), style: "tableCell", alignment: "right" },
      { text: formatBRL(it.valor_unitario), style: "tableCell", alignment: "right" },
      {
        text: formatBRL(it.quantidade * it.valor_unitario),
        style: "tableCell",
        alignment: "right",
      },
    ]),
  ];

  const descontoLabel =
    orcamento.desconto_percentual > 0
      ? `Desconto (${formatPercentLabel(orcamento.desconto_percentual)})`
      : "Desconto";

  const footerText = `${empresa.nome} · ${formatDate(orcamento.data_criacao)} · ${labelDocumento(orcamento.status, cat)} ${orcamento.numero}`;

  return {
    pageSize: "A4",
    pageMargins: [28, 28, 28, 92],
    defaultStyle: { fontSize: 9, color: "#111111" },
    styles: {
      companyName: { fontSize: 13, bold: true },
      small: { fontSize: 8, color: "#444444" },
      docTitle: { fontSize: 10, color: "#555555" },
      docNumber: { fontSize: 13, bold: true },
      sectionTitle: { fontSize: 8, color: "#666666", bold: true },
      tableHeader: { fontSize: 8, bold: true, color: "#ffffff", fillColor: "#111111" },
      tableCell: { fontSize: 8 },
      totalFinal: { fontSize: 10, bold: true },
    },
    footer: () => ({
      margin: [28, 0, 28, 16],
      stack: [
        {
          columns: [
            signatureField("Data do aceite"),
            signatureField(
              `Assinatura do cliente${cliente?.nome ? ` — ${cliente.nome}` : ""}`,
            ),
          ],
          columnGap: 24,
        },
        {
          text: footerText,
          alignment: "center",
          fontSize: 8,
          color: "#666666",
          margin: [0, 16, 0, 0],
        },
      ],
    }),
    content: [
      {
        columns: [
          { width: "*", stack: [headerLeft] },
          {
            width: 160,
            alignment: "right",
            stack: [
              { text: docLabel, style: "docTitle" },
              { text: orcamento.numero, style: "docNumber" },
              { text: `Emissão: ${formatDate(orcamento.data_criacao)}`, style: "small" },
              ...(orcamento.validade
                ? [{ text: `Validade: ${formatCalendarDate(orcamento.validade)}`, style: "small" }]
                : []),
              ...(orcamento.prazo_entrega
                ? [{ text: `Prazo: ${formatCalendarDate(orcamento.prazo_entrega)}`, style: "small" }]
                : []),
            ],
          },
        ],
        margin: [0, 0, 0, 12],
      },
      { canvas: [{ type: "line", x1: 0, y1: 0, x2: 539, y2: 0, lineWidth: 2 }], margin: [0, 4, 0, 14] },
      {
        columns: [
          card("Dados do cliente", [
            { text: cliente?.nome || "—", bold: true, fontSize: 10 },
            ...(cliente?.documento ? [{ text: cliente.documento, style: "small" }] : []),
            ...((cliente?.telefone || cliente?.email)
              ? [
                  {
                    text: [cliente.telefone, cliente.email].filter(Boolean).join(" · "),
                    style: "small",
                  },
                ]
              : []),
            { text: enderecoLinha(cliente?.endereco), style: "small" },
          ]),
          ...(assistencia &&
          (assistencia.aparelho_marca ||
            assistencia.aparelho_modelo ||
            assistencia.imei ||
            assistencia.defeito_relatado)
            ? [
                card("Aparelho", [
                  {
                    text:
                      [assistencia.aparelho_marca, assistencia.aparelho_modelo]
                        .filter(Boolean)
                        .join(" ") || orcamento.nome_projeto,
                    bold: true,
                    fontSize: 10,
                  },
                  ...(assistencia.imei
                    ? [{ text: `IMEI: ${assistencia.imei}`, style: "small" }]
                    : []),
                  ...(assistencia.defeito_relatado
                    ? [{ text: `Defeito relatado: ${assistencia.defeito_relatado}`, style: "small" }]
                    : []),
                  ...(assistencia.acessorios
                    ? [{ text: `Acessórios: ${assistencia.acessorios}`, style: "small" }]
                    : []),
                ]),
              ]
            : [
                card("Projeto", [
                  { text: orcamento.nome_projeto, bold: true, fontSize: 10 },
                  ...(orcamento.descricao ? [{ text: orcamento.descricao, style: "small" }] : []),
                ]),
              ]),
        ],
        columnGap: 8,
      },
      { text: itensTitulo, style: "sectionTitle", margin: [0, 8, 0, 4] },
      {
        table: {
          headerRows: 1,
          widths: [22, "*", 36, 36, 58, 62],
          body: itemRows,
        },
        layout: {
          hLineWidth: (i: number, node: { table: { body: unknown[] } }) =>
            i === 0 || i === node.table.body.length ? 0 : 0.5,
          vLineWidth: () => 0,
          hLineColor: () => "#dddddd",
          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 4,
          paddingBottom: () => 4,
        },
        margin: [0, 0, 0, 10],
      },
      {
        columns: [
          { width: "*", text: "" },
          {
            width: 200,
            table: {
              widths: ["*", "auto"],
              body: [
                [
                  { text: "Subtotal", style: "tableCell" },
                  { text: formatBRL(subtotal), style: "tableCell", alignment: "right" },
                ],
                [
                  { text: descontoLabel, style: "tableCell" },
                  { text: `- ${formatBRL(descontoValor)}`, style: "tableCell", alignment: "right" },
                ],
                [
                  { text: "Acréscimo", style: "tableCell" },
                  {
                    text: `+ ${formatBRL(orcamento.acrescimo || 0)}`,
                    style: "tableCell",
                    alignment: "right",
                  },
                ],
                [
                  { text: "Total", style: "totalFinal" },
                  { text: formatBRL(total), style: "totalFinal", alignment: "right" },
                ],
              ],
            },
            layout: {
              hLineWidth: (i: number) => (i === 3 ? 1 : 0.5),
              vLineWidth: () => 0,
              hLineColor: () => "#dddddd",
              paddingLeft: () => 6,
              paddingRight: () => 6,
              paddingTop: () => 3,
              paddingBottom: () => 3,
            },
          },
        ],
        margin: [0, 0, 0, 10],
      },
      card("Observações", [{ text: orcamento.observacoes || "—", fontSize: 8 }]),
      card("Condições comerciais", [
        { text: orcamento.condicoes || "—", fontSize: 8 },
        ...(orcamento.forma_pagamento
          ? [{ text: `Pagamento: ${orcamento.forma_pagamento}`, style: "small", margin: [0, 4, 0, 0] }]
          : []),
        ...(formatGarantia(orcamento.garantia_quantidade, orcamento.garantia_unidade)
          ? [
              {
                text: `Garantia: ${formatGarantia(orcamento.garantia_quantidade, orcamento.garantia_unidade)}`,
                style: "small",
                margin: [0, 4, 0, 0],
              },
            ]
          : []),
        ...(empresa.dados_bancarios ? [{ text: empresa.dados_bancarios, style: "small" }] : []),
      ]),
    ],
  };
}
