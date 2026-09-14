import { NextResponse } from "next/server";
import {
  db,
  restaurants,
  categories,
  products,
  optionGroups,
  options,
  eq,
  asc,
} from "@vortile/database";

export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug") || "vorti-marmitex";

    const restaurant = db
      .select()
      .from(restaurants)
      .where(eq(restaurants.slug, slug))
      .get();

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurante não encontrado" }, { status: 404 });
    }

    const cats = db
      .select()
      .from(categories)
      .where(eq(categories.restaurantId, restaurant.id))
      .orderBy(asc(categories.sortOrder))
      .all();

    const prods = db
      .select()
      .from(products)
      .where(eq(products.restaurantId, restaurant.id))
      .orderBy(asc(products.sortOrder))
      .all();

    const groups = db.select().from(optionGroups).all();
    const opts = db.select().from(options).orderBy(asc(options.sortOrder)).all();

    const menu = cats.map((cat) => ({
      ...cat,
      products: prods
        .filter((p) => p.categoryId === cat.id)
        .map((p) => {
          const productGroups = groups
            .filter((g) => g.productId === p.id)
            .map((g) => ({
              ...g,
              options: opts.filter((o) => o.groupId === g.id),
            }));

          return {
            ...p,
            optionGroups: productGroups,
          };
        }),
    }));

    return NextResponse.json({
      restaurant,
      categories: menu,
    });
  } catch (error: any) {
    console.error("[API Menu Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const { entity, data, restaurantId = "rest_vorti_marmitex" } = body;

    if (entity === "product") {
      const {
        categoryId,
        name,
        description,
        price,
        promotionalPrice,
        imageUrl,
        badge,
        hasCustomizations = false,
      } = data;

      if (!name || !price || !categoryId) {
        return NextResponse.json(
          { error: "Nome, preço e categoria são obrigatórios" },
          { status: 400 }
        );
      }

      const id = `prod_${Date.now()}`;
      db.insert(products)
        .values({
          id,
          restaurantId,
          categoryId,
          name,
          description: description || null,
          price: Number(price),
          promotionalPrice: promotionalPrice ? Number(promotionalPrice) : null,
          imageUrl: imageUrl || null,
          badge: badge || null,
          hasCustomizations: Boolean(hasCustomizations),
          isAvailable: true,
          sortOrder: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .run();

      const created = db.select().from(products).where(eq(products.id, id)).get();
      return NextResponse.json({ success: true, product: created });
    }

    if (entity === "category") {
      const { name, description } = data;
      if (!name) {
        return NextResponse.json({ error: "Nome da categoria é obrigatório" }, { status: 400 });
      }

      const id = `cat_${Date.now()}`;
      db.insert(categories)
        .values({
          id,
          restaurantId,
          name,
          description: description || null,
          sortOrder: 10,
          isActive: true,
          createdAt: new Date().toISOString(),
        })
        .run();

      const created = db.select().from(categories).where(eq(categories.id, id)).get();
      return NextResponse.json({ success: true, category: created });
    }

    if (entity === "option") {
      const { groupId, name, priceDelta = 0 } = data;
      if (!groupId || !name) {
        return NextResponse.json({ error: "Grupo e nome da opção são obrigatórios" }, { status: 400 });
      }

      const id = `opt_${Date.now()}`;
      db.insert(options)
        .values({
          id,
          groupId,
          name,
          priceDelta: Number(priceDelta),
          isAvailable: true,
          sortOrder: 10,
        })
        .run();

      const created = db.select().from(options).where(eq(options.id, id)).get();
      return NextResponse.json({ success: true, option: created });
    }

    return NextResponse.json({ error: "Entidade inválida" }, { status: 400 });
  } catch (error: any) {
    console.error("[API Menu POST Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export const PATCH = async (request: Request) => {
  try {
    const body = await request.json();
    const { entity, id, data } = body;

    if (!id || !entity) {
      return NextResponse.json({ error: "ID e entidade são obrigatórios" }, { status: 400 });
    }

    if (entity === "product") {
      const updatePayload: any = { updatedAt: new Date().toISOString() };
      if (data.name !== undefined) updatePayload.name = data.name;
      if (data.description !== undefined) updatePayload.description = data.description;
      if (data.price !== undefined) updatePayload.price = Number(data.price);
      if (data.promotionalPrice !== undefined)
        updatePayload.promotionalPrice = data.promotionalPrice ? Number(data.promotionalPrice) : null;
      if (data.imageUrl !== undefined) updatePayload.imageUrl = data.imageUrl;
      if (data.badge !== undefined) updatePayload.badge = data.badge;
      if (data.isAvailable !== undefined) updatePayload.isAvailable = Boolean(data.isAvailable);
      if (data.pauseReason !== undefined) updatePayload.pauseReason = data.pauseReason;

      db.update(products).set(updatePayload).where(eq(products.id, id)).run();
      const updated = db.select().from(products).where(eq(products.id, id)).get();
      return NextResponse.json({ success: true, product: updated });
    }

    if (entity === "option") {
      const updatePayload: any = {};
      if (data.name !== undefined) updatePayload.name = data.name;
      if (data.priceDelta !== undefined) updatePayload.priceDelta = Number(data.priceDelta);
      if (data.isAvailable !== undefined) updatePayload.isAvailable = Boolean(data.isAvailable);
      if (data.pauseReason !== undefined) updatePayload.pauseReason = data.pauseReason;

      db.update(options).set(updatePayload).where(eq(options.id, id)).run();
      const updated = db.select().from(options).where(eq(options.id, id)).get();
      return NextResponse.json({ success: true, option: updated });
    }

    return NextResponse.json({ error: "Entidade inválida" }, { status: 400 });
  } catch (error: any) {
    console.error("[API Menu PATCH Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export const DELETE = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const entity = searchParams.get("entity");
    const id = searchParams.get("id");

    if (!id || !entity) {
      return NextResponse.json({ error: "ID e entidade são obrigatórios" }, { status: 400 });
    }

    if (entity === "product") {
      db.delete(products).where(eq(products.id, id)).run();
      return NextResponse.json({ success: true });
    }

    if (entity === "option") {
      db.delete(options).where(eq(options.id, id)).run();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Entidade inválida" }, { status: 400 });
  } catch (error: any) {
    console.error("[API Menu DELETE Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
