import { db, orders, products, categories, optionGroups, options, eq } from "@vortile/database";

/**
 * iFood Integration Architecture Stub
 *
 * Implements the standard Brazilian foodtech merchant integration pattern:
 * - Webhook ingestion for Order events (PLACED, CONFIRMED, READY_TO_PICKUP, DISPATCHED, CONCLUDED, CANCELLED)
 * - Order Polling Fallback (for environments where inbound webhooks are blocked/delayed)
 * - Catalog & Availability Synchronization (pushes out-of-stock toggles to iFood Merchant Catalog)
 */

export interface IFoodOrderEvent {
  id: string;
  code: "PLACED" | "CONFIRMED" | "INTEGRATED" | "READY_TO_PICKUP" | "DISPATCHED" | "CONCLUDED" | "CANCELLED";
  orderId: string;
  createdAt: string;
}

export interface IFoodCatalogItemSync {
  productId: string;
  externalCode?: string;
  status: "AVAILABLE" | "UNAVAILABLE";
  reason?: string;
}

export class IFoodIntegrationService {
  private merchantId: string;
  private clientId: string;
  private clientSecret: string;
  private tokenCache?: { token: string; expiresAt: number };

  constructor(merchantId = "vorti-marmitex-001", clientId = "dummy_client_id", clientSecret = "dummy_secret") {
    this.merchantId = merchantId;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
  }

  /**
   * Mock / Stub for obtaining iFood OAuth2 bearer token
   */
  async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.tokenCache && this.tokenCache.expiresAt > now) {
      return this.tokenCache.token;
    }
    // In production, performs POST to https://merchant-api.ifood.com.br/authentication/v1.0/oauth/token
    const fakeToken = `ifood_mock_token_${Date.now()}`;
    this.tokenCache = { token: fakeToken, expiresAt: now + 3600 * 1000 };
    return fakeToken;
  }

  /**
   * Ingest an incoming iFood order into Vortile SQLite database
   */
  async ingestOrder(ifoodOrderPayload: any, restaurantId = "rest_vorti_marmitex"): Promise<{ localOrderId: string; orderNumber: number }> {
    const nextOrderNumber = Math.floor(100 + Math.random() * 900);
    const localOrderId = `order_ifood_${ifoodOrderPayload.id || Date.now()}`;

    const subtotal = Number(ifoodOrderPayload.total?.subTotal || ifoodOrderPayload.subtotal || 30.0);
    const deliveryFee = Number(ifoodOrderPayload.total?.deliveryFee || ifoodOrderPayload.deliveryFee || 6.5);
    const total = subtotal + deliveryFee;

    // Map customer data
    const customerName = ifoodOrderPayload.customer?.name || "Cliente iFood";
    const customerPhone = ifoodOrderPayload.customer?.phone?.number || "5511999990000";
    const customerAddress = ifoodOrderPayload.delivery?.deliveryAddress
      ? `${ifoodOrderPayload.delivery.deliveryAddress.streetName}, ${ifoodOrderPayload.delivery.deliveryAddress.streetNumber} - ${ifoodOrderPayload.delivery.deliveryAddress.neighborhood}`
      : "Entrega via Parceiro iFood";

    db.insert(orders)
      .values({
        id: localOrderId,
        orderNumber: nextOrderNumber,
        restaurantId,
        customerName,
        customerPhone,
        customerAddress,
        deliveryType: "delivery",
        paymentMethod: "card_delivery",
        paymentStatus: "paid", // iFood orders are paid online by default
        subtotal,
        deliveryFee,
        discount: 0,
        total,
        status: "pending",
        notes: `[iFood #${ifoodOrderPayload.displayId || ifoodOrderPayload.id}] ${ifoodOrderPayload.notes || ""}`,
        origin: "manual", // or ifood integration origin
      })
      .run();

    return { localOrderId, orderNumber: nextOrderNumber };
  }

  /**
   * Sync stock item availability back to iFood Merchant Catalog API
   * Called automatically when kitchen staff or Gemini MCP toggles product/guarnição availability.
   */
  async syncItemAvailability(item: IFoodCatalogItemSync): Promise<{ synced: boolean; message: string }> {
    console.log(`[iFood Sync Stub] Syncing item ${item.productId} status to '${item.status}' on iFood Merchant Catalog`);
    return {
      synced: true,
      message: `Item ${item.productId} sincronizado como ${item.status} no iFood.`,
    };
  }

  /**
   * Poll active order events from iFood Order Polling API
   * GET /order/v1.0/events:polling
   */
  async pollOrderEvents(): Promise<IFoodOrderEvent[]> {
    // Stub returns mock heartbeat
    return [
      {
        id: `evt_${Date.now()}`,
        code: "PLACED",
        orderId: `ifood_mock_order_${Math.floor(1000 + Math.random() * 9000)}`,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  /**
   * Acknowledge processed iFood events
   * POST /order/v1.0/events/acknowledgment
   */
  async acknowledgeEvents(eventIds: string[]): Promise<boolean> {
    console.log(`[iFood Sync Stub] Acknowledging ${eventIds.length} events to iFood API`);
    return true;
  }

  /**
   * Synchronize order status dispatch to iFood Merchant API
   * PUT /order/v1.0/orders/{orderId}/readyToPickup
   * PUT /order/v1.0/orders/{orderId}/dispatch
   */
  async syncOrderStatus(orderId: string, status: string): Promise<{ synced: boolean; ifoodStatus: string }> {
    const statusMap: Record<string, string> = {
      preparing: "CONFIRMED",
      ready: "READY_TO_PICKUP",
      out_for_delivery: "DISPATCHED",
      delivered: "CONCLUDED",
      cancelled: "CANCELLED",
    };
    const ifoodStatus = statusMap[status] || status.toUpperCase();
    console.log(`[iFood Sync Stub] Pushing status '${ifoodStatus}' for order ${orderId} to iFood Merchant API`);
    return { synced: true, ifoodStatus };
  }

  /**
   * Dispatch order with dedicated driver details to iFood Merchant Logistics API
   * POST /order/v1.0/orders/{orderId}/dispatch
   */
  async dispatchOrder(
    orderId: string,
    driverInfo: { name: string; phone?: string; vehicleType?: string }
  ): Promise<{ success: boolean; dispatchedAt: string; driver: typeof driverInfo }> {
    const dispatchedAt = new Date().toISOString();
    console.log(
      `[iFood Logistics Stub] Order ${orderId} dispatched to driver ${driverInfo.name} (${driverInfo.vehicleType || "moto"}) at ${dispatchedAt}`
    );
    return {
      success: true,
      dispatchedAt,
      driver: driverInfo,
    };
  }

  /**
   * Fetch merchant operating hours schedule from iFood
   * GET /merchant/v1.0/merchants/{merchantId}/operatingHours
   */
  async getMerchantSchedule(): Promise<{
    merchantId: string;
    schedule: Array<{ dayOfWeek: string; shifts: Array<{ start: string; end: string }> }>;
  }> {
    return {
      merchantId: this.merchantId,
      schedule: [
        { dayOfWeek: "MONDAY", shifts: [{ start: "10:30", end: "15:00" }, { start: "18:00", end: "22:30" }] },
        { dayOfWeek: "TUESDAY", shifts: [{ start: "10:30", end: "15:00" }, { start: "18:00", end: "22:30" }] },
        { dayOfWeek: "WEDNESDAY", shifts: [{ start: "10:30", end: "15:00" }, { start: "18:00", end: "22:30" }] },
        { dayOfWeek: "THURSDAY", shifts: [{ start: "10:30", end: "15:00" }, { start: "18:00", end: "22:30" }] },
        { dayOfWeek: "FRIDAY", shifts: [{ start: "10:30", end: "15:00" }, { start: "18:00", end: "22:30" }] },
        { dayOfWeek: "SATURDAY", shifts: [{ start: "10:30", end: "15:30" }, { start: "18:00", end: "23:00" }] },
        { dayOfWeek: "SUNDAY", shifts: [{ start: "11:00", end: "15:30" }] },
      ],
    };
  }

  /**
   * Synchronize merchant operating hours schedule to iFood
   * PUT /merchant/v1.0/merchants/{merchantId}/operatingHours
   */
  async updateMerchantSchedule(
    schedule: Array<{ dayOfWeek: string; shifts: Array<{ start: string; end: string }> }>
  ): Promise<{ success: boolean; syncedShiftsCount: number }> {
    console.log(`[iFood Sync Stub] Syncing ${schedule.length} operating schedules to iFood Merchant API`);
    return {
      success: true,
      syncedShiftsCount: schedule.length,
    };
  }

  /**
   * Request order cancellation according to iFood API v1.0 standard cancellation codes
   * POST /order/v1.0/orders/{orderId}/requestCancellation
   * Standard codes:
   * 501: Problemas de sistema
   * 502: Item esgotado / indisponível
   * 503: Restaurante fechado / fora do horário
   * 504: Dificuldades internas da cozinha
   * 505: Endereço fora da área de entrega
   */
  async requestCancellation(
    orderId: string,
    reason: string,
    cancellationCode = "502"
  ): Promise<{ success: boolean; code: string; reason: string }> {
    console.log(`[iFood Sync Stub] Requesting cancellation for order ${orderId} (Code ${cancellationCode}: ${reason})`);
    
    // Update local database order status if exists
    try {
      db.update(orders)
        .set({ status: "cancelled", notes: `[CANCELADO iFood ${cancellationCode}]: ${reason}`, updatedAt: new Date().toISOString() })
        .where(eq(orders.id, orderId))
        .run();
    } catch (e) {
      console.warn(`[iFood Sync] Could not update local order ${orderId}:`, e);
    }

    return {
      success: true,
      code: cancellationCode,
      reason,
    };
  }

  /**
   * Update restaurant opening status on iFood Merchant Status API
   * PUT /merchant/v1.0/merchants/{merchantId}/status
   */
  async updateMerchantStatus(state: "OPEN" | "CLOSED", reason?: string): Promise<{ success: boolean; state: string }> {
    console.log(`[iFood Sync Stub] Merchant status set to '${state}' on iFood (Reason: ${reason || "Manual update"})`);
    return { success: true, state };
  }

  /**
   * Generate Full iFood Catalog V2 synchronization payload
   * GET/PUT /catalog/v2.0/merchants/{merchantId}/menus
   */
  async exportFullCatalog(restaurantId = "rest_vorti_marmitex") {
    const catalogCategories = db.select().from(categories).where(eq(categories.restaurantId, restaurantId)).all();
    const catalogProducts = db.select().from(products).where(eq(products.restaurantId, restaurantId)).all();
    const allGroups = db.select().from(optionGroups).all();
    const allOptions = db.select().from(options).all();

    const groupsByProduct = new Map<string, any[]>();
    allGroups.forEach((g) => {
      const opts = allOptions
        .filter((o) => o.groupId === g.id)
        .map((o) => ({
          id: o.id,
          name: o.name,
          price: o.priceDelta,
          status: o.isAvailable ? "AVAILABLE" : "UNAVAILABLE",
          pauseReason: o.pauseReason,
        }));
      const list = groupsByProduct.get(g.productId) || [];
      list.push({
        id: g.id,
        name: g.name,
        min: g.minSelected,
        max: g.maxSelected,
        required: g.isRequired,
        options: opts,
      });
      groupsByProduct.set(g.productId, list);
    });

    return {
      merchantId: this.merchantId,
      syncedAt: new Date().toISOString(),
      categoryCount: catalogCategories.length,
      itemCount: catalogProducts.length,
      categories: catalogCategories.map((c) => ({
        id: c.id,
        name: c.name,
        items: catalogProducts
          .filter((p) => p.categoryId === c.id)
          .map((p) => ({
            id: p.id,
            name: p.name,
            description: p.description,
            price: {
              value: p.price,
              originalValue: p.promotionalPrice || p.price,
            },
            status: p.isAvailable ? "AVAILABLE" : "UNAVAILABLE",
            externalCode: p.id,
            modifierGroups: groupsByProduct.get(p.id) || [],
          })),
      })),
      rawItems: catalogProducts.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: {
          value: p.price,
          originalValue: p.promotionalPrice || p.price,
        },
        status: p.isAvailable ? "AVAILABLE" : "UNAVAILABLE",
        externalCode: p.id,
      })),
    };
  }
}

export const ifoodService = new IFoodIntegrationService();
