import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

// 1. Restaurant / Merchant Profile
export const restaurants = sqliteTable("restaurants", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  phone: text("phone").notNull(),
  whatsappNumber: text("whatsapp_number").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull().default("São Paulo"),
  state: text("state").notNull().default("SP"),
  isOpen: integer("is_open", { mode: "boolean" }).notNull().default(true),
  openingHours: text("opening_hours")
    .notNull()
    .default("Seg a Sáb: 10:30 às 15:00 • 18:00 às 22:30"),
  deliveryFee: real("delivery_fee").notNull().default(6.5),
  minOrderAmount: real("min_order_amount").notNull().default(20.0),
  avgDeliveryTime: text("avg_delivery_time").notNull().default("35 - 50 min"),
  bannerUrl: text("banner_url"),
  logoUrl: text("logo_url"),
  pixKey: text("pix_key").notNull().default("financeiro@vorti.com.br"),
  pixKeyType: text("pix_key_type").notNull().default("email"), // email, cnpj, cpf, phone, random
  primaryColor: text("primary_color").notNull().default("#0066FF"), // Vortile Signature Blue by default
  aiEnabled: integer("ai_enabled", { mode: "boolean" }).notNull().default(true),
  aiSystemPrompt: text("ai_system_prompt"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// 2. Categories
export const categories = sqliteTable("categories", {
  id: text("id").primaryKey(),
  restaurantId: text("restaurant_id")
    .notNull()
    .references(() => restaurants.id),
  name: text("name").notNull(),
  description: text("description"),
  sortOrder: integer("sort_order").notNull().default(0),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// 3. Products
export const products = sqliteTable("products", {
  id: text("id").primaryKey(),
  restaurantId: text("restaurant_id")
    .notNull()
    .references(() => restaurants.id),
  categoryId: text("category_id")
    .notNull()
    .references(() => categories.id),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  promotionalPrice: real("promotional_price"),
  imageUrl: text("image_url"),
  isAvailable: integer("is_available", { mode: "boolean" })
    .notNull()
    .default(true),
  pauseReason: text("pause_reason"),
  sortOrder: integer("sort_order").notNull().default(0),
  hasCustomizations: integer("has_customizations", { mode: "boolean" })
    .notNull()
    .default(false),
  badge: text("badge"), // e.g. "Mais Pedido", "Especial de Hoje", "Promoção"
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// 4. Option Groups (e.g. "Tamanho", "Escolha a Carne", "Guarnições (Até 3)")
export const optionGroups = sqliteTable("option_groups", {
  id: text("id").primaryKey(),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  name: text("name").notNull(),
  description: text("description"),
  minSelected: integer("min_selected").notNull().default(0),
  maxSelected: integer("max_selected").notNull().default(1),
  isRequired: integer("is_required", { mode: "boolean" })
    .notNull()
    .default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

// 5. Options (e.g. "Bife Acebolado", "Purê de Batatas", "Arroz Branco")
export const options = sqliteTable("options", {
  id: text("id").primaryKey(),
  groupId: text("group_id")
    .notNull()
    .references(() => optionGroups.id),
  name: text("name").notNull(),
  description: text("description"),
  priceDelta: real("price_delta").notNull().default(0.0),
  isAvailable: integer("is_available", { mode: "boolean" })
    .notNull()
    .default(true),
  pauseReason: text("pause_reason"),
  sortOrder: integer("sort_order").notNull().default(0),
});

// 6. Orders
export const orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  orderNumber: integer("order_number").notNull(),
  restaurantId: text("restaurant_id")
    .notNull()
    .references(() => restaurants.id),
  customerName: text("customer_name").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerAddress: text("customer_address"),
  deliveryType: text("delivery_type").notNull().default("delivery"), // delivery, pickup
  paymentMethod: text("payment_method").notNull().default("pix"), // pix, card_delivery, cash
  paymentStatus: text("payment_status").notNull().default("pending"), // pending, paid
  cashChangeFor: real("cash_change_for"),
  subtotal: real("subtotal").notNull(),
  deliveryFee: real("delivery_fee").notNull().default(0.0),
  discount: real("discount").notNull().default(0.0),
  total: real("total").notNull(),
  status: text("status").notNull().default("pending"), // pending, preparing, ready, out_for_delivery, delivered, cancelled
  notes: text("notes"),
  origin: text("origin").notNull().default("pwa"), // pwa, whatsapp_ai, manual
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// 7. Order Items
export const orderItems = sqliteTable("order_items", {
  id: text("id").primaryKey(),
  orderId: text("order_id")
    .notNull()
    .references(() => orders.id),
  productId: text("product_id")
    .notNull()
    .references(() => products.id),
  productName: text("product_name").notNull(),
  unitPrice: real("unit_price").notNull(),
  quantity: integer("quantity").notNull().default(1),
  totalPrice: real("total_price").notNull(),
  customizationsJson: text("customizations_json"), // Array of selected option names/price
  notes: text("notes"),
});

// 8. Users & Access Control (Roles: 'admin' | 'operador')
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  restaurantId: text("restaurant_id")
    .notNull()
    .references(() => restaurants.id),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  role: text("role").notNull().default("operador"), // admin, operador
  pin: text("pin").notNull().default("1234"), // 4-digit quick pin for POS
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  avatarUrl: text("avatar_url"),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// 9. Kitchen & Restaurant Staff (Authorized numbers for MCP commands via WhatsApp)
export const restaurantStaff = sqliteTable("restaurant_staff", {
  id: text("id").primaryKey(),
  restaurantId: text("restaurant_id")
    .notNull()
    .references(() => restaurants.id),
  name: text("name").notNull(),
  phone: text("phone").notNull(), // e.g. 5511999998888
  role: text("role").notNull().default("kitchen"), // owner, attendant, kitchen, delivery
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// 10. WhatsApp Messages / Conversation History
export const whatsappMessages = sqliteTable("whatsapp_messages", {
  id: text("id").primaryKey(),
  restaurantId: text("restaurant_id")
    .notNull()
    .references(() => restaurants.id),
  phone: text("phone").notNull(),
  senderType: text("sender_type").notNull(), // customer, staff, assistant, system
  content: text("content").notNull(),
  toolCallsJson: text("tool_calls_json"), // Log of MCP tools invoked
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// 11. Cash Registers / Turnos de Caixa (Abertura e Fechamento)
export const cashRegisters = sqliteTable("cash_registers", {
  id: text("id").primaryKey(),
  restaurantId: text("restaurant_id")
    .notNull()
    .references(() => restaurants.id),
  openedBy: text("opened_by").notNull(),
  closedBy: text("closed_by"),
  openedAt: text("opened_at").notNull().$defaultFn(() => new Date().toISOString()),
  closedAt: text("closed_at"),
  initialAmount: real("initial_amount").notNull().default(0.0), // Fundo de caixa / troco
  totalSales: real("total_sales").notNull().default(0.0),
  totalPix: real("total_pix").notNull().default(0.0),
  totalCard: real("total_card").notNull().default(0.0),
  totalCash: real("total_cash").notNull().default(0.0),
  totalInflow: real("total_inflow").notNull().default(0.0), // Suprimentos
  totalOutflow: real("total_outflow").notNull().default(0.0), // Sangrias
  expectedCash: real("expected_cash"), // initialAmount + totalCash + totalInflow - totalOutflow
  actualCash: real("actual_cash"), // contagem informada no fechamento
  difference: real("difference"), // actualCash - expectedCash (sobra ou falta)
  status: text("status").notNull().default("open"), // open, closed
  notes: text("notes"),
});

// 12. Cash Transactions / Sangrias e Suprimentos
export const cashTransactions = sqliteTable("cash_transactions", {
  id: text("id").primaryKey(),
  cashRegisterId: text("cash_register_id")
    .notNull()
    .references(() => cashRegisters.id),
  type: text("type").notNull(), // 'inflow' (suprimento) ou 'outflow' (sangria)
  amount: real("amount").notNull(),
  reason: text("reason").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// 13. Sessions (Open Source Auth Session Storage)
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
});

// Relations
export const restaurantsRelations = relations(restaurants, ({ many }) => ({
  categories: many(categories),
  products: many(products),
  orders: many(orders),
  staff: many(restaurantStaff),
  users: many(users),
  cashRegisters: many(cashRegisters),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [categories.restaurantId],
    references: [restaurants.id],
  }),
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [products.restaurantId],
    references: [restaurants.id],
  }),
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  optionGroups: many(optionGroups),
}));

export const optionGroupsRelations = relations(optionGroups, ({ one, many }) => ({
  product: one(products, {
    fields: [optionGroups.productId],
    references: [products.id],
  }),
  options: many(options),
}));

export const optionsRelations = relations(options, ({ one }) => ({
  group: one(optionGroups, {
    fields: [options.groupId],
    references: [optionGroups.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [orders.restaurantId],
    references: [restaurants.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const cashRegistersRelations = relations(cashRegisters, ({ one, many }) => ({
  restaurant: one(restaurants, {
    fields: [cashRegisters.restaurantId],
    references: [restaurants.id],
  }),
  transactions: many(cashTransactions),
}));

export const cashTransactionsRelations = relations(cashTransactions, ({ one }) => ({
  cashRegister: one(cashRegisters, {
    fields: [cashTransactions.cashRegisterId],
    references: [cashRegisters.id],
  }),
}));
