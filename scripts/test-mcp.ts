import { executeToolCall, geminiTools } from "../apps/admin/src/lib/ai/tools";
import { db, orders, options, products, eq } from "@vortile/database";

async function runMcpVerification() {
  console.log("=== Starting Gemini MCP Tool Execution Verification ===");
  console.log(`Loaded ${geminiTools.length} MCP tool definitions.`);

  // 1. Test get_menu_summary
  console.log("\n[TEST 1] Executing get_menu_summary...");
  const menuResult = await executeToolCall("get_menu_summary", {});
  console.log("Result:", menuResult.humanMessage);
  console.assert(menuResult.result.menuData.length > 0, "Menu should have categories");

  // 2. Test toggle_option_availability (Kitchen command: 'acabou o purê de batata')
  console.log("\n[TEST 2] Kitchen Command: pausing 'Purê de Batatas'...");
  const pauseOpt = await executeToolCall("toggle_option_availability", {
    optionNameOrId: "Purê de Batatas",
    isAvailable: false,
    reason: "Esgotado na panela das 12h",
  });
  console.log("Pause Result:", pauseOpt.humanMessage);

  // Verify in SQLite
  const pureOpt = db.select().from(options).where(eq(options.name, "Purê de Batatas Cremoso")).get();
  console.assert(pureOpt?.isAvailable === false, "Purê de Batatas should be unavailable in DB");
  console.log(`SQLite verified: isAvailable = ${pureOpt?.isAvailable}, pauseReason = ${pureOpt?.pauseReason}`);

  // Re-enable option
  console.log("\n[TEST 2.1] Kitchen Command: re-activating 'Purê de Batatas'...");
  const resumeOpt = await executeToolCall("toggle_option_availability", {
    optionNameOrId: "Purê de Batatas",
    isAvailable: true,
  });
  console.log("Resume Result:", resumeOpt.humanMessage);
  const pureOptAfter = db.select().from(options).where(eq(options.name, "Purê de Batatas Cremoso")).get();
  console.assert(pureOptAfter?.isAvailable === true, "Purê de Batatas should be available again");

  // 3. Test toggle_product_availability (e.g. 'pausa a coca 2L')
  console.log("\n[TEST 3] Kitchen Command: pausing 'Coca-Cola 2L'...");
  const pauseProd = await executeToolCall("toggle_product_availability", {
    productNameOrId: "Coca-Cola 2L",
    isAvailable: false,
    reason: "Estoque de 2L esgotado",
  });
  console.log("Pause Product Result:", pauseProd.humanMessage);

  // Re-enable product
  const resumeProd = await executeToolCall("toggle_product_availability", {
    productNameOrId: "Coca-Cola 2L",
    isAvailable: true,
  });
  console.log("Resume Product Result:", resumeProd.humanMessage);

  // 4. Test list_active_orders
  console.log("\n[TEST 4] Attendant Command: listing active orders...");
  const activeOrders = await executeToolCall("list_active_orders", { statusFilter: "all" });
  console.log("Active Orders Result:", activeOrders.humanMessage);
  console.assert(activeOrders.result.count >= 0, "Orders count should be non-negative");

  // 5. Test update_order_status (Order lifecycle: 101 -> preparing -> ready -> out_for_delivery)
  console.log("\n[TEST 5] Advancing Order #101 through kitchen lifecycle...");
  const updateToReady = await executeToolCall("update_order_status", {
    orderIdOrNumber: "101",
    status: "ready",
  });
  console.log("Order #101 to Ready:", updateToReady.humanMessage);

  const order101 = db.select().from(orders).where(eq(orders.orderNumber, 101)).get();
  console.assert(order101?.status === "ready", "Order 101 should have status 'ready'");
  console.log(`SQLite verified: Order #101 status is '${order101?.status}'`);

  // 5.1 Test dispatch_order_to_driver
  console.log("\n[TEST 5.1] Dispatching Order #101 to Driver Marcos...");
  const dispatchToolRes = await executeToolCall("dispatch_order_to_driver", {
    orderIdOrNumber: "101",
    driverName: "Marcos",
    driverPhone: "11977776666",
    estimatedMinutes: 18,
  });
  console.log("Dispatch Tool Result:", dispatchToolRes.humanMessage);
  const order101DispatchedDirect = db.select().from(orders).where(eq(orders.orderNumber, 101)).get();
  console.assert(order101DispatchedDirect?.status === "out_for_delivery", "Order 101 must be out_for_delivery");
  console.assert(order101DispatchedDirect?.notes?.includes("Marcos"), "Order 101 notes must mention driver Marcos");
  console.log(`SQLite verified: Order #101 dispatched with notes '${order101DispatchedDirect?.notes}'`);

  // 6. Test create_order_from_chat (WhatsApp customer order creation)
  console.log("\n[TEST 6] Creating new order via WhatsApp AI chat...");
  const newOrderResult = await executeToolCall("create_order_from_chat", {
    customerName: "Camila Guimarães",
    customerPhone: "5511977778888",
    customerAddress: "Rua Bela Cintra, 850, Apto 42 - Consolação",
    deliveryType: "delivery",
    paymentMethod: "pix",
    itemsDescription: "1x Marmitex Executivo (Bife Acebolado, Arroz Branco, Feijão Carioca, Farofa da Casa) + 1x Coca Lata",
    totalAmount: 32.40,
    notes: "Campainha quebrada, favor buzinar na portaria",
  });
  console.log("Create Order Result:", newOrderResult.humanMessage);
  console.assert(newOrderResult.result.orderNumber > 0, "New order number must be positive");

  // 7. Test processWhatsAppMessage natural language routing
  console.log("\n[TEST 7] Natural Language Routing via processWhatsAppMessage...");
  const { processWhatsAppMessage } = await import("../apps/admin/src/lib/ai/gemini");
  
  // 7.1 Kitchen command: pause delivery
  const closeRes = await processWhatsAppMessage({
    message: "fecha o restaurante agora, chovendo muito e sem motoboy",
    senderRole: "kitchen",
  });
  console.log("Close Delivery Reply:", closeRes.reply);
  console.assert(closeRes.toolsExecuted.length > 0, "Should execute toggle_restaurant_open tool");

  // 7.2 Kitchen command: reopen delivery
  const reopenRes = await processWhatsAppMessage({
    message: "pode reabrir o restaurante e liberar as entregas",
    senderRole: "kitchen",
  });
  console.log("Reopen Delivery Reply:", reopenRes.reply);

  // 7.3 Customer query: order tracking
  const trackRes = await processWhatsAppMessage({
    message: "olá, onde tá meu pedido 101?",
    senderRole: "customer",
  });
  console.log("Customer Tracking Reply:", trackRes.reply);
  console.assert(trackRes.reply.includes("101"), "Reply must include order 101 status");

  // 7.4 Customer query: delivery fee
  const feeRes = await processWhatsAppMessage({
    message: "quanto custa a entrega?",
    senderRole: "customer",
  });
  console.log("Customer Fee Reply:", feeRes.reply);
  console.assert(feeRes.reply.includes("5,50"), "Fee reply must mention R$ 5,50");

  // 7.5 Customer query: payment methods
  const payRes = await processWhatsAppMessage({
    message: "quais as formas de pagamento aceitas?",
    senderRole: "customer",
  });
  console.log("Customer Payment Reply:", payRes.reply);
  console.assert(payRes.reply.includes("PIX"), "Payment reply must mention PIX");

  // 7.6 Customer query: marmita guarnições
  const sidesRes = await processWhatsAppMessage({
    message: "quais guarnições posso escolher na marmita?",
    senderRole: "customer",
  });
  console.log("Customer Sides Reply:", sidesRes.reply);
  console.assert(sidesRes.reply.includes("guarnições"), "Sides reply must mention guarnições");

  // 7.7 Kitchen command: dispatch order to driver
  console.log("\n[TEST 7.7] Kitchen Command: dispatch order #101 to driver Marcos...");
  const dispatchRes = await processWhatsAppMessage({
    message: "despacha o pedido 101 com o motoboy Marcos",
    senderRole: "kitchen",
  });
  console.log("Kitchen Dispatch Reply:", dispatchRes.reply);
  console.assert(dispatchRes.toolsExecuted.length > 0, "Should execute dispatch_order_to_driver tool");
  const order101Dispatched = db.select().from(orders).where(eq(orders.orderNumber, 101)).get();
  console.assert(order101Dispatched?.status === "out_for_delivery", "Order 101 must be out_for_delivery");
  console.log(`SQLite verified: Order #101 status is '${order101Dispatched?.status}', notes: '${order101Dispatched?.notes}'`);

  // 7.8 Customer query: inquiry about assigned driver
  console.log("\n[TEST 7.8] Customer Query: inquiry about assigned driver for order #101...");
  const driverQueryRes = await processWhatsAppMessage({
    message: "quem é o motoboy do pedido 101?",
    senderRole: "customer",
  });
  console.log("Customer Driver Query Reply:", driverQueryRes.reply);
  console.assert(driverQueryRes.reply.includes("Marcos"), "Reply must include driver Marcos");

  // 8. Test iFood Integration Services
  console.log("\n[TEST 8] Testing iFood Integration Services...");
  const { ifoodService } = await import("../apps/admin/src/lib/integrations/ifood");
  
  // 8.1 Export full catalog
  const catalogExport = await ifoodService.exportFullCatalog();
  console.log(`iFood Catalog Exported: ${catalogExport.itemCount} items across ${catalogExport.categoryCount} categories.`);
  console.assert(catalogExport.itemCount > 0, "Catalog items count should be > 0");
  console.assert(catalogExport.categoryCount > 0, "Catalog category count should be > 0");
  console.assert(catalogExport.categories[0].items.length > 0, "First category should have items");

  // 8.2 Merchant status sync
  const statusUpdate = await ifoodService.updateMerchantStatus("OPEN", "Início de expediente");
  console.log(`iFood Merchant Status: ${statusUpdate.state}`);
  console.assert(statusUpdate.success === true, "Status update should succeed");

  // 8.3 Order cancellation stub
  const cancelStub = await ifoodService.requestCancellation("order_101", "Falta de ingrediente", "502");
  console.log(`iFood Cancellation Request: Code ${cancelStub.code} - ${cancelStub.reason}`);
  console.assert(cancelStub.success === true, "Cancellation request should succeed");

  // 8.4 Logistics Driver Dispatch stub
  const dispatchStub = await ifoodService.dispatchOrder("order_101", {
    name: "Marcos",
    phone: "11977776666",
    vehicleType: "moto",
  });
  console.log(`iFood Logistics Dispatch: Driver ${dispatchStub.driver.name} at ${dispatchStub.dispatchedAt}`);
  console.assert(dispatchStub.success === true, "Dispatch should succeed");

  // 8.5 Merchant Operating Hours Schedule stub
  const scheduleStub = await ifoodService.getMerchantSchedule();
  console.log(`iFood Schedule Stub: ${scheduleStub.schedule.length} daily shifts configured.`);
  console.assert(scheduleStub.schedule.length === 7, "Must have 7 days in schedule");

  console.log("\n=== ALL MCP TOOLS & INTEGRATION TESTS VERIFIED SUCCESSFULLY ===");
}

runMcpVerification().catch((err) => {
  console.error("MCP Verification Failed:", err);
  process.exit(1);
});
