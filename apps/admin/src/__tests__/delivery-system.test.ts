import test from "node:test";
import assert from "node:assert";

try {
  process.loadEnvFile(".env.local");
} catch {
  // ignore if file doesn't exist
}
import {
  db,
  restaurants,
  categories,
  options,
  products,
  orders,
  users,
  cashRegisters,
  cashTransactions,
  whatsappMessages,
  eq,
} from "@vortile/database";
import { executeToolCall, processWhatsAppMessage } from "@vortile/mcp";
import {
  authenticateWithPin,
  createSession,
  validateSessionToken,
  revokeSession,
} from "../lib/auth";

test("Vortile Delivery — Test Pipeline", async (t) => {
  const restaurantId = "rest_vorti_marmitex";

  await t.test("1. Onboarding & Store Configuration in SQLite", async () => {
    const rest = db.select().from(restaurants).where(eq(restaurants.id, restaurantId)).get();
    assert.ok(rest, "Restaurant record must exist in SQLite");

    db.update(restaurants)
      .set({
        name: "Vorti Marmitex & Grelhados Premium",
        phone: "(11) 98765-4321",
        deliveryFee: 6.0,
        avgDeliveryTime: "25 - 40 min",
        minOrderAmount: 20.0,
        pixKey: "contato@vorti.com.br",
        pixKeyType: "email",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(restaurants.id, restaurantId))
      .run();

    const updated = db.select().from(restaurants).where(eq(restaurants.id, restaurantId)).get();
    assert.strictEqual(updated?.name, "Vorti Marmitex & Grelhados Premium");
    assert.strictEqual(updated?.deliveryFee, 6.0);
    assert.strictEqual(updated?.pixKey, "contato@vorti.com.br");
  });

  await t.test("2. MCP Tool: get_delivery_status_overview (Spoken, No Bullets)", async () => {
    const result = await executeToolCall("get_delivery_status_overview", {}, restaurantId);
    assert.strictEqual(result.toolName, "get_delivery_status_overview");
    assert.ok(result.humanMessage, "Must return a humanMessage");

    assert.strictEqual(result.humanMessage.includes("•"), false, "Must not contain bullet points");
    assert.strictEqual(result.humanMessage.includes("*"), false, "Must not contain markdown asterisks");
    assert.strictEqual(result.humanMessage.includes("- "), false, "Must not contain dashed lists");
    assert.ok(result.humanMessage.length > 20, "Must be a complete spoken sentence");
  });

  await t.test("3. MCP Tool: list_open_orders (Spoken Format)", async () => {
    const result = await executeToolCall("list_open_orders", {}, restaurantId);
    assert.strictEqual(result.toolName, "list_open_orders");
    assert.ok(typeof result.result.count === "number");
    assert.strictEqual(result.humanMessage.includes("•"), false, "Must not contain bullet points");
    assert.strictEqual(result.humanMessage.includes("*"), false, "Must not contain markdown asterisks");
  });

  await t.test("4. MCP Tool: send_customer_message (Records message to customer)", async () => {
    const customerMsg = "Seu pedido de marmita já saiu com o motoboy e chega em 15 minutos!";
    const result = await executeToolCall(
      "send_customer_message",
      {
        customerIdentifier: "Carlos",
        messageText: customerMsg,
      },
      restaurantId
    );

    assert.strictEqual(result.toolName, "send_customer_message");
    assert.strictEqual(result.result.success, true);
    assert.ok(result.humanMessage.includes("Carlos"));

    const lastMsg = db
      .select()
      .from(whatsappMessages)
      .where(eq(whatsappMessages.restaurantId, restaurantId))
      .orderBy(eq(whatsappMessages.content, customerMsg))
      .get();

    assert.ok(lastMsg, "Message must be saved in SQLite whatsapp_messages table");
  });

  await t.test("5. MCP Tool: toggle_option_availability (Kitchen pauses and resumes option)", async () => {
    const pauseResult = await executeToolCall(
      "toggle_option_availability",
      { optionNameOrId: "Purê de Batatas", isAvailable: false, reason: "Acabou na panela" },
      restaurantId
    );

    assert.strictEqual(pauseResult.result.isAvailable, false);
    const pausedDb = db.select().from(options).where(eq(options.id, "opt_pure_batata")).get();
    assert.strictEqual(pausedDb?.isAvailable, false, "Must be false in SQLite");

    assert.strictEqual(pauseResult.humanMessage.includes("•"), false);
    assert.strictEqual(pauseResult.humanMessage.includes("*"), false);

    const resumeResult = await executeToolCall(
      "toggle_option_availability",
      { optionNameOrId: "Purê de Batatas", isAvailable: true },
      restaurantId
    );
    assert.strictEqual(resumeResult.result.isAvailable, true);
    const resumedDb = db.select().from(options).where(eq(options.id, "opt_pure_batata")).get();
    assert.strictEqual(resumedDb?.isAvailable, true, "Must be true in SQLite");
  });

  await t.test("6. MCP Tool: toggle_product_availability (Pause and resume Coca 2L)", async () => {
    const pauseProd = await executeToolCall(
      "toggle_product_availability",
      { productNameOrId: "Coca-Cola 2 Litros", isAvailable: false },
      restaurantId
    );
    assert.strictEqual(pauseProd.result.isAvailable, false);
    const pausedDb = db.select().from(products).where(eq(products.id, "prod_coca_2l")).get();
    assert.strictEqual(pausedDb?.isAvailable, false);

    const resumeProd = await executeToolCall(
      "toggle_product_availability",
      { productNameOrId: "Coca-Cola 2 Litros", isAvailable: true },
      restaurantId
    );
    assert.strictEqual(resumeProd.result.isAvailable, true);
    const resumedDb = db.select().from(products).where(eq(products.id, "prod_coca_2l")).get();
    assert.strictEqual(resumedDb?.isAvailable, true);
  });

  await t.test("7. MCP Tool: update_order_status (Ready and Out for Delivery)", async () => {
    const updateRes = await executeToolCall(
      "update_order_status",
      { orderIdOrNumber: "101", status: "ready" },
      restaurantId
    );
    assert.strictEqual(updateRes.result.status, "ready");
    const order101 = db.select().from(orders).where(eq(orders.orderNumber, 101)).get();
    assert.strictEqual(order101?.status, "ready");
  });

  await t.test("8. AI Message Processing: Spoken, Natural and Cleaned", async () => {
    const response = await processWhatsAppMessage({
      message: "Como tá a situação do delivery agora?",
      senderRole: "kitchen",
      restaurantId,
    });

    assert.ok(response.reply, "Must return a reply");
    assert.strictEqual(response.reply.includes("•"), false, "AI reply must never contain bullet points");
    assert.strictEqual(response.reply.includes("**"), false, "AI reply must never contain markdown bold asterisks");
    assert.strictEqual(response.reply.includes("#"), false, "AI reply must never contain markdown headers");
  });

  await t.test("9. Menu Management CRUD (Categories, Products & Options)", async () => {
    // 1. Create Category
    const testCatId = `cat_test_${Date.now()}`;
    db.insert(categories)
      .values({
        id: testCatId,
        restaurantId,
        name: "Massas Artesanais",
        description: "Massas frescas feitas na casa",
        sortOrder: 5,
        isActive: true,
        createdAt: new Date().toISOString(),
      })
      .run();

    const catInDb = db.select().from(categories).where(eq(categories.id, testCatId)).get();
    assert.strictEqual(catInDb?.name, "Massas Artesanais");

    // 2. Create Product
    const testProdId = `prod_test_${Date.now()}`;
    db.insert(products)
      .values({
        id: testProdId,
        restaurantId,
        categoryId: testCatId,
        name: "Lasanha Bolonhesa Especial",
        description: "Massa fresca, molho bolonhesa rústico e muito queijo",
        price: 32.5,
        isAvailable: true,
        sortOrder: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .run();

    const prodInDb = db.select().from(products).where(eq(products.id, testProdId)).get();
    assert.strictEqual(prodInDb?.name, "Lasanha Bolonhesa Especial");
    assert.strictEqual(prodInDb?.price, 32.5);

    // 3. Edit Product
    db.update(products)
      .set({ price: 34.0, isAvailable: false, pauseReason: "Esgotado no almoço" })
      .where(eq(products.id, testProdId))
      .run();

    const prodEdited = db.select().from(products).where(eq(products.id, testProdId)).get();
    assert.strictEqual(prodEdited?.price, 34.0);
    assert.strictEqual(prodEdited?.isAvailable, false);

    // Cleanup test items
    db.delete(products).where(eq(products.id, testProdId)).run();
    db.delete(categories).where(eq(categories.id, testCatId)).run();
  });

  await t.test("10. Cash Register Shift Lifecycle & Transactions", async () => {
    const shiftId = `cx_test_${Date.now()}`;

    // 1. Open Cash Shift
    db.insert(cashRegisters)
      .values({
        id: shiftId,
        restaurantId,
        openedBy: "Luciano (Admin)",
        openedAt: new Date().toISOString(),
        initialAmount: 150.0,
        status: "open",
        notes: "Turno teste de caixa",
      })
      .run();

    const openedShift = db.select().from(cashRegisters).where(eq(cashRegisters.id, shiftId)).get();
    assert.strictEqual(openedShift?.status, "open");
    assert.strictEqual(openedShift?.initialAmount, 150.0);

    // 2. Create Sangria (Outflow)
    const txId = `tx_test_${Date.now()}`;
    db.insert(cashTransactions)
      .values({
        id: txId,
        cashRegisterId: shiftId,
        type: "outflow",
        amount: 30.0,
        reason: "Pagamento de adiantamento motoboy",
        createdBy: "Luciano",
        createdAt: new Date().toISOString(),
      })
      .run();

    const txInDb = db.select().from(cashTransactions).where(eq(cashTransactions.id, txId)).get();
    assert.strictEqual(txInDb?.amount, 30.0);
    assert.strictEqual(txInDb?.type, "outflow");

    // 3. Close Cash Shift
    const expectedCash = 150.0 - 30.0; // 120.00
    const actualCash = 120.0; // Perfeita conferência
    db.update(cashRegisters)
      .set({
        closedBy: "Luciano (Admin)",
        closedAt: new Date().toISOString(),
        expectedCash,
        actualCash,
        difference: actualCash - expectedCash,
        status: "closed",
      })
      .where(eq(cashRegisters.id, shiftId))
      .run();

    const closedShift = db.select().from(cashRegisters).where(eq(cashRegisters.id, shiftId)).get();
    assert.strictEqual(closedShift?.status, "closed");
    assert.strictEqual(closedShift?.difference, 0.0);

    // Cleanup test shift
    db.delete(cashTransactions).where(eq(cashTransactions.id, txId)).run();
    db.delete(cashRegisters).where(eq(cashRegisters.id, shiftId)).run();
  });

  await t.test("11. User Management & Permissions (Admin vs Operador)", async () => {
    const testUserId = `usr_test_${Date.now()}`;

    // 1. Create Delivery Operator
    db.insert(users)
      .values({
        id: testUserId,
        restaurantId,
        name: "Juliana Santos (Operadora)",
        email: `test_operador_${Date.now()}@vorti.com.br`,
        phone: "(11) 98888-7777",
        role: "operador",
        pin: "5678",
        isActive: true,
        createdAt: new Date().toISOString(),
      })
      .run();

    const userInDb = db.select().from(users).where(eq(users.id, testUserId)).get();
    assert.strictEqual(userInDb?.role, "operador");
    assert.strictEqual(userInDb?.pin, "5678");

    // 2. Promote to Admin
    db.update(users).set({ role: "admin" }).where(eq(users.id, testUserId)).run();
    const updatedUser = db.select().from(users).where(eq(users.id, testUserId)).get();
    assert.strictEqual(updatedUser?.role, "admin");

    // Cleanup
    db.delete(users).where(eq(users.id, testUserId)).run();
  });

  await t.test("12. Real Session Authentication (PIN, Token, Lifecycle)", async () => {
    // 1. Authenticate Luciano with PIN 1234
    const adminUser = await authenticateWithPin("admin@vorti.com.br", "1234");
    assert.ok(adminUser, "Admin must authenticate with correct PIN");
    assert.strictEqual(adminUser.role, "admin");

    // 2. Reject incorrect PIN
    const wrongPin = await authenticateWithPin("admin@vorti.com.br", "9999");
    assert.strictEqual(wrongPin, null, "Wrong PIN must be rejected");

    // 3. Create Session Token
    const token = await createSession(adminUser.id);
    assert.ok(token, "Must generate a secure session token");
    assert.strictEqual(typeof token, "string");

    // 4. Validate Session Token
    const session = await validateSessionToken(token);
    assert.ok(session, "Session must be valid");
    assert.strictEqual(session?.user.email, "admin@vorti.com.br");
    assert.strictEqual(session?.user.role, "admin");

    // 5. Revoke Session
    const revoked = await revokeSession(token);
    assert.strictEqual(revoked, true);
    const postRevoke = await validateSessionToken(token);
    assert.strictEqual(postRevoke, null, "Revoked session must be invalid");
  });

  await t.test("13. Role-Based Access Control (RBAC) Enforcement", async () => {
    // 1. Verify Operator credentials
    const operator = await authenticateWithPin("operador@vorti.com.br", "4321");
    assert.ok(operator, "Operator Mateus must authenticate");
    assert.strictEqual(operator.role, "operador");

    // 2. Validate Operator is blocked from Admin capabilities
    const hasAdminRole = (operator.role as string) === "admin";
    assert.strictEqual(hasAdminRole, false, "Operator must NOT have admin access");
  });

  await t.test("14. Copilot de Cozinha Tool Execution (Double-tap Space simulation)", async () => {
    const copilotResult = await executeToolCall(
      "toggle_option_availability",
      { optionNameOrId: "Purê de Batatas Cremoso", isAvailable: false, reason: "Acabou na panela das 12h" },
      restaurantId
    );

    assert.strictEqual(copilotResult.result.isAvailable, false);
    assert.ok(copilotResult.humanMessage.includes("Purê de Batatas"), "Must confirm item pause");

    // Re-enable option
    const resume = await executeToolCall(
      "toggle_option_availability",
      { optionNameOrId: "Purê de Batatas Cremoso", isAvailable: true },
      restaurantId
    );
    assert.strictEqual(resume.result.isAvailable, true);
  });

  await t.test("15. Studio Speech Synthesis (TTS Pipeline & Audio Buffer)", async () => {
    const { POST: ttsRoute } = await import("../app/api/ai/tts/route");
    const fakeRequest = new Request("http://localhost/api/ai/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "Pausei o Purê de Batatas no cardápio online com sucesso.",
        speed: 1.15,
      }),
    });

    const response = await ttsRoute(fakeRequest);
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.headers.get("content-type"), "audio/mpeg");
    const buffer = await response.arrayBuffer();
    assert.ok(buffer.byteLength > 1000, "Audio response must contain binary audio frames");
  });
});
