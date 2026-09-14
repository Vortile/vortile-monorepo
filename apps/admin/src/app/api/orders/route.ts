import { NextResponse } from "next/server";
import {
  db,
  orders,
  orderItems,
  restaurants,
  eq,
  desc,
} from "@vortile/database";

export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("id");
    const status = searchParams.get("status");

    if (orderId) {
      const order = db.select().from(orders).where(eq(orders.id, orderId)).get();
      if (!order) {
        return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
      }
      const items = db.select().from(orderItems).where(eq(orderItems.orderId, order.id)).all();
      return NextResponse.json({ order, items });
    }

    let allOrders = db.select().from(orders).orderBy(desc(orders.createdAt)).all();

    if (status && status !== "all") {
      allOrders = allOrders.filter((o) => o.status === status);
    }

    const allItems = db.select().from(orderItems).all();

    const ordersWithItems = allOrders.map((ord) => ({
      ...ord,
      items: allItems.filter((i) => i.orderId === ord.id),
    }));

    return NextResponse.json({ orders: ordersWithItems });
  } catch (error: any) {
    console.error("[API Orders GET Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const {
      restaurantId = "rest_vorti_marmitex",
      customerName,
      customerPhone,
      customerAddress,
      deliveryType = "delivery",
      paymentMethod = "pix",
      cashChangeFor,
      items,
      notes,
    } = body;

    if (!customerName || !customerPhone || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Nome, telefone e itens do pedido são obrigatórios" },
        { status: 400 }
      );
    }

    // Get restaurant for delivery fee
    const restaurant = db.select().from(restaurants).where(eq(restaurants.id, restaurantId)).get();
    const deliveryFee = deliveryType === "delivery" ? (restaurant?.deliveryFee || 5.5) : 0.0;

    // Calculate subtotal
    const subtotal = items.reduce(
      (acc: number, item: any) => acc + (Number(item.totalPrice) || (item.unitPrice * item.quantity)),
      0
    );
    const total = subtotal + deliveryFee;

    // Generate consecutive order number
    const existing = db.select().from(orders).all();
    const nextNumber = (existing.length > 0 ? Math.max(...existing.map((o) => o.orderNumber)) : 100) + 1;
    const orderId = `ORD-${nextNumber}`;

    // Insert Order
    db.insert(orders)
      .values({
        id: orderId,
        orderNumber: nextNumber,
        restaurantId,
        customerName,
        customerPhone,
        customerAddress: deliveryType === "pickup" ? "Retirada no Balcão" : customerAddress,
        deliveryType,
        paymentMethod,
        paymentStatus: "pending",
        cashChangeFor: cashChangeFor ? Number(cashChangeFor) : null,
        subtotal,
        deliveryFee,
        discount: 0.0,
        total,
        status: "pending",
        notes,
        origin: "pwa",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .run();

    // Insert Order Items
    for (let idx = 0; idx < items.length; idx++) {
      const it = items[idx];
      db.insert(orderItems)
        .values({
          id: `item_${orderId}_${idx + 1}`,
          orderId,
          productId: it.productId,
          productName: it.productName,
          unitPrice: Number(it.unitPrice),
          quantity: Number(it.quantity) || 1,
          totalPrice: Number(it.totalPrice),
          customizationsJson: it.customizations ? JSON.stringify(it.customizations) : null,
          notes: it.notes || null,
        })
        .run();
    }

    const createdOrder = db.select().from(orders).where(eq(orders.id, orderId)).get();

    return NextResponse.json({
      success: true,
      order: createdOrder,
    });
  } catch (error: any) {
    console.error("[API Orders POST Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export const PATCH = async (request: Request) => {
  try {
    const body = await request.json();
    const { orderId, status } = body;

    if (!orderId || !status) {
      return NextResponse.json({ error: "orderId e status são obrigatórios" }, { status: 400 });
    }

    db.update(orders)
      .set({
        status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, orderId))
      .run();

    const updated = db.select().from(orders).where(eq(orders.id, orderId)).get();
    return NextResponse.json({ success: true, order: updated });
  } catch (error: any) {
    console.error("[API Orders PATCH Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
