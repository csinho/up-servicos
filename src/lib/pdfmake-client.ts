import { buildOrcamentoPdfDoc } from "./pdf-orcamento";
import type { Cliente, Empresa, Orcamento } from "./types";

type PdfMakeInstance = {
  vfs?: Record<string, string>;
  createPdf: (doc: ReturnType<typeof buildOrcamentoPdfDoc>) => {
    getBlob: (cb: (blob: Blob) => void) => void;
    download: (filename: string) => void;
  };
};

let pdfMakeReady: Promise<PdfMakeInstance> | null = null;

function resolvePdfMake(mod: unknown): PdfMakeInstance {
  const candidate =
    (mod as { default?: PdfMakeInstance }).default ?? (mod as PdfMakeInstance);
  if (candidate && typeof candidate.createPdf === "function") {
    return candidate;
  }
  throw new Error("Biblioteca pdfmake não inicializou corretamente.");
}

function resolveVfs(mod: unknown): Record<string, string> | undefined {
  const m = mod as {
    default?: Record<string, string>;
    pdfMake?: { vfs?: Record<string, string> };
  };
  if (m.pdfMake?.vfs) return m.pdfMake.vfs;
  const d = m.default;
  if (d && typeof d === "object" && !("createPdf" in d)) {
    return d as Record<string, string>;
  }
  return undefined;
}

async function loadPdfMake(): Promise<PdfMakeInstance> {
  if (!pdfMakeReady) {
    pdfMakeReady = (async () => {
      const [pdfMakeMod, vfsMod] = await Promise.all([
        import("pdfmake/build/pdfmake.js"),
        import("pdfmake/build/vfs_fonts.js"),
      ]);

      const pdfMake = resolvePdfMake(pdfMakeMod);
      const vfs = resolveVfs(vfsMod);
      if (vfs) pdfMake.vfs = vfs;

      return pdfMake;
    })();
  }
  return pdfMakeReady;
}

export async function createOrcamentoPdfBlob(
  orcamento: Orcamento,
  empresa: Empresa,
  cliente?: Cliente,
): Promise<Blob> {
  const pdfMake = await loadPdfMake();
  const doc = buildOrcamentoPdfDoc(orcamento, empresa, cliente);
  return new Promise((resolve, reject) => {
    try {
      pdfMake.createPdf(doc).getBlob((blob: Blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Falha ao gerar PDF"));
      });
    } catch (e) {
      reject(e);
    }
  });
}

export async function downloadOrcamentoPdf(
  orcamento: Orcamento,
  empresa: Empresa,
  cliente?: Cliente,
): Promise<void> {
  const pdfMake = await loadPdfMake();
  const doc = buildOrcamentoPdfDoc(orcamento, empresa, cliente);
  pdfMake.createPdf(doc).download(`${orcamento.numero}.pdf`);
}

export async function openOrcamentoPdf(
  orcamento: Orcamento,
  empresa: Empresa,
  cliente?: Cliente,
): Promise<string> {
  const blob = await createOrcamentoPdfBlob(orcamento, empresa, cliente);
  return URL.createObjectURL(blob);
}

export function getOrcamentoDocDefinition(
  orcamento: Orcamento,
  empresa: Empresa,
  cliente?: Cliente,
) {
  return buildOrcamentoPdfDoc(orcamento, empresa, cliente);
}
