import { sqlite } from "./index";

export const runMigrations = () => {
  console.log("Running SQLite database schema setup...");

  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS restaurants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT,
      phone TEXT NOT NULL,
      whatsapp_number TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL DEFAULT 'São Paulo',
      state TEXT NOT NULL DEFAULT 'SP',
      is_open INTEGER NOT NULL DEFAULT 1,
      opening_hours TEXT NOT NULL DEFAULT 'Seg a Sáb: 10:30 às 15:00 • 18:00 às 22:30',
      delivery_fee REAL NOT NULL DEFAULT 6.50,
      min_order_amount REAL NOT NULL DEFAULT 20.00,
      avg_delivery_time TEXT NOT NULL DEFAULT '35 - 50 min',
      banner_url TEXT,
      logo_url TEXT,
      pix_key TEXT NOT NULL DEFAULT 'financeiro@vorti.com.br',
      pix_key_type TEXT NOT NULL DEFAULT 'email',
      ai_enabled INTEGER NOT NULL DEFAULT 1,
      ai_system_prompt TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      restaurant_id TEXT NOT NULL REFERENCES restaurants(id),
      name TEXT NOT NULL,
      description TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      restaurant_id TEXT NOT NULL REFERENCES restaurants(id),
      category_id TEXT NOT NULL REFERENCES categories(id),
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      promotional_price REAL,
      image_url TEXT,
      is_available INTEGER NOT NULL DEFAULT 1,
      pause_reason TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      has_customizations INTEGER NOT NULL DEFAULT 0,
      badge TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS option_groups (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id),
      name TEXT NOT NULL,
      description TEXT,
      min_selected INTEGER NOT NULL DEFAULT 0,
      max_selected INTEGER NOT NULL DEFAULT 1,
      is_required INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS options (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL REFERENCES option_groups(id),
      name TEXT NOT NULL,
      description TEXT,
      price_delta REAL NOT NULL DEFAULT 0.00,
      is_available INTEGER NOT NULL DEFAULT 1,
      pause_reason TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number INTEGER NOT NULL,
      restaurant_id TEXT NOT NULL REFERENCES restaurants(id),
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      customer_address TEXT,
      delivery_type TEXT NOT NULL DEFAULT 'delivery',
      payment_method TEXT NOT NULL DEFAULT 'pix',
      payment_status TEXT NOT NULL DEFAULT 'pending',
      cash_change_for REAL,
      subtotal REAL NOT NULL,
      delivery_fee REAL NOT NULL DEFAULT 0.00,
      discount REAL NOT NULL DEFAULT 0.00,
      total REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      notes TEXT,
      origin TEXT NOT NULL DEFAULT 'pwa',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id),
      product_id TEXT NOT NULL REFERENCES products(id),
      product_name TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      total_price REAL NOT NULL,
      customizations_json TEXT,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS restaurant_staff (
      id TEXT PRIMARY KEY,
      restaurant_id TEXT NOT NULL REFERENCES restaurants(id),
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'kitchen',
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS whatsapp_messages (
      id TEXT PRIMARY KEY,
      restaurant_id TEXT NOT NULL REFERENCES restaurants(id),
      phone TEXT NOT NULL,
      sender_type TEXT NOT NULL,
      content TEXT NOT NULL,
      tool_calls_json TEXT,
      created_at TEXT NOT NULL
    );
  `);

  console.log("SQLite tables created successfully.");
}

if (require.main === module) {
  runMigrations();
}
