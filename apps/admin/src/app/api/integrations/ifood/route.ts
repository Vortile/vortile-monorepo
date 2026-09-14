import { NextResponse } from "next/server";
import { ifoodService, IFoodCatalogItemSync } from "@/lib/integrations/ifood";

/**
 * iFood Integration Endpoint
 * POST /api/integrations/ifood - handles webhook events or sync triggers
 * GET /api/integrations/ifood - polls events and returns integration status
 */

export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "status";

    if (action === "poll") {
      const events = await ifoodService.pollOrderEvents();
      return NextResponse.json({
        success: true,
        service: "iFood Merchant API Polling",
        events,
        polledAt: new Date().toISOString(),
      });
    }

    if (action === "catalog") {
      const catalog = await ifoodService.exportFullCatalog();
      return NextResponse.json({
        success: true,
        service: "iFood Merchant Catalog V2",
        catalog,
      });
    }

    if (action === "schedule") {
      const schedule = await ifoodService.getMerchantSchedule();
      return NextResponse.json({
        success: true,
        service: "iFood Operating Hours API",
        schedule,
      });
    }

    return NextResponse.json({
      status: "connected",
      provider: "iFood Merchant API v1.0",
      merchantId: "vorti-marmitex-001",
      capabilities: [
        "Order Webhook Ingestion",
        "Order Polling Fallback",
        "Catalog Stock Synchronization",
        "Order Status Acknowledgement",
        "Order Cancellation Flow",
        "Merchant Opening Hours Sync",
        "Dedicated Driver Dispatch Logistics",
      ],
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const { type = "order", payload } = body;

    if (type === "order") {
      // Ingest order
      const result = await ifoodService.ingestOrder(payload || body);
      return NextResponse.json({
        success: true,
        message: `Pedido do iFood #${result.orderNumber} integrado com sucesso na fila da cozinha!`,
        result,
      });
    } else if (type === "sync_stock") {
      // Sync stock
      const syncItem: IFoodCatalogItemSync = payload;
      const result = await ifoodService.syncItemAvailability(syncItem);
      return NextResponse.json({
        success: true,
        result,
      });
    } else if (type === "cancellation") {
      const { orderId, reason = "Item esgotado na cozinha", code = "502" } = payload || body;
      const result = await ifoodService.requestCancellation(orderId, reason, code);
      return NextResponse.json({
        success: true,
        message: `Cancelamento solicitado com sucesso para pedido ${orderId}`,
        result,
      });
    } else if (type === "merchant_status") {
      const { state = "OPEN", reason } = payload || body;
      const result = await ifoodService.updateMerchantStatus(state, reason);
      return NextResponse.json({
        success: true,
        message: `Status do restaurante atualizado para ${state}`,
        result,
      });
    } else if (type === "dispatch") {
      const { orderId, driverInfo = { name: "Motoboy Padrão" } } = payload || body;
      const result = await ifoodService.dispatchOrder(orderId, driverInfo);
      return NextResponse.json({
        success: true,
        message: `Pedido ${orderId} despachado com sucesso para o motoboy ${driverInfo.name}`,
        result,
      });
    } else if (type === "schedule") {
      const { schedule = [] } = payload || body;
      const result = await ifoodService.updateMerchantSchedule(schedule);
      return NextResponse.json({
        success: true,
        message: `Grade de horários do iFood sincronizada com sucesso`,
        result,
      });
    }

    return NextResponse.json({ error: "Tipo de evento iFood desconhecido" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
