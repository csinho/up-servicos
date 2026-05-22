import type { Cliente, Empresa, Financeiro, Orcamento, Servico } from "./types";

export const seedEmpresa: Empresa = {
  id: "empresa-1",
  nome: "Sua Empresa Dev",
  documento: "000.000.000-00",
  telefone: "(11) 99999-9999",
  email: "contato@suaempresa.dev",
  site: "https://suaempresa.dev",
  endereco: {
    rua: "Rua Exemplo",
    numero: "100",
    bairro: "Centro",
    cidade: "São Paulo",
    estado: "SP",
    cep: "00000-000",
  },
  dados_bancarios: "PIX: contato@suaempresa.dev",
  condicoes_padrao:
    "• 50% na aprovação do orçamento e 50% na entrega.\n• Validade da proposta: 15 dias.\n• Alterações de escopo serão orçadas à parte.",
  observacoes_padrao:
    "Obrigado por considerar nossos serviços. Estamos à disposição para esclarecer qualquer dúvida.",
};

export const seedClientes: Cliente[] = [
  {
    id: "cli-1",
    nome: "Upcao Digital",
    telefone: "(71) 99711-9961",
    email: "contato@upcao.com",
    documento: "12.345.678/0001-90",
    endereco: { rua: "Rua Colibri", numero: "2", bairro: "Valéria", cidade: "Salvador", estado: "BA", cep: "41300-420" },
    observacoes: "Cliente recorrente",
    created_at: new Date().toISOString(),
  },
  {
    id: "cli-2",
    nome: "Padaria do Bairro",
    telefone: "(11) 98765-4321",
    email: "padaria@exemplo.com",
    endereco: { cidade: "São Paulo", estado: "SP" },
    created_at: new Date().toISOString(),
  },
];

export const seedServicos: Servico[] = [
  { id: "sv-1", nome: "Criação de site", descricao: "Site institucional responsivo", valor_padrao: 3500, unidade: "serviço", ativo: true },
  { id: "sv-2", nome: "Criação de sistema web", descricao: "Sistema sob demanda", valor_padrao: 8000, unidade: "pacote", ativo: true },
  { id: "sv-3", nome: "Criação de aplicativo", descricao: "App mobile", valor_padrao: 12000, unidade: "pacote", ativo: true },
  { id: "sv-4", nome: "Automação", descricao: "Automação de processos", valor_padrao: 150, unidade: "hora", ativo: true },
  { id: "sv-5", nome: "Integração com API", descricao: "Integração com APIs externas", valor_padrao: 150, unidade: "hora", ativo: true },
  { id: "sv-6", nome: "Criação de plugin", descricao: "Plugin WordPress/Chrome", valor_padrao: 2000, unidade: "serviço", ativo: true },
  { id: "sv-7", nome: "Correção de bug", descricao: "Correção pontual", valor_padrao: 120, unidade: "hora", ativo: true },
  { id: "sv-8", nome: "Consultoria", descricao: "Consultoria técnica", valor_padrao: 200, unidade: "hora", ativo: true },
  { id: "sv-9", nome: "Manutenção mensal", descricao: "Manutenção e suporte", valor_padrao: 800, unidade: "mensalidade", ativo: true },
  { id: "sv-10", nome: "Desenvolvimento Bubble", descricao: "App em Bubble.io", valor_padrao: 180, unidade: "hora", ativo: true },
  { id: "sv-11", nome: "Desenvolvimento no-code/low-code", descricao: "Soluções no-code", valor_padrao: 150, unidade: "hora", ativo: true },
  { id: "sv-12", nome: "Desenvolvimento HTML/CSS/JS", descricao: "Frontend custom", valor_padrao: 120, unidade: "hora", ativo: true },
];

const hoje = new Date();
const iso = (offsetDays = 0) => {
  const d = new Date(hoje);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
};

export const seedOrcamentos: Orcamento[] = [
  {
    id: "orc-1",
    numero: "ORC-20260101-00001",
    cliente_id: "cli-1",
    nome_projeto: "Site institucional Upcao",
    descricao: "Site responsivo com 5 páginas e blog.",
    status: "orcamento",
    itens: [
      { id: "it-1", servico_id: "sv-1", nome: "Criação de site", descricao: "Site institucional 5 páginas", unidade: "serviço", quantidade: 1, valor_unitario: 3500 },
      { id: "it-2", servico_id: "sv-9", nome: "Manutenção mensal", descricao: "Suporte mensal por 3 meses", unidade: "mensalidade", quantidade: 3, valor_unitario: 800 },
    ],
    desconto: 200,
    acrescimo: 0,
    forma_pagamento: "Pix — 50% entrada e 50% entrega",
    prazo_entrega: iso(30),
    validade: iso(15),
    observacoes: "Inclui hospedagem no primeiro ano.",
    condicoes: seedEmpresa.condicoes_padrao,
    data_criacao: iso(-2),
    historico: [],
  },
  {
    id: "orc-2",
    numero: "ORC-20260102-00002",
    cliente_id: "cli-2",
    nome_projeto: "Sistema de pedidos Padaria",
    status: "em_producao",
    itens: [
      { id: "it-3", servico_id: "sv-2", nome: "Criação de sistema web", descricao: "Sistema de pedidos online", unidade: "pacote", quantidade: 1, valor_unitario: 8000 },
    ],
    desconto: 0,
    acrescimo: 0,
    forma_pagamento: "Pix",
    prazo_entrega: iso(45),
    validade: iso(15),
    condicoes: seedEmpresa.condicoes_padrao,
    data_criacao: iso(-10),
    data_aprovacao: iso(-5),
    historico: [{ data: iso(-5), de: "orcamento", para: "em_producao" }],
  },
];

export const seedFinanceiro: Financeiro[] = [
  {
    id: "fin-1",
    tipo: "receber",
    descricao: "Entrada — Sistema Padaria",
    cliente_id: "cli-2",
    orcamento_id: "orc-2",
    valor: 4000,
    vencimento: iso(-5),
    pagamento: iso(-5),
    status: "pago",
    forma_pagamento: "Pix",
  },
  {
    id: "fin-2",
    tipo: "receber",
    descricao: "Final — Sistema Padaria",
    cliente_id: "cli-2",
    orcamento_id: "orc-2",
    valor: 4000,
    vencimento: iso(45),
    status: "pendente",
    forma_pagamento: "Pix",
  },
  {
    id: "fin-3",
    tipo: "pagar",
    descricao: "Hospedagem servidor",
    valor: 120,
    vencimento: iso(10),
    status: "pendente",
  },
];
