# Vortile Delivery — Architecture & Engineering Specification

## 1. Overview
Vortile Delivery is a high-performance food delivery platform designed for the Brazilian market (Cardápio Web style: marmitarias, burger joints, pizzerias). It replaces traditional rule-based WhatsApp chatbots ("type 1 for menu...") with **Google Gemini MCP (Model Context Protocol / Function Calling)**.

Every incoming WhatsApp message is analyzed by an AI agent that executes real-time operations on the local database (e.g. pausing menu options when ingredients run out in the kitchen, checking orders on the grill, updating delivery status).

---

## 2. Monorepo Structure

```
vortile-monorepo/
├── apps/
│   └── admin/                            # Next.js 16 Fullstack App
│       ├── src/
│       │   ├── app/
│       │   │   ├── (dashboard)/          # Merchant Kitchen Dashboard
│       │   │   │   ├── page.tsx          # Live Kanban Orders Board
│       │   │   │   ├── cardapio/         # Menu & Inventory Availability Toggle
│       │   │   │   ├── assistente-ia/    # WhatsApp Gemini MCP Simulator & Tool Inspector
│       │   │   │   └── configuracoes/    # Store profile, PIX keys, iFood architecture
│       │   │   ├── delivery/             # Customer-Facing Delivery PWA (Cardápio Web style)
│       │   │   │   └── page.tsx          # Mobile-first menu, customizations, cart & checkout
│       │   │   └── api/
│       │   │       ├── menu/route.ts     # Menu categories, items, and option groups
│       │   │       ├── orders/route.ts   # Orders CRUD, real-time polling, and status transitions
│       │   │       ├── ai/chat/route.ts  # Gemini MCP endpoint with tool execution
│       │   │       └── whatsapp/webhook/ # WhatsApp Business / Evolution webhook handler
│       │   ├── lib/
│       │   │   └── ai/
│       │   │       ├── tools.ts          # Gemini function declarations & execution logic
│       │   │       ├── gemini.ts         # Google Gen AI runner with local dev fallback
│       │   │       └── prompts.ts        # Kitchen staff vs customer system instructions
│       │   └── components/               # Custom UI primitives and layout components
├── packages/
│   └── database/                         # SQLite + Drizzle ORM
│       ├── src/schema.ts                 # Drizzle SQLite schema
│       ├── src/index.ts                  # Database client with WAL mode enabled
│       ├── src/migrate.ts                # DDL migration runner
│       └── src/seed.ts                   # Realistic Brazilian delivery restaurant seed
├── docs/                                 # Documentation & engineering records
└── vortile-delivery.db                   # High-performance local SQLite database file
```

---

## 3. Core Database Schema (SQLite + Drizzle)

- **`restaurants`**: Store profile, slug, phone, WhatsApp number, opening hours, delivery fees, minimum order, PIX key, AI status.
- **`categories`**: Menu categories with ordering (`sort_order`).
- **`products`**: Dishes, beverages, desserts with prices, promotional prices, images, and `is_available` flag.
- **`option_groups`**: Customization steps (e.g., "Escolha sua Carne", "Guarnições (Até 3)", "Salada do Dia").
- **`options`**: Choices within option groups (e.g., "Bife de Alcatra", "Purê de Batatas", "Feijão Carioca"). Can be paused individually by the kitchen staff via WhatsApp MCP!
- **`orders`**: Customer delivery and pickup orders with status transitions (`pending` -> `preparing` -> `ready` -> `out_for_delivery` -> `delivered`).
- **`order_items`**: Line items with customizations and special instructions.
- **`restaurant_staff`**: Phone numbers authorized to run kitchen operations via WhatsApp.
- **`whatsapp_messages`**: Audit trail of incoming messages, AI replies, and tool calls executed.

---

## 4. Google Gemini MCP Engine & WhatsApp Routing

### Dual Persona Routing
1. **Kitchen / Montador de Marmitas**:
   - Authorized phone numbers (or kitchen role in simulator).
   - Natural language commands:
     - *"Acabou o purê de batata"* ➔ `toggle_option_availability("Purê de Batatas", false)`
     - *"Voltou o purê"* ➔ `toggle_option_availability("Purê de Batatas", true)`
     - *"Pausa a Coca 2L"* ➔ `toggle_product_availability("Coca-Cola 2 Litros", false)`
     - *"Quais pedidos temos na chapa?"* ➔ `list_active_orders("all")`
     - *"Marmita #102 tá pronta"* ➔ `update_order_status("102", "ready")`
2. **Customer**:
   - Welcome greetings, daily specials, ingredients, marmitex sizing, checkout assistance, and PIX payment key.

### Gemini SDK Integration
- Uses official `@google/genai` with `gemini-2.5-flash` function calling.
- Features an embedded local MCP heuristics engine for zero-friction local development without requiring external credentials.

---

## 5. Anti-AI-Slop Design System

- **Warm Food Palette**: Terracotta & Amber (`#EA580C`, `#E11D48`), Warm Off-white (`#FAF9F5`), and Deep Warm Charcoal (`#121110`).
- **Real Brazilian Foodtech Context**: Real dish options (Bife Acebolado, Feijoada, Purê artesanal, Marmitex Executivo), PIX Copia-e-Cola with instant copy button, Card machine at door, and Cash with change calculation.
- **Mobile-first Tactile UI**: Smooth bottom sheets for Marmita customization and cart slide-over, live badges with pulsing indicators.

---

## 6. Autonomous 3-Minute Auditor Bot
Configured in Hermes via `cronjob_manage` (Job ID: `e087a9c26ea8`, Schedule: `every 3m`).
Every 3 minutes, the bot inspects the repository, validates build status, checks pending backlog items, audits code quality, and logs next steps.
