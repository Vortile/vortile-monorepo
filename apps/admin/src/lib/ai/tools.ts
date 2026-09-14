import {
  db,
  restaurants,
  categories,
  products,
  optionGroups,
  options,
  orders,
  orderItems,
  whatsappMessages,
  eq,
  desc,
} from "@vortile/database";

export interface ToolExecutionResult {
  toolName: string;
  arguments: any;
  result: any;
  humanMessage: string;
}

// Tool Definitions according to Gemini Function Calling Schema
export const geminiTools = [
  {
    name: "get_delivery_status_overview",
    description:
      "Fornece um resumo falado e completo da situação atual do delivery: pedidos abertos, faturamento do dia e últimas mensagens de clientes recebidas.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
  {
    name: "list_open_orders",
    description:
      "Lista os pedidos em andamento na esteira (novos, em preparo ou prontos).",
    parameters: {
      type: "OBJECT",
      properties: {
        statusFilter: {
          type: "STRING",
          description:
            "Filtro opcional: 'all', 'pending' (novos), 'preparing' (em preparo), 'ready' (pronto para entrega).",
        },
      },
    },
  },
  {
    name: "send_customer_message",
    description:
      "Envia uma mensagem de WhatsApp oficial do restaurante para um cliente (ex: avisar atraso, confirmar endereço, avisar que o motoboy saiu).",
    parameters: {
      type: "OBJECT",
      properties: {
        customerIdentifier: {
          type: "STRING",
          description: "Nome do cliente, número do pedido ou telefone (ex: 'Carlos', '#101', '11988887777').",
        },
        messageText: {
          type: "STRING",
          description: "Texto que será enviado ao cliente no WhatsApp.",
        },
      },
      required: ["customerIdentifier", "messageText"],
    },
  },
  {
    name: "toggle_option_availability",
    description:
      "Pausa ou reativa uma guarnição ou carne da marmita no cardápio (ex: 'acabou o purê de batata', 'voltou o feijão preto').",
    parameters: {
      type: "OBJECT",
      properties: {
        optionNameOrId: {
          type: "STRING",
          description: "Nome ou ID da opção ou guarnição (ex: 'Purê de Batatas', 'Bife Acebolado').",
        },
        isAvailable: {
          type: "BOOLEAN",
          description: "true para disponível, false para pausar ou esgotado.",
        },
        reason: {
          type: "STRING",
          description: "Motivo opcional da falta.",
        },
      },
      required: ["optionNameOrId", "isAvailable"],
    },
  },
  {
    name: "toggle_product_availability",
    description:
      "Pausa ou reativa um prato ou bebida principal no cardápio online (ex: 'acabou a Coca 2L', 'ativar parmegiana').",
    parameters: {
      type: "OBJECT",
      properties: {
        productNameOrId: {
          type: "STRING",
          description: "Nome ou ID do produto (ex: 'Coca-Cola 2 Litros', 'Filé de Frango à Parmegiana').",
        },
        isAvailable: {
          type: "BOOLEAN",
          description: "true para disponível, false para pausar ou esgotado.",
        },
        reason: {
          type: "STRING",
          description: "Motivo opcional.",
        },
      },
      required: ["productNameOrId", "isAvailable"],
    },
  },
  {
    name: "update_order_status",
    description:
      "Atualiza a etapa de um pedido (ex: 'pedido 101 tá pronto', 'pedido 102 saiu para entrega').",
    parameters: {
      type: "OBJECT",
      properties: {
        orderIdOrNumber: {
          type: "STRING",
          description: "Número do pedido (ex: '101', '104') ou ID.",
        },
        status: {
          type: "STRING",
          description:
            "Novo status: 'pending', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled'.",
        },
      },
      required: ["orderIdOrNumber", "status"],
    },
  },
  {
    name: "get_menu_summary",
    description:
      "Consulta o cardápio do restaurante, preços e itens em falta.",
    parameters: {
      type: "OBJECT",
      properties: {},
    },
  },
];

const normalizeText = (str: string): string => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
};

const findBestMatch = <T extends { id: string; name: string }>(items: T[], query: string): T | undefined => {
  const normQuery = normalizeText(query);
  const byId = items.find((i) => i.id.toLowerCase() === normQuery);
  if (byId) return byId;

  const byExactName = items.find((i) => normalizeText(i.name) === normQuery);
  if (byExactName) return byExactName;

  const byIncludes = items.find((i) => {
    const normName = normalizeText(i.name);
    return normName.includes(normQuery) || normQuery.includes(normName);
  });
  if (byIncludes) return byIncludes;

  const queryTokens = normQuery.split(/\s+/).filter((t) => t.length > 2);
  let bestItem: T | undefined = undefined;
  let bestScore = 0;

  for (const item of items) {
    const itemTokens = normalizeText(item.name).split(/\s+/);
    let matchCount = 0;
    for (const qt of queryTokens) {
      if (itemTokens.some((it) => it.includes(qt) || qt.includes(it))) {
        matchCount++;
      }
    }
    if (matchCount > bestScore) {
      bestScore = matchCount;
      bestItem = item;
    }
  }

  return bestScore > 0 ? bestItem : undefined;
};

// Tool Executors — Manipulates SQLite Database directly with Spoken Natural Outputs
export const executeToolCall = async (
  toolName: string,
  args: any,
  restaurantId = "rest_vorti_marmitex"
): Promise<ToolExecutionResult> => {
  console.log(`[MCP Tool Execution] ${toolName} with args:`, args);

  switch (toolName) {
    case "get_delivery_status_overview": {
      const allOrders = db.select().from(orders).where(eq(orders.restaurantId, restaurantId)).all();
      const active = allOrders.filter((o) => !["delivered", "cancelled"].includes(o.status));
      const pending = active.filter((o) => o.status === "pending").length;
      const preparing = active.filter((o) => o.status === "preparing").length;
      const ready = active.filter((o) => ["ready", "out_for_delivery"].includes(o.status)).length;
      const totalRevenue = allOrders
        .filter((o) => o.status !== "cancelled")
        .reduce((sum, o) => sum + o.total, 0);

      const recentMsgs = db
        .select()
        .from(whatsappMessages)
        .where(eq(whatsappMessages.restaurantId, restaurantId))
        .orderBy(desc(whatsappMessages.createdAt))
        .limit(3)
        .all();

      const lastCustomerMsg = recentMsgs.find((m) => m.senderType === "customer");
      const customerNote = lastCustomerMsg ? ` A última mensagem de cliente foi: "${lastCustomerMsg.content}".` : "";

      const spoken = `O delivery tá com ${active.length} pedidos em andamento agora, sendo ${pending} novo aguardando aceite, ${preparing} em preparo e ${ready} pronto para entrega. O faturamento total de hoje tá em R$ ${totalRevenue.toFixed(2)}.${customerNote}`;

      return {
        toolName,
        arguments: args,
        result: {
          pedidosAtivos: active.length,
          novos: pending,
          emPreparo: preparing,
          prontos: ready,
          faturamento: totalRevenue,
        },
        humanMessage: spoken,
      };
    }

    case "list_open_orders": {
      const { statusFilter } = args;
      let active = db
        .select()
        .from(orders)
        .where(eq(orders.restaurantId, restaurantId))
        .orderBy(desc(orders.orderNumber))
        .all();

      if (statusFilter && statusFilter !== "all") {
        active = active.filter((o) => o.status === statusFilter);
      } else {
        active = active.filter((o) => !["delivered", "cancelled"].includes(o.status));
      }

      if (active.length === 0) {
        return {
          toolName,
          arguments: args,
          result: { count: 0, pedidos: [] },
          humanMessage: "Não temos nenhum pedido aberto na esteira no momento.",
        };
      }

      const orderSummaries = active.map((o) => {
        const statusMap: Record<string, string> = {
          pending: "aguardando preparo",
          preparing: "em preparo",
          ready: "pronto para entrega",
          out_for_delivery: "a caminho com o motoboy",
        };
        return `pedido número ${o.orderNumber} do cliente ${o.customerName} que tá ${statusMap[o.status] || o.status}`;
      });

      const spoken = `Temos ${active.length} pedidos abertos agora: ${orderSummaries.join(", ")}.`;

      return {
        toolName,
        arguments: args,
        result: { count: active.length, pedidos: active },
        humanMessage: spoken,
      };
    }

    case "send_customer_message": {
      const { customerIdentifier, messageText } = args;
      const cleanIdent = String(customerIdentifier).replace(/\D/g, "");
      const allOrders = db.select().from(orders).where(eq(orders.restaurantId, restaurantId)).all();

      const matchedOrder = allOrders.find(
        (o) =>
          (cleanIdent.length > 3 && o.customerPhone.includes(cleanIdent)) ||
          (cleanIdent.length > 0 && o.orderNumber === parseInt(cleanIdent, 10)) ||
          normalizeText(o.customerName).includes(normalizeText(customerIdentifier))
      );

      const targetPhone = matchedOrder ? matchedOrder.customerPhone : (cleanIdent.length > 8 ? cleanIdent : "5511999998888");
      const targetName = matchedOrder ? matchedOrder.customerName : customerIdentifier;

      const msgId = `msg_out_${Date.now()}`;
      db.insert(whatsappMessages)
        .values({
          id: msgId,
          restaurantId,
          phone: targetPhone,
          senderType: "assistant",
          content: messageText,
          createdAt: new Date().toISOString(),
        })
        .run();

      const spoken = `Mandei a mensagem no WhatsApp para ${targetName} avisando o seguinte: "${messageText}".`;

      return {
        toolName,
        arguments: args,
        result: { success: true, targetPhone, targetName, messageText },
        humanMessage: spoken,
      };
    }

    case "toggle_option_availability": {
      const { optionNameOrId, isAvailable, reason } = args;
      const allOpts = db.select().from(options).all();
      const target = findBestMatch(allOpts, optionNameOrId);

      if (!target) {
        return {
          toolName,
          arguments: args,
          result: { error: "Opção não encontrada" },
          humanMessage: `Não encontrei a opção ${optionNameOrId} no cardápio.`,
        };
      }

      const available = Boolean(isAvailable);
      db.update(options)
        .set({
          isAvailable: available,
          pauseReason: available ? null : (reason || "Esgotado na cozinha"),
        })
        .where(eq(options.id, target.id))
        .run();

      const spoken = available
        ? `Reativei ${target.name} no cardápio online e já tá liberado pros clientes.`
        : `Pausei ${target.name} no cardápio online agora mesmo. Nenhum cliente vai conseguir pedir.`;

      return {
        toolName,
        arguments: args,
        result: { id: target.id, name: target.name, isAvailable: available },
        humanMessage: spoken,
      };
    }

    case "toggle_product_availability": {
      const { productNameOrId, isAvailable, reason } = args;
      const allProds = db.select().from(products).where(eq(products.restaurantId, restaurantId)).all();
      const target = findBestMatch(allProds, productNameOrId);

      if (!target) {
        return {
          toolName,
          arguments: args,
          result: { error: "Produto não encontrado" },
          humanMessage: `Não encontrei o produto ${productNameOrId} no cardápio.`,
        };
      }

      const available = Boolean(isAvailable);
      db.update(products)
        .set({
          isAvailable: available,
          pauseReason: available ? null : (reason || "Indisponível"),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(products.id, target.id))
        .run();

      const spoken = available
        ? `Reativei ${target.name} no cardápio online com sucesso.`
        : `Pausei ${target.name} no cardápio agora. Nenhum cliente vai conseguir comprar.`;

      return {
        toolName,
        arguments: args,
        result: { id: target.id, name: target.name, isAvailable: available },
        humanMessage: spoken,
      };
    }

    case "update_order_status": {
      const { orderIdOrNumber, status } = args;
      const cleanNum = String(orderIdOrNumber).replace(/\D/g, "");
      const allOrders = db.select().from(orders).where(eq(orders.restaurantId, restaurantId)).all();

      const target = allOrders.find(
        (o) =>
          o.id === orderIdOrNumber ||
          (cleanNum && o.orderNumber === parseInt(cleanNum, 10))
      );

      if (!target) {
        return {
          toolName,
          arguments: args,
          result: { error: "Pedido não encontrado" },
          humanMessage: `Não encontrei o pedido ${orderIdOrNumber} no sistema.`,
        };
      }

      db.update(orders)
        .set({
          status,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orders.id, target.id))
        .run();

      const spokenMap: Record<string, string> = {
        pending: `O pedido ${target.orderNumber} foi colocado como novo na esteira.`,
        preparing: `O pedido ${target.orderNumber} foi colocado em preparo.`,
        ready: `O pedido ${target.orderNumber} de ${target.customerName} tá pronto e embalado.`,
        out_for_delivery: `O pedido ${target.orderNumber} saiu pra entrega com o motoboy.`,
        delivered: `O pedido ${target.orderNumber} foi marcado como entregue pro cliente.`,
        cancelled: `O pedido ${target.orderNumber} foi cancelado no sistema.`,
      };

      const spoken = spokenMap[status] || `O status do pedido ${target.orderNumber} foi atualizado para ${status}.`;

      return {
        toolName,
        arguments: args,
        result: { id: target.id, orderNumber: target.orderNumber, status },
        humanMessage: spoken,
      };
    }

    case "get_menu_summary": {
      const allCategories = db.select().from(categories).where(eq(categories.restaurantId, restaurantId)).all();
      const allProducts = db.select().from(products).where(eq(products.restaurantId, restaurantId)).all();
      const allOptions = db.select().from(options).all();

      const pausedOpts = allOptions.filter((o) => !o.isAvailable).map((o) => o.name);
      const pausedProds = allProducts.filter((p) => !p.isAvailable).map((p) => p.name);

      let spoken = `O cardápio tá ativo com ${allProducts.length} pratos cadastrados.`;
      if (pausedOpts.length > 0 || pausedProds.length > 0) {
        const pausedAll = [...pausedProds, ...pausedOpts];
        spoken += ` Temos ${pausedAll.join(" e ")} pausados no momento.`;
      } else {
        spoken += " Todos os pratos e guarnições estão disponíveis hoje.";
      }

      return {
        toolName,
        arguments: args,
        result: { productsCount: allProducts.length, pausedOpts, pausedProds },
        humanMessage: spoken,
      };
    }

    default:
      return {
        toolName,
        arguments: args,
        result: { error: "Comando não implementado" },
        humanMessage: "Não consegui reconhecer essa ação no sistema.",
      };
  }
};
