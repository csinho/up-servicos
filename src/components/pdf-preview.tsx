import { useEffect, useState } from "react";
import type { Cliente, Empresa, Orcamento } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

type PdfProps = { orcamento: Orcamento; empresa: Empresa; cliente?: Cliente };

async function pdfClient() {
  return import("@/lib/pdfmake-client");
}

export function PDFPreview({ orcamento, empresa, cliente }: PdfProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let revoked: string | null = null;
    setError(null);
    setUrl(null);
    pdfClient()
      .then((m) => m.openOrcamentoPdf(orcamento, empresa, cliente))
      .then((u) => {
        revoked = u;
        setUrl(u);
      })
      .catch((e) => setError((e as Error).message ?? "Erro ao gerar PDF"));
    return () => {
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [orcamento, empresa, cliente]);

  if (error) {
    return <div className="p-8 text-center text-sm text-destructive">{error}</div>;
  }
  if (!url) {
    return <div className="p-8 text-center text-sm text-muted-foreground">Gerando PDF…</div>;
  }
  return (
    <iframe
      title="Pré-visualização do PDF"
      src={url}
      className="w-full h-full min-h-[70vh] border-0"
    />
  );
}

export function DownloadBtn({ orcamento, empresa, cliente }: PdfProps) {
  const [loading, setLoading] = useState(false);

  return (
    <Button
      variant="outline"
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          const m = await pdfClient();
          await m.downloadOrcamentoPdf(orcamento, empresa, cliente);
        } finally {
          setLoading(false);
        }
      }}
    >
      <Download className="h-4 w-4 mr-1" />
      {loading ? "Gerando…" : "Baixar PDF"}
    </Button>
  );
}
