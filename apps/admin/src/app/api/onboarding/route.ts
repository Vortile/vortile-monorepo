import { NextResponse } from "next/server";
import { db, restaurants, eq } from "@vortile/database";

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const {
      name,
      category: _category,
      whatsapp,
      deliveryFee,
      avgDeliveryTime,
      minOrderAmount,
      pixKey,
      pixKeyType,
    } = body;

    if (!name || !whatsapp) {
      return NextResponse.json(
        { error: "Nome e WhatsApp são obrigatórios" },
        { status: 400 }
      );
    }

    const restaurantId = "rest_vorti_marmitex";
    const cleanPhone = whatsapp.replace(/\D/g, "");

    // Update restaurant record in SQLite
    db.update(restaurants)
      .set({
        name,
        phone: whatsapp,
        whatsappNumber: cleanPhone || "5511987654321",
        deliveryFee: Number(deliveryFee) || 5.5,
        avgDeliveryTime: avgDeliveryTime || "30 - 45 min",
        minOrderAmount: Number(minOrderAmount) || 20.0,
        pixKey: pixKey || "pix@vorti.com.br",
        pixKeyType: pixKeyType || "email",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(restaurants.id, restaurantId))
      .run();

    const updated = db.select().from(restaurants).where(eq(restaurants.id, restaurantId)).get();

    return NextResponse.json({
      success: true,
      restaurant: updated,
      message: "Restaurante configurado com sucesso no onboarding.",
    });
  } catch (error: any) {
    console.error("[Onboarding API Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
