import { NextResponse } from "next/server";
import {
  db,
  cashRegisters,
  cashTransactions,
  orders,
  eq,
  desc,
  and,
  gte,
} from "@vortile/database";

export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const history = searchParams.get("history") === "true";
    const restaurantId = searchParams.get("restaurantId") || "rest_vorti_marmitex";

    if (history) {
      const pastShifts = db
        .select()
        .from(cashRegisters)
        .where(and(eq(cashRegisters.restaurantId, restaurantId), eq(cashRegisters.status, "closed")))
        .orderBy(desc(cashRegisters.closedAt))
        .all();
      return NextResponse.json({ shifts: pastShifts });
    }

    // Get active open register
    const activeRegister = db
      .select()
      .from(cashRegisters)
      .where(and(eq(cashRegisters.restaurantId, restaurantId), eq(cashRegisters.status, "open")))
      .get();

    if (!activeRegister) {
      return NextResponse.json({ isOpen: false, register: null });
    }

    // Get transactions (sangrias / suprimentos) for active register
    const transactions = db
      .select()
      .from(cashTransactions)
      .where(eq(cashTransactions.cashRegisterId, activeRegister.id))
      .orderBy(desc(cashTransactions.createdAt))
      .all();

    // Calculate real-time sales since register opened
    const shiftOrders = db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.restaurantId, restaurantId),
          gte(orders.createdAt, activeRegister.openedAt)
        )
      )
      .all();

    const validOrders = shiftOrders.filter((o) => o.status !== "cancelled");
    const totalSales = validOrders.reduce((sum, o) => sum + o.total, 0);
    const totalPix = validOrders.filter((o) => o.paymentMethod === "pix").reduce((sum, o) => sum + o.total, 0);
    const totalCard = validOrders.filter((o) => o.paymentMethod === "card_delivery").reduce((sum, o) => sum + o.total, 0);
    const totalCash = validOrders.filter((o) => o.paymentMethod === "cash").reduce((sum, o) => sum + o.total, 0);

    const totalInflow = transactions.filter((t) => t.type === "inflow").reduce((sum, t) => sum + t.amount, 0);
    const totalOutflow = transactions.filter((t) => t.type === "outflow").reduce((sum, t) => sum + t.amount, 0);

    const expectedCash = activeRegister.initialAmount + totalCash + totalInflow - totalOutflow;

    return NextResponse.json({
      isOpen: true,
      register: {
        ...activeRegister,
        totalSales,
        totalPix,
        totalCard,
        totalCash,
        totalInflow,
        totalOutflow,
        expectedCash,
        ordersCount: validOrders.length,
      },
      transactions,
    });
  } catch (error: any) {
    console.error("[API Caixa GET Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};

export const POST = async (request: Request) => {
  try {
    const body = await request.json();
    const { action, data, restaurantId = "rest_vorti_marmitex" } = body;

    // 1. Abertura de Caixa
    if (action === "open") {
      const { initialAmount = 100, openedBy = "Operador", notes = "" } = data;

      // Check if already open
      const existing = db
        .select()
        .from(cashRegisters)
        .where(and(eq(cashRegisters.restaurantId, restaurantId), eq(cashRegisters.status, "open")))
        .get();

      if (existing) {
        return NextResponse.json(
          { error: "Já existe um turno de caixa aberto no momento." },
          { status: 400 }
        );
      }

      const id = `cx_${Date.now()}`;
      db.insert(cashRegisters)
        .values({
          id,
          restaurantId,
          openedBy,
          openedAt: new Date().toISOString(),
          initialAmount: Number(initialAmount),
          totalSales: 0.0,
          totalPix: 0.0,
          totalCard: 0.0,
          totalCash: 0.0,
          totalInflow: 0.0,
          totalOutflow: 0.0,
          status: "open",
          notes: notes || "Abertura de turno",
        })
        .run();

      const created = db.select().from(cashRegisters).where(eq(cashRegisters.id, id)).get();
      return NextResponse.json({ success: true, register: created });
    }

    // 2. Fechamento de Caixa
    if (action === "close") {
      const { registerId, actualCash = 0, closedBy = "Operador", notes = "" } = data;

      const current = db.select().from(cashRegisters).where(eq(cashRegisters.id, registerId)).get();
      if (!current || current.status !== "open") {
        return NextResponse.json({ error: "Caixa não encontrado ou já encerrado." }, { status: 400 });
      }

      // Calculate shift orders
      const shiftOrders = db
        .select()
        .from(orders)
        .where(
          and(
            eq(orders.restaurantId, restaurantId),
            gte(orders.createdAt, current.openedAt)
          )
        )
        .all();

      const validOrders = shiftOrders.filter((o) => o.status !== "cancelled");
      const totalSales = validOrders.reduce((sum, o) => sum + o.total, 0);
      const totalPix = validOrders.filter((o) => o.paymentMethod === "pix").reduce((sum, o) => sum + o.total, 0);
      const totalCard = validOrders.filter((o) => o.paymentMethod === "card_delivery").reduce((sum, o) => sum + o.total, 0);
      const totalCash = validOrders.filter((o) => o.paymentMethod === "cash").reduce((sum, o) => sum + o.total, 0);

      // Calculate transactions
      const txs = db.select().from(cashTransactions).where(eq(cashTransactions.cashRegisterId, current.id)).all();
      const totalInflow = txs.filter((t) => t.type === "inflow").reduce((sum, t) => sum + t.amount, 0);
      const totalOutflow = txs.filter((t) => t.type === "outflow").reduce((sum, t) => sum + t.amount, 0);

      const expectedCash = current.initialAmount + totalCash + totalInflow - totalOutflow;
      const difference = Number(actualCash) - expectedCash;

      db.update(cashRegisters)
        .set({
          closedBy,
          closedAt: new Date().toISOString(),
          totalSales,
          totalPix,
          totalCard,
          totalCash,
          totalInflow,
          totalOutflow,
          expectedCash,
          actualCash: Number(actualCash),
          difference,
          status: "closed",
          notes,
        })
        .where(eq(cashRegisters.id, registerId))
        .run();

      const closed = db.select().from(cashRegisters).where(eq(cashRegisters.id, registerId)).get();
      return NextResponse.json({ success: true, register: closed });
    }

    // 3. Sangria ou Suprimento
    if (action === "transaction") {
      const { registerId, type, amount, reason, createdBy = "Operador" } = data;

      if (!registerId || !type || !amount || !reason) {
        return NextResponse.json({ error: "Dados incompletos para a movimentação." }, { status: 400 });
      }

      const id = `tx_${Date.now()}`;
      db.insert(cashTransactions)
        .values({
          id,
          cashRegisterId: registerId,
          type, // 'inflow' (suprimento) ou 'outflow' (sangria)
          amount: Number(amount),
          reason,
          createdBy,
          createdAt: new Date().toISOString(),
        })
        .run();

      const created = db.select().from(cashTransactions).where(eq(cashTransactions.id, id)).get();
      return NextResponse.json({ success: true, transaction: created });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (error: any) {
    console.error("[API Caixa POST Error]:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
};
