import test from "node:test";
import assert from "node:assert";
import {
  db,
  restaurants,
  options,
  products,
  orders,
  whatsappMessages,
  eq,
} from "@vortile/database";
import { executeToolCall } from "../lib/ai/tools";
import { processWhatsAppMessage } from "../lib/ai/gemini";

test("Vortile Delivery — Test Pipeline", async (t) => {
  const restaurantId = "rest_vorti_marmitex";

  await t.test("1. Onboarding & Store Configuration in SQLite", async () => {
    // Verify restaurant profile exists and can be updated
    const rest = db.select().from(restaurants).where(eq(restaurants.id, restaurantId)).get();
    assert.ok(rest, "Restaurant record must exist in SQLite");

    // Test updating onboarding settings
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

    // Strict Spoken constraints: No bullet points, no asterisks, no dashes
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

    // Verify it was persisted in SQLite whatsapp_messages table
    const lastMsg = db
      .select()
      .from(whatsappMessages)
      .where(eq(whatsappMessages.restaurantId, restaurantId))
      .orderBy(eq(whatsappMessages.content, customerMsg))
      .get();

    assert.ok(lastMsg, "Message must be saved in SQLite whatsapp_messages table");
  });

  await t.test("5. MCP Tool: toggle_option_availability (Kitchen pauses and resumes option)", async () => {
    // 1. Pause Purê de Batatas
    const pauseResult = await executeToolCall(
      "toggle_option_availability",
      { optionNameOrId: "Purê de Batatas", isAvailable: false, reason: "Acabou na panela" },
      restaurantId
    );

    assert.strictEqual(pauseResult.result.isAvailable, false);
    const pausedDb = db.select().from(options).where(eq(options.id, "opt_pure_batata")).get();
    assert.strictEqual(pausedDb?.isAvailable, false, "Must be false in SQLite");

    // Verify spoken response has NO bullets
    assert.strictEqual(pauseResult.humanMessage.includes("•"), false);
    assert.strictEqual(pauseResult.humanMessage.includes("*"), false);

    // 2. Resume Purê de Batatas
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

    // Resume
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
    assert.ok(response.toolsExecuted.length > 0, "Must execute the overview tool");
  });
});
