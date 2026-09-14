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

    // Assemble nested structure
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
