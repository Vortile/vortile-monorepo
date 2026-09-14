# Vortile Delivery — Arquitetura do Monorepo

> **Visão de Engenharia & Desacoplamento de Aplicações**  
> **Data:** Setembro / 2026

---

## 1. Visão Geral das Aplicações (`apps/`)

O monorepo foi reestruturado de forma desacoplada para garantir que o cliente final navegando no celular em 4G/3G não carregue dependências de backoffice administrativo, e que a inteligência artificial (MCP) opere como um serviço autônomo.

```
vortile-monorepo/
├── apps/
│   ├── admin/               # Painel Administrativo & Operacional (Porta 3001)
│   ├── delivery/            # Cardápio Web do Cliente PWA (Porta 3002)
│   └── mcp-server/          # Servidor Autônomo MCP (Porta 3003)
│
├── packages/
│   ├── database/            # SQLite Local (better-sqlite3 + Drizzle ORM)
│   └── mcp/                 # Motor MCP: Schemas, Tools e Loop Gemini 2.5 Flash
│
└── docs/                    # Especificações e Estudos Econômicos
```

---

## 2. Detalhamento por Aplicação

### 🍔 `apps/delivery` — Cardápio Web do Cliente (PWA)
- **Porta padrão:** `3002` (`http://localhost:3002`)
- **Foco:** Experiência de compra do consumidor final.
- **Diferenciais:**
  - Bundle ultraleve sem dependências de dashboard ou gráficos.
  - PWA instalável no celular do cliente com manifest.json e tema responsivo.
  - Suporte a multi-tenancy dinâmico por slug (`/[slug]`, ex: `/vorti-marmitex`).
  - Linha do tempo ao vivo do pedido (`/pedido/[id]`) com atualização automática:
    `[Recebido] ➔ [Em Preparo] ➔ [Saiu p/ Entrega] ➔ [Entregue]`.
  - Checkout com cálculo de taxa de entrega, opção de troco em dinheiro e chave PIX com cópia em 1 clique.

### 📊 `apps/admin` — Backoffice & Gestão Operacional
- **Porta padrão:** `3001` (`http://localhost:3001`)
- **Foco:** Dono do restaurante, atendentes e montadores de marmita.
- **Diferenciais:**
  - **Esteira de Pedidos em Tempo Real:** Colunas categorizadas com alertas sonoros e impressão de cupom térmico de 80mm/58mm.
  - **WhatsApp Hub Oficial:** Conversas de clientes e cozinha integradas com o modelo Gemini 2.5 Flash e sintetizador de voz (TTS).
  - **Abertura e Fechamento de Caixa:** Controle estrito de fundo de troco, sangrias e suprimentos com conferência contábil de sobra/falta.
  - **Gestor de Cardápio:** CRUD visual de categorias, pratos, opções e preços.
  - **Gestão de Usuários:** Perfis segregados (`admin` e `operador`).

### 🤖 `apps/mcp-server` — Servidor Autônomo Model Context Protocol
- **Porta padrão:** `3003` (`http://localhost:3003`)
- **Foco:** Exposição de ferramentas e inteligência contextual para agentes de IA.
- **Protocolos suportados:**
  - **JSON-RPC 2.0 (Padrão Oficial MCP):** Compatível com Claude Desktop, Cursor e clientes MCP via `POST /mcp/rpc` (`tools/list`, `tools/call`).
  - **REST API Direta:** `POST /mcp/execute` para chamadas pragmáticas de ferramentas.
  - **Motor Conversacional de Delivery:** `POST /mcp/chat` processando mensagens naturais de WhatsApp com saída falável via Gemini 2.5 Flash.
- **7 Ferramentas MCP Registradas:**
  1. `get_delivery_status_overview`: Resumo de pedidos e faturamento diário.
  2. `list_open_orders`: Relação de comandas ativas na esteira.
  3. `toggle_option_availability`: Pausa e reativação cirúrgica de guarnições e acompanhamentos.
  4. `toggle_product_availability`: Pausa e retorno de pratos principais e bebidas.
  5. `update_order_status`: Avanço de status com notas de despacho para motoboy.
  6. `send_customer_message`: Disparo de avisos contextuais para o WhatsApp do cliente.
  7. `get_menu_summary`: Visão geral do cardápio e itens pausados.

---

## 3. Pacotes Compartilhados (`packages/`)

### 🗄️ `@vortile/database`
- Banco SQLite local em modo WAL (`vortile-delivery.db`) com integridade referencial (`PRAGMA foreign_keys = ON`).
- Esquema unificado Drizzle com 12 entidades: restaurantes, categorias, produtos, grupos de opções, opções, pedidos, itens de pedidos, equipe, turnos de caixa, transações de caixa, usuários e mensagens de WhatsApp.

### 🧠 `@vortile/mcp`
- Núcleo desacoplado de inteligência artificial.
- Schemas tipados de ferramentas JSON Schema para a Google.
- Algoritmo resiliente de matching textual em português (`findBestMatch`) com filtro de stop words brasileiras.
- Loop de chamada de funções de duas vias: Gemini gera `functionCall` ➔ MCP executa no SQLite ➔ Gemini formata resposta falável em linguagem natural.

---

## 4. Comandos do Workspace

| Comando | Ação |
| :--- | :--- |
| `pnpm build` | Compila os 5 pacotes e apps via Turbo |
| `pnpm test` | Executa a suíte de testes ponta a ponta (12 testes) |
| `pnpm lint` | Valida regras de código (0 erros, 0 warnings) |
| `pnpm dev` | Inicia todos os apps em modo desenvolvimento |
| `pnpm start:admin` | Sobe o Admin na porta 3001 |
| `pnpm start:delivery` | Sobe o Cardápio Web do Cliente na porta 3002 |
| `pnpm start:mcp` | Sobe o Servidor MCP na porta 3003 |
