# Vortile Delivery — Cardápio Web & WhatsApp Gemini MCP

> Plataforma de delivery brasileira com cardápio digital (PWA), gestão de cozinha em tempo real (Kanban), banco de dados local SQLite e integração WhatsApp via **Google Gemini com Model Context Protocol (MCP)**.

---

## 🌟 Diferenciais do Projeto

1. **Cardápio Web Brasileiro (Mobile First)**:
   - Interface rápida, acolhedora e sem cara de "AI slop" genérico.
   - Padrão brasileiro de marmitaria: montagem por etapas (Tamanho ➔ Carne ➔ Guarnições ➔ Salada ➔ Observações).
   - Checkout completo com PIX Copia-e-Cola, Cartão na Entrega e Dinheiro com troco.
2. **WhatsApp Gemini MCP (Adeus bots burros)**:
   - Cada mensagem é processada pelo Google Gemini com Function Calling conectado diretamente ao banco SQLite.
   - O montador de marmitas ou cozinheiro manda no WhatsApp: *"acabou o purê de batata"* e a IA pausa a opção do cardápio online em milissegundos.
   - Comandos de cozinha: *"quais pedidos estão na chapa?"*, *"marmita 102 tá pronta"*, *"pausa a coca 2L"*.
3. **Dashboard da Cozinha (Kanban ao Vivo)**:
   - Painel para restaurante com colunas: Novos Pedidos, Em Preparo, Pronto para Entrega e Entregues.
   - Alerta sonoro e atualização automática sem necessidade de recarregar a página.
4. **SQLite Local + Drizzle ORM**:
   - Zero dependência de serviços em nuvem ou bancos externos para rodar localmente.
   - Alta velocidade com modo WAL ativado (`vortile-delivery.db`).
5. **Bot Autônomo de Auditoria (3 minutos)**:
   - Job agendado no Hermes para iterar, verificar qualidade de código e apontar melhorias continuamente.

---

## 🚀 Como Rodar Localmente

### 1. Instalar dependências
```bash
pnpm install
```

### 2. Criar e popular o banco SQLite
```bash
pnpm tsx packages/database/src/seed.ts
```

### 3. Iniciar o servidor
```bash
pnpm --filter admin dev
```
Acesse:
- **Cardápio do Cliente (PWA)**: [http://localhost:3001/delivery](http://localhost:3001/delivery)
- **Painel da Cozinha (Kanban)**: [http://localhost:3001/](http://localhost:3001/)
- **Simulador WhatsApp Gemini MCP**: [http://localhost:3001/assistente-ia](http://localhost:3001/assistente-ia)
- **Gestão de Cardápio & Estoque**: [http://localhost:3001/cardapio](http://localhost:3001/cardapio)
- **Configurações & iFood Preview**: [http://localhost:3001/configuracoes](http://localhost:3001/configuracoes)

---

## 🤖 Configuração do Google Gemini (Opcional)

Por padrão, o projeto possui um **motor local inteligente de MCP** que executa todas as ferramentas diretamente no banco SQLite para desenvolvimento offline.
Para conectar a API oficial do Google Gemini em produção:

1. Obtenha sua chave no [Google AI Studio](https://aistudio.google.com/).
2. Adicione no arquivo `apps/admin/.env.local`:
```env
GEMINI_API_KEY=sua_chave_aqui
```
O sistema usará automaticamente o modelo `gemini-2.5-flash` com Function Calling!

---

## 📂 Estrutura de Pastas

```
vortile-monorepo/
├── apps/
│   └── admin/                  # Next.js 16 Fullstack App (PWA + Dashboard + API)
├── packages/
│   └── database/               # SQLite + Drizzle ORM (schema, seed, migrate)
├── docs/
│   └── ARCHITECTURE.md         # Especificação técnica detalhada
└── vortile-delivery.db         # Banco de dados SQLite local
```
