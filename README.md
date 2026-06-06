# Up Serviços

Sistema para gerenciar orçamentos, pedidos, clientes, serviços e financeiro — com Kanban e PDF.

## Início rápido

```bash
cp .env.example .env   # obrigatório: preencha VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY
npm install
npm run dev
```

Sem o `.env`, o servidor retorna erro 500 ao iniciar (variáveis `VITE_*` ausentes).

Documentação completa em **[docs/README.md](docs/README.md)**.

Deploy (GitHub → EasyPanel, **Dockerfile** na raiz): **[docs/deploy.md](docs/deploy.md)**.
