import { runMigrations } from "./migrate";
import {
  db,
  restaurants,
  categories,
  products,
  optionGroups,
  options,
  orders,
  orderItems,
  restaurantStaff,
  users,
  cashRegisters,
} from "./index";

export const seed = async () => {
  runMigrations();

  console.log("Seeding Vortile Delivery database with realistic Brazilian restaurant data...");

  // 1. Restaurant
  const restaurantId = "rest_vorti_marmitex";
  await db
    .insert(restaurants)
    .values({
      id: restaurantId,
      name: "Vorti Marmitex & Grelhados",
      slug: "vorti-marmitex",
      description: "Comida caseira autêntica feita com ingredientes frescos do dia. Monte sua marmita do seu jeito!",
      phone: "+55 (11) 98765-4321",
      whatsappNumber: "5511987654321",
      address: "Rua Augusta, 1420 - Consolação",
      city: "São Paulo",
      state: "SP",
      isOpen: true,
      openingHours: "Seg a Sáb: 10:45 às 15:30 • 18:00 às 22:30",
      deliveryFee: 5.5,
      minOrderAmount: 20.0,
      avgDeliveryTime: "30 - 45 min",
      bannerUrl: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=1200&auto=format&fit=crop&q=80",
      logoUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80",
      pixKey: "pix@vorti.com.br",
      pixKeyType: "email",
      aiEnabled: true,
      aiSystemPrompt:
        "Você é o assistente oficial do Vorti Marmitex & Grelhados no WhatsApp. Atenda clientes com simpatia e agilidade, e auxilie os cozinheiros e montadores de marmitas a gerenciar o cardápio e os pedidos através de comandos em linguagem natural.",
    })
    .onConflictDoNothing();

  // 2. Categories
  const catMarmitasId = "cat_marmitas";
  const catGrelhadosId = "cat_grelhados";
  const catBebidasId = "cat_bebidas";
  const catSobremesasId = "cat_sobremesas";

  await db
    .insert(categories)
    .values([
      {
        id: catMarmitasId,
        restaurantId,
        name: "Marmitex do Dia",
        description: "Monte sua refeição completa com carnes suculentas e guarnições fresquinhas.",
        sortOrder: 1,
        isActive: true,
      },
      {
        id: catGrelhadosId,
        restaurantId,
        name: "Pratos Individuais & Fit",
        description: "Grelhados selecionados, opções saudáveis e porções generosas.",
        sortOrder: 2,
        isActive: true,
      },
      {
        id: catBebidasId,
        restaurantId,
        name: "Bebidas & Refrigerantes",
        description: "Bebidas geladas para acompanhar seu almoço.",
        sortOrder: 3,
        isActive: true,
      },
      {
        id: catSobremesasId,
        restaurantId,
        name: "Sobremesas Artesanais",
        description: "O doce caseiro para fechar com chave de ouro.",
        sortOrder: 4,
        isActive: true,
      },
    ])
    .onConflictDoNothing();

  // 3. Products
  const prodMarmitaM = "prod_marmita_m";
  const prodMarmitaG = "prod_marmita_g";
  const prodParmegiana = "prod_parmegiana";
  const prodFit = "prod_fit_frango";
  const prodCocaLata = "prod_coca_lata";
  const prodCoca2L = "prod_coca_2l";
  const prodSucoLaranja = "prod_suco_laranja";
  const prodPudim = "prod_pudim";

  await db
    .insert(products)
    .values([
      {
        id: prodMarmitaM,
        restaurantId,
        categoryId: catMarmitasId,
        name: "Marmitex Executivo (Média)",
        description: "1 carne à sua escolha, até 3 guarnições fartas e salada fresca do dia.",
        price: 27.9,
        promotionalPrice: 25.9,
        imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
        isAvailable: true,
        sortOrder: 1,
        hasCustomizations: true,
        badge: "Mais Pedido ⭐",
      },
      {
        id: prodMarmitaG,
        restaurantId,
        categoryId: catMarmitasId,
        name: "Marmitex Família (Grande)",
        description: "Até 2 carnes, até 4 guarnições, vinagrete e farofa crocante.",
        price: 35.9,
        promotionalPrice: null,
        imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80",
        isAvailable: true,
        sortOrder: 2,
        hasCustomizations: true,
        badge: "Super Fartura",
      },
      {
        id: prodParmegiana,
        restaurantId,
        categoryId: catGrelhadosId,
        name: "Filé de Frango à Parmegiana",
        description: "Empanado crocante, coberto com molho de tomate rústico e muito queijo derretido. Acompanha arroz e fritas.",
        price: 34.0,
        imageUrl: "https://images.unsplash.com/photo-1562967914-608f82629710?w=600&auto=format&fit=crop&q=80",
        isAvailable: true,
        sortOrder: 3,
        hasCustomizations: false,
        badge: "Destaque do Chef",
      },
      {
        id: prodFit,
        restaurantId,
        categoryId: catGrelhadosId,
        name: "Marmita Fit de Frango & Batata Doce",
        description: "Peito de frango grelhado em tiras, arroz integral, brócolis no vapor e purê de batata doce.",
        price: 26.5,
        imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80",
        isAvailable: true,
        sortOrder: 4,
        hasCustomizations: false,
        badge: "Saudável & Leve",
      },
      {
        id: prodCocaLata,
        restaurantId,
        categoryId: catBebidasId,
        name: "Coca-Cola Original 350ml",
        description: "Lata bem gelada.",
        price: 6.5,
        imageUrl: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&auto=format&fit=crop&q=80",
        isAvailable: true,
        sortOrder: 5,
        hasCustomizations: false,
      },
      {
        id: prodCoca2L,
        restaurantId,
        categoryId: catBebidasId,
        name: "Coca-Cola 2 Litros",
        description: "Garrafa família super gelada.",
        price: 14.9,
        imageUrl: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=600&auto=format&fit=crop&q=80",
        isAvailable: true,
        sortOrder: 6,
        hasCustomizations: false,
      },
      {
        id: prodSucoLaranja,
        restaurantId,
        categoryId: catBebidasId,
        name: "Suco Natural de Laranja 500ml",
        description: "Espremido na hora, 100% fruta sem adição de água.",
        price: 9.9,
        imageUrl: "https://images.unsplash.com/photo-1613478223719-2ab802602423?w=600&auto=format&fit=crop&q=80",
        isAvailable: true,
        sortOrder: 7,
        hasCustomizations: false,
      },
      {
        id: prodPudim,
        restaurantId,
        categoryId: catSobremesasId,
        name: "Pudim de Leite Condensado Artesanal",
        description: "Cremoso, com calda de caramelo brilhante e sem furinhos.",
        price: 8.5,
        imageUrl: "https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop&q=80",
        isAvailable: true,
        sortOrder: 8,
        hasCustomizations: false,
        badge: "Receita de Vó ❤️",
      },
    ])
    .onConflictDoNothing();

  // 4. Option Groups for "Marmitex Executivo (Média)"
  const grpCarne = "grp_marmita_carne";
  const grpGuarnicao = "grp_marmita_guarnicao";
  const grpSalada = "grp_marmita_salada";

  await db
    .insert(optionGroups)
    .values([
      {
        id: grpCarne,
        productId: prodMarmitaM,
        name: "1. Escolha sua Carne",
        description: "Selecione 1 opção obrigatória",
        minSelected: 1,
        maxSelected: 1,
        isRequired: true,
        sortOrder: 1,
      },
      {
        id: grpGuarnicao,
        productId: prodMarmitaM,
        name: "2. Escolha as Guarnições (Até 3 opções)",
        description: "Monte o prato com suas guarnições favoritas",
        minSelected: 1,
        maxSelected: 3,
        isRequired: true,
        sortOrder: 2,
      },
      {
        id: grpSalada,
        productId: prodMarmitaM,
        name: "3. Salada do Dia",
        description: "Selecione 1 opção",
        minSelected: 1,
        maxSelected: 1,
        isRequired: true,
        sortOrder: 3,
      },
    ])
    .onConflictDoNothing();

  // 5. Options
  await db
    .insert(options)
    .values([
      // Carnes
      {
        id: "opt_bife_alcatra",
        groupId: grpCarne,
        name: "Bife de Alcatra Acebolado",
        description: "Bife macio grelhado na chapa com cebola dourada",
        priceDelta: 0.0,
        isAvailable: true,
        sortOrder: 1,
      },
      {
        id: "opt_frango_grelhado",
        groupId: grpCarne,
        name: "Filé de Frango Grelhado na Manteiga de Ervas",
        description: "Frango suculento e douradinho",
        priceDelta: 0.0,
        isAvailable: true,
        sortOrder: 2,
      },
      {
        id: "opt_costela_suina",
        groupId: grpCarne,
        name: "Costelinha Suína Assada ao Barbecue",
        description: "Desmanchando do osso",
        priceDelta: 3.5,
        isAvailable: true,
        sortOrder: 3,
      },
      {
        id: "opt_feijoada_porcao",
        groupId: grpCarne,
        name: "Feijoada Completa com Torresmo",
        description: "Carnes nobres com couve e torresminho crocante",
        priceDelta: 4.0,
        isAvailable: true,
        sortOrder: 4,
      },

      // Guarnições
      {
        id: "opt_arroz_branco",
        groupId: grpGuarnicao,
        name: "Arroz Branco Soltinho",
        priceDelta: 0.0,
        isAvailable: true,
        sortOrder: 1,
      },
      {
        id: "opt_feijao_carioca",
        groupId: grpGuarnicao,
        name: "Feijão Carioca Caseiro",
        priceDelta: 0.0,
        isAvailable: true,
        sortOrder: 2,
      },
      {
        id: "opt_pure_batata",
        groupId: grpGuarnicao,
        name: "Purê de Batatas Cremoso",
        description: "Feito com manteiga e batata fresca artesanal",
        priceDelta: 0.0,
        isAvailable: true, // Will be toggled via Gemini MCP during tests!
        sortOrder: 3,
      },
      {
        id: "opt_macarrao_alho",
        groupId: grpGuarnicao,
        name: "Macarrão ao Alho e Óleo com Ervas",
        priceDelta: 0.0,
        isAvailable: true,
        sortOrder: 4,
      },
      {
        id: "opt_farofa_crocante",
        groupId: grpGuarnicao,
        name: "Farofa Crocante de Bacon",
        priceDelta: 0.0,
        isAvailable: true,
        sortOrder: 5,
      },
      {
        id: "opt_batata_frita",
        groupId: grpGuarnicao,
        name: "Batata Frita Sequina",
        priceDelta: 2.0,
        isAvailable: true,
        sortOrder: 6,
      },

      // Saladas
      {
        id: "opt_salada_verde",
        groupId: grpSalada,
        name: "Salada Verde (Alface americana, tomate e pepino)",
        priceDelta: 0.0,
        isAvailable: true,
        sortOrder: 1,
      },
      {
        id: "opt_vinagrete",
        groupId: grpSalada,
        name: "Vinagrete Especial da Casa",
        priceDelta: 0.0,
        isAvailable: true,
        sortOrder: 2,
      },
      {
        id: "opt_sem_salada",
        groupId: grpSalada,
        name: "Não quero salada",
        priceDelta: 0.0,
        isAvailable: true,
        sortOrder: 3,
      },
    ])
    .onConflictDoNothing();

  // 6. Authorized Staff for WhatsApp MCP Commands
  await db
    .insert(restaurantStaff)
    .values([
      {
        id: "staff_ze_cozinha",
        restaurantId,
        name: "Zé da Cozinha (Montador de Marmitas)",
        phone: "5511999998888",
        role: "kitchen",
        isActive: true,
      },
      {
        id: "staff_gerente_ana",
        restaurantId,
        name: "Ana Paula (Gerente / Caixa)",
        phone: "5511988887777",
        role: "owner",
        isActive: true,
      },
    ])
    .onConflictDoNothing();

  // 7. Mock Initial Orders
  const order1Id = "ORD-101";
  const order2Id = "ORD-102";
  const order3Id = "ORD-103";

  await db
    .insert(orders)
    .values([
      {
        id: order1Id,
        orderNumber: 101,
        restaurantId,
        customerName: "Mariana Souza",
        customerPhone: "5511977776666",
        customerAddress: "Rua Bela Cintra, 890, Apto 54",
        deliveryType: "delivery",
        paymentMethod: "pix",
        paymentStatus: "paid",
        subtotal: 32.4,
        deliveryFee: 5.5,
        discount: 0.0,
        total: 37.9,
        status: "preparing",
        notes: "Por favor não colocar cebola no bife. Caprichar na farofa!",
        origin: "pwa",
        createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      },
      {
        id: order2Id,
        orderNumber: 102,
        restaurantId,
        customerName: "Lucas Ribeiro",
        customerPhone: "5511966665555",
        customerAddress: "Rua Haddock Lobo, 400",
        deliveryType: "delivery",
        paymentMethod: "card_delivery",
        paymentStatus: "pending",
        subtotal: 34.0,
        deliveryFee: 5.5,
        discount: 0.0,
        total: 39.5,
        status: "pending",
        notes: "Levar maquininha com aproximação",
        origin: "whatsapp_ai",
        createdAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
      },
      {
        id: order3Id,
        orderNumber: 103,
        restaurantId,
        customerName: "Renata Fagundes",
        customerPhone: "5511955554444",
        customerAddress: "Balcão (Retirada)",
        deliveryType: "pickup",
        paymentMethod: "pix",
        paymentStatus: "paid",
        subtotal: 25.9,
        deliveryFee: 0.0,
        discount: 0.0,
        total: 25.9,
        status: "ready",
        notes: "Cliente vem buscar no balcão às 12:45",
        origin: "pwa",
        createdAt: new Date(Date.now() - 1000 * 60 * 32).toISOString(),
      },
    ])
    .onConflictDoNothing();

  await db
    .insert(orderItems)
    .values([
      {
        id: "item_ord_101_1",
        orderId: order1Id,
        productId: prodMarmitaM,
        productName: "Marmitex Executivo (Média)",
        unitPrice: 25.9,
        quantity: 1,
        totalPrice: 25.9,
        customizationsJson: JSON.stringify([
          "Bife de Alcatra Acebolado",
          "Arroz Branco Soltinho",
          "Feijão Carioca Caseiro",
          "Purê de Batatas Cremoso",
          "Farofa Crocante de Bacon",
          "Vinagrete Especial da Casa",
        ]),
        notes: "Sem cebola no bife",
      },
      {
        id: "item_ord_101_2",
        orderId: order1Id,
        productId: prodCocaLata,
        productName: "Coca-Cola Original 350ml",
        unitPrice: 6.5,
        quantity: 1,
        totalPrice: 6.5,
      },
      {
        id: "item_ord_102_1",
        orderId: order2Id,
        productId: prodParmegiana,
        productName: "Filé de Frango à Parmegiana",
        unitPrice: 34.0,
        quantity: 1,
        totalPrice: 34.0,
        notes: "Molho extra por favor",
      },
      {
        id: "item_ord_103_1",
        orderId: order3Id,
        productId: prodMarmitaM,
        productName: "Marmitex Executivo (Média)",
        unitPrice: 25.9,
        quantity: 1,
        totalPrice: 25.9,
        customizationsJson: JSON.stringify([
          "Filé de Frango Grelhado",
          "Arroz Branco Soltinho",
          "Feijão Carioca Caseiro",
          "Purê de Batatas Cremoso",
          "Salada Verde",
        ]),
      },
    ])
    .onConflictDoNothing();

  // 8. Default System Users (Admin & Operador)
  await db
    .insert(users)
    .values([
      {
        id: "usr_admin_luciano",
        restaurantId,
        name: "Luciano (Administrador)",
        email: "admin@vorti.com.br",
        phone: "5511987654321",
        role: "admin",
        pin: "1234",
        isActive: true,
      },
      {
        id: "usr_operador_mateus",
        restaurantId,
        name: "Mateus (Operador Delivery)",
        email: "operador@vorti.com.br",
        phone: "5511999998888",
        role: "operador",
        pin: "4321",
        isActive: true,
      },
    ])
    .onConflictDoNothing();

  // 9. Initial Open Cash Register (Turno Aberto)
  await db
    .insert(cashRegisters)
    .values({
      id: "cx_turno_hoje",
      restaurantId,
      openedBy: "Luciano (Administrador)",
      openedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(), // Aberto há 3 horas
      initialAmount: 100.0, // Fundo de troco inicial
      totalSales: 103.3,
      totalPix: 63.8,
      totalCard: 39.5,
      totalCash: 0.0,
      totalInflow: 0.0,
      totalOutflow: 0.0,
      expectedCash: 100.0,
      status: "open",
      notes: "Turno da manhã aberto com troco padrão de R$ 100.",
    })
    .onConflictDoNothing();

  console.log("Database seeded successfully with restaurant, categories, dishes, options, mock orders, users and cash register!");
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
