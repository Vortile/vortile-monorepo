import { NextResponse } from "next/server";
import { db, users, eq } from "@vortile/database";

export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const restaurantId = searchParams.get("restaurantId") || "rest_vorti_marmitex";

    const allUsers = db
      .select()
      .from(users)
      .where(eq(users.restaurantId, restaurantId))
      .all();

    return NextResponse.json({ users: allUsers });
  } catch (error: any) {
    console.error("[API Users GET Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const {
      name,
      email,
      phone,
      role = "operador",
      pin = "1234",
      restaurantId = "rest_vorti_marmitex",
    } = body;

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: "Nome, e-mail e telefone são obrigatórios" },
        { status: 400 }
      );
    }

    const id = `usr_${Date.now()}`;
    db.insert(users)
      .values({
        id,
        restaurantId,
        name,
        email,
        phone,
        role, // 'admin' ou 'operador'
        pin,
        isActive: true,
        createdAt: new Date().toISOString(),
      })
      .run();

    const created = db.select().from(users).where(eq(users.id, id)).get();
    return NextResponse.json({ success: true, user: created });
  } catch (error: any) {
    console.error("[API Users POST Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export const PATCH = async (request: Request) => {
  try {
    const body = await request.json();
    const { id, role, pin, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: "ID do usuário é obrigatório" }, { status: 400 });
    }

    const updatePayload: any = {};
    if (role !== undefined) updatePayload.role = role;
    if (pin !== undefined) updatePayload.pin = pin;
    if (isActive !== undefined) updatePayload.isActive = Boolean(isActive);

    db.update(users).set(updatePayload).where(eq(users.id, id)).run();

    const updated = db.select().from(users).where(eq(users.id, id)).get();
    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error("[API Users PATCH Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export const DELETE = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    db.delete(users).where(eq(users.id, id)).run();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[API Users DELETE Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
