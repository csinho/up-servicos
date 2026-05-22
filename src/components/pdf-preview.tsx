import { Document, Page, Text, View, StyleSheet, Image, PDFViewer, PDFDownloadLink, Font } from "@react-pdf/renderer";
import type { Cliente, Empresa, Orcamento } from "@/lib/types";
import { calcSubtotal, calcTotal, formatBRL, formatDate } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

const s = StyleSheet.create({
  page: { padding: 28, fontSize: 9, fontFamily: "Helvetica", color: "#111" },
  row: { flexDirection: "row" },
  between: { flexDirection: "row", justifyContent: "space-between" },
  headerWrap: { flexDirection: "row", justifyContent: "space-between", borderBottom: "2 solid #111", paddingBottom: 10, marginBottom: 12 },
  brand: { flexDirection: "row", gap: 12, alignItems: "center" },
  logo: { width: 56, height: 56, objectFit: "contain" },
  companyName: { fontSize: 14, fontWeight: 700 },
  small: { fontSize: 8, color: "#444" },
  rightBox: { alignItems: "flex-end" },
  docTitle: { fontSize: 11, color: "#555", letterSpacing: 1 },
  docNumber: { fontSize: 14, fontWeight: 700 },
  section: { marginTop: 10 },
  sectionTitle: { fontSize: 9, textTransform: "uppercase", color: "#666", letterSpacing: 1, marginBottom: 4 },
  card: { border: "1 solid #ddd", borderRadius: 4, padding: 8 },
  twoCol: { flexDirection: "row", gap: 8 },
  col: { flex: 1 },
  th: { backgroundColor: "#111", color: "#fff", padding: 5, fontSize: 8, fontWeight: 700 },
  td: { padding: 5, fontSize: 8, borderBottom: "0.5 solid #ddd" },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  totalFinal: { flexDirection: "row", justifyContent: "space-between", paddingTop: 4, marginTop: 4, borderTop: "1 solid #111", fontSize: 11, fontWeight: 700 },
  footer: { marginTop: 18, paddingTop: 10, borderTop: "1 solid #ddd", fontSize: 8, color: "#444" },
  signBox: { marginTop: 14, flexDirection: "row", gap: 16 },
  signCol: { flex: 1, borderTop: "1 solid #111", paddingTop: 4, fontSize: 8, textAlign: "center" },
});

function enderecoLinha(e?: { rua?: string; numero?: string; bairro?: string; cidade?: string; estado?: string; cep?: string }) {
  if (!e) return "";
  const p1 = [e.rua, e.numero].filter(Boolean).join(", ");
  const p2 = [e.bairro, e.cidade && `${e.cidade}/${e.estado || ""}`].filter(Boolean).join(" — ");
  return [p1, p2, e.cep && `CEP ${e.cep}`].filter(Boolean).join(" — ");
}

export function OrcamentoDoc({ orcamento, empresa, cliente }: { orcamento: Orcamento; empresa: Empresa; cliente?: Cliente }) {
  const subtotal = calcSubtotal(orcamento.itens);
  const total = calcTotal(orcamento);
  const itens = orcamento.itens;

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.headerWrap}>
          <View style={s.brand}>
            {empresa.logo_url ? <Image src={empresa.logo_url} style={s.logo} /> : <View style={{ width: 56, height: 56, borderRadius: 4, backgroundColor: "#111" }} />}
            <View>
              <Text style={s.companyName}>{empresa.nome}</Text>
              {empresa.documento && <Text style={s.small}>{empresa.documento}</Text>}
              {(empresa.telefone || empresa.email) && <Text style={s.small}>{[empresa.telefone, empresa.email].filter(Boolean).join(" · ")}</Text>}
              <Text style={s.small}>{enderecoLinha(empresa.endereco)}</Text>
              {empresa.site && <Text style={s.small}>{empresa.site}</Text>}
            </View>
          </View>
          <View style={s.rightBox}>
            <Text style={s.docTitle}>ORÇAMENTO</Text>
            <Text style={s.docNumber}>{orcamento.numero}</Text>
            <Text style={s.small}>Emissão: {formatDate(orcamento.data_criacao)}</Text>
            {orcamento.validade && <Text style={s.small}>Validade: {formatDate(orcamento.validade)}</Text>}
            {orcamento.prazo_entrega && <Text style={s.small}>Prazo: {formatDate(orcamento.prazo_entrega)}</Text>}
          </View>
        </View>

        {/* Cliente + Projeto */}
        <View style={s.twoCol}>
          <View style={[s.col, s.card]}>
            <Text style={s.sectionTitle}>Dados do cliente</Text>
            <Text style={{ fontWeight: 700, fontSize: 10 }}>{cliente?.nome || "—"}</Text>
            {cliente?.documento && <Text style={s.small}>{cliente.documento}</Text>}
            {(cliente?.telefone || cliente?.email) && <Text style={s.small}>{[cliente.telefone, cliente.email].filter(Boolean).join(" · ")}</Text>}
            <Text style={s.small}>{enderecoLinha(cliente?.endereco)}</Text>
          </View>
          <View style={[s.col, s.card]}>
            <Text style={s.sectionTitle}>Projeto</Text>
            <Text style={{ fontWeight: 700, fontSize: 10 }}>{orcamento.nome_projeto}</Text>
            {orcamento.descricao && <Text style={s.small}>{orcamento.descricao}</Text>}
          </View>
        </View>

        {/* Itens */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Itens do orçamento</Text>
          <View style={s.row}>
            <Text style={[s.th, { flex: 0.4 }]}>#</Text>
            <Text style={[s.th, { flex: 3 }]}>Serviço / Descrição</Text>
            <Text style={[s.th, { flex: 0.7, textAlign: "center" }]}>Un.</Text>
            <Text style={[s.th, { flex: 0.7, textAlign: "right" }]}>Qtd</Text>
            <Text style={[s.th, { flex: 1.2, textAlign: "right" }]}>Valor un.</Text>
            <Text style={[s.th, { flex: 1.3, textAlign: "right" }]}>Subtotal</Text>
          </View>
          {itens.map((it, i) => (
            <View key={it.id} style={s.row}>
              <Text style={[s.td, { flex: 0.4 }]}>{i + 1}</Text>
              <View style={[s.td, { flex: 3 }]}>
                <Text style={{ fontWeight: 700 }}>{it.nome}</Text>
                {it.descricao ? <Text style={{ color: "#555" }}>{it.descricao}</Text> : null}
              </View>
              <Text style={[s.td, { flex: 0.7, textAlign: "center" }]}>{it.unidade}</Text>
              <Text style={[s.td, { flex: 0.7, textAlign: "right" }]}>{it.quantidade}</Text>
              <Text style={[s.td, { flex: 1.2, textAlign: "right" }]}>{formatBRL(it.valor_unitario)}</Text>
              <Text style={[s.td, { flex: 1.3, textAlign: "right" }]}>{formatBRL(it.quantidade * it.valor_unitario)}</Text>
            </View>
          ))}
        </View>

        {/* Totais */}
        <View style={[s.section, { flexDirection: "row" }]}>
          <View style={{ flex: 1 }} />
          <View style={{ width: 220, padding: 8, border: "1 solid #ddd", borderRadius: 4 }}>
            <View style={s.totalsRow}><Text>Subtotal</Text><Text>{formatBRL(subtotal)}</Text></View>
            <View style={s.totalsRow}><Text>Desconto</Text><Text>- {formatBRL(orcamento.desconto || 0)}</Text></View>
            <View style={s.totalsRow}><Text>Acréscimo</Text><Text>+ {formatBRL(orcamento.acrescimo || 0)}</Text></View>
            <View style={s.totalFinal}><Text>Total</Text><Text>{formatBRL(total)}</Text></View>
          </View>
        </View>

        {/* Condições */}
        <View style={[s.section, s.twoCol]}>
          <View style={[s.col, s.card]}>
            <Text style={s.sectionTitle}>Condições comerciais</Text>
            <Text style={{ fontSize: 8, lineHeight: 1.4 }}>{orcamento.condicoes || "—"}</Text>
            {orcamento.forma_pagamento && <Text style={[s.small, { marginTop: 4 }]}>Pagamento: {orcamento.forma_pagamento}</Text>}
            {empresa.dados_bancarios && <Text style={s.small}>{empresa.dados_bancarios}</Text>}
          </View>
          <View style={[s.col, s.card]}>
            <Text style={s.sectionTitle}>Observações</Text>
            <Text style={{ fontSize: 8, lineHeight: 1.4 }}>{orcamento.observacoes || "—"}</Text>
          </View>
        </View>

        {/* Aceite */}
        <View style={s.signBox}>
          <Text style={s.signCol}>Data do aceite</Text>
          <Text style={s.signCol}>Assinatura do cliente — {cliente?.nome || ""}</Text>
        </View>

        <Text style={s.footer}>
          {empresa.nome} · {formatDate(orcamento.data_criacao)} · Orçamento {orcamento.numero}
        </Text>
      </Page>
    </Document>
  );
}

export function PDFPreview(props: { orcamento: Orcamento; empresa: Empresa; cliente?: Cliente }) {
  return (
    <PDFViewer style={{ width: "100%", height: "100%", border: 0 }}>
      <OrcamentoDoc {...props} />
    </PDFViewer>
  );
}

export function DownloadBtn(props: { orcamento: Orcamento; empresa: Empresa; cliente?: Cliente }) {
  const filename = `${props.orcamento.numero}.pdf`;
  return (
    <PDFDownloadLink document={<OrcamentoDoc {...props} />} fileName={filename}>
      {({ loading }) => (
        <Button variant="outline" disabled={loading}>
          <Download className="h-4 w-4 mr-1" /> {loading ? "Gerando…" : "Baixar PDF"}
        </Button>
      )}
    </PDFDownloadLink>
  );
}
