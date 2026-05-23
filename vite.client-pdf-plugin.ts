import type { Plugin } from "vite";

const STUB = `
export function PDFPreview() { return null; }
export function DownloadBtn() { return null; }
export async function createOrcamentoPdfBlob() { throw new Error("PDF só no navegador"); }
export async function downloadOrcamentoPdf() { throw new Error("PDF só no navegador"); }
export async function openOrcamentoPdf() { throw new Error("PDF só no navegador"); }
export function getOrcamentoDocDefinition() { return {}; }
export function buildOrcamentoPdfDoc() { return {}; }
`;

function isPdfModule(id: string): boolean {
  if (id.includes("pdf-preview") || id.includes("pdfmake-client") || id.includes("pdf-orcamento")) {
    return true;
  }
  return /pdfmake(\/|$|\\)/.test(id);
}

/** pdfmake (~2 MB) só no browser — evita SSR/Docker travar no build. */
export function clientOnlyPdfPlugin(): Plugin {
  return {
    name: "freela-client-only-pdf",
    enforce: "pre",
    resolveId(source, _importer, options) {
      if (!options?.ssr || !isPdfModule(source)) return null;
      return "\0freela-pdf-stub";
    },
    load(id, options) {
      if (!options?.ssr || id !== "\0freela-pdf-stub") return null;
      return STUB;
    },
  };
}
