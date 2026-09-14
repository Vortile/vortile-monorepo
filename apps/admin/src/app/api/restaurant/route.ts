import { NextResponse } from "next/server";
import { db, restaurants, eq } from "@vortile/database";

const DEFAULT_RESTAURANT_ID = "rest_vorti_marmitex";

export const GET = async () => {
  try {
    const restaurant = db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, DEFAULT_RESTAURANT_ID))
      .get();

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurante não encontrado" }, { status: 404 });
    }

    return NextResponse.json({ success: true, restaurant });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export const PATCH = async (request: Request) => {
  try {
    const body = await request.json();
    const {
      name,
      phone,
      whatsappNumber,
      deliveryFee,
      avgDeliveryTime,
      minOrderAmount,
      pixKey,
      pixKeyType,
      primaryColor,
      isOpen,
      openingHours,
    } = body;

    const updatePayload: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updatePayload.name = name;
    if (phone !== undefined) updatePayload.phone = phone;
    if (whatsappNumber !== undefined) updatePayload.whatsappNumber = whatsappNumber;
    if (deliveryFee !== undefined) updatePayload.deliveryFee = Number(deliveryFee);
    if (avgDeliveryTime !== undefined) updatePayload.avgDeliveryTime = avgDeliveryTime;
    if (minOrderAmount !== undefined) updatePayload.minOrderAmount = Number(minOrderAmount);
    if (pixKey !== undefined) updatePayload.pixKey = pixKey;
    if (pixKeyType !== undefined) updatePayload.pixKeyType = pixKeyType;
    if (primaryColor !== undefined) updatePayload.primaryColor = primaryColor;
    if (isOpen !== undefined) updatePayload.isOpen = Boolean(isOpen);
    if (openingHours !== undefined) updatePayload.openingHours = openingHours;

    db.update(restaurants)
      .set(updatePayload)
      .where(eq(restaurants.id, DEFAULT_RESTAURANT_ID))
      .run();

    const updated = db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, DEFAULT_RESTAURANT_ID))
      .get();

    return NextResponse.json({
      success: true,
      restaurant: updated,
      message: "Configurações atualizadas com sucesso.",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
