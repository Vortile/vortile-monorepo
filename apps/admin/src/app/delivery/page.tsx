"use client";

import React, { useState, useEffect } from "react";
import {
  IconSearch,
  IconShoppingBag,
  IconClock,
  IconMotorbike,
  IconStar,
  IconCheck,
  IconX,
  IconPlus,
  IconMinus,
  IconMapPin,
  IconBrandWhatsapp,
  IconSparkles,
  IconChefHat,
  IconArrowRight,
  IconAlertCircle,
  IconQrcode,
  IconCreditCard,
  IconCash,
  IconCopy,
} from "@tabler/icons-react";
import { toast } from "sonner";

const formatBRL = (val: number | undefined | null) => {
  if (val == null || isNaN(val)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);
};

interface Option {
  id: string;
  name: string;
  description?: string;
  priceDelta: number;
  isAvailable: boolean;
  pauseReason?: string;
}

interface OptionGroup {
  id: string;
  name: string;
  description?: string;
  minSelected: number;
  maxSelected: number;
  isRequired: boolean;
  options: Option[];
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  promotionalPrice?: number;
  imageUrl?: string;
  isAvailable: boolean;
  pauseReason?: string;
  badge?: string;
  hasCustomizations: boolean;
  optionGroups?: OptionGroup[];
}

interface Category {
  id: string;
  name: string;
  description?: string;
  products: Product[];
}

interface CartItem {
  cartId: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
  customizations: string[];
  notes?: string;
}

const DeliveryMenuPage = () => {
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State for Customizing Dishes
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string[]>>({});
  const [itemNotes, setItemNotes] = useState("");
  const [addonDrink, setAddonDrink] = useState<string | null>(null);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [needsCutlery, setNeedsCutlery] = useState(false);

  // Checkout State
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card_delivery" | "cash">("pix");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerCep, setCustomerCep] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [loadingCep, setLoadingCep] = useState(false);
  const [cashChangeFor, setCashChangeFor] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);
  const [copiedPix, setCopiedPix] = useState(false);

  // Brazilian CEP Auto-lookup via ViaCEP
  const handleCepLookup = async (cepInput: string) => {
    setCustomerCep(cepInput);
    const cleanCep = cepInput.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      setLoadingCep(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (data.erro) {
          toast.error("CEP não encontrado.");
        } else {
          setCustomerAddress(`${data.logradouro}, nº , ${data.bairro} - ${data.localidade}/${data.uf}`);
          toast.success("Endereço preenchido via CEP!");
        }
      } catch (err) {
        console.warn("ViaCEP lookup error:", err);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  // Copy PIX Code to clipboard
  const handleCopyPix = (pixCode: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(pixCode);
      setCopiedPix(true);
      toast.success("Código PIX copiado com sucesso!");
      setTimeout(() => setCopiedPix(false), 3000);
    }
  };

  // Load Menu from API
  const loadMenu = async () => {
    try {
      const res = await fetch("/api/menu?slug=vorti-marmitex");
      const data = await res.json();
      if (data.restaurant) {
        setRestaurant(data.restaurant);
        setCategories(data.categories || []);
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao carregar cardápio.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMenu();
    // Auto-refresh menu every 15 seconds to reflect Gemini kitchen pauses live
    const interval = setInterval(loadMenu, 15000);
    return () => clearInterval(interval);
  }, []);

  // Open Customization Modal
  const openProductModal = (product: Product) => {
    if (!product.isAvailable) {
      toast.error("Este prato está temporariamente esgotado na cozinha.");
      return;
    }

    setSelectedProduct(product);
    setModalQuantity(1);
    setItemNotes("");
    setAddonDrink(null);

    // Initialize default options
    const initialSelected: Record<string, string[]> = {};
    if (product.optionGroups) {
      product.optionGroups.forEach((group) => {
        // Pick first available option if required single-choice
        if (group.isRequired && group.maxSelected === 1) {
          const firstAvailable = group.options.find((o) => o.isAvailable);
          if (firstAvailable) {
            initialSelected[group.id] = [firstAvailable.id];
          }
        } else {
          initialSelected[group.id] = [];
        }
      });
    }
    setSelectedOptions(initialSelected);
  };

  // Toggle option choice
  const handleOptionToggle = (groupId: string, option: Option, group: OptionGroup) => {
    if (!option.isAvailable) {
      toast.error(`'${option.name}' está esgotado na cozinha hoje.`);
      return;
    }

    const current = selectedOptions[groupId] || [];

    if (group.maxSelected === 1) {
      // Radio mode
      setSelectedOptions({
        ...selectedOptions,
        [groupId]: [option.id],
      });
    } else {
      // Multi-select checkbox mode
      if (current.includes(option.id)) {
        setSelectedOptions({
          ...selectedOptions,
          [groupId]: current.filter((id) => id !== option.id),
        });
      } else {
        if (current.length >= group.maxSelected) {
          toast.warning(`Você pode escolher no máximo ${group.maxSelected} opções.`);
          return;
        }
        setSelectedOptions({
          ...selectedOptions,
          [groupId]: [...current, option.id],
        });
      }
    }
  };

  // Calculate Modal Total Price
  const calculateModalPrice = () => {
    if (!selectedProduct) return 0;
    const base = selectedProduct.promotionalPrice || selectedProduct.price;
    let deltas = 0;

    if (selectedProduct.optionGroups) {
      selectedProduct.optionGroups.forEach((group) => {
        const pickedIds = selectedOptions[group.id] || [];
        group.options.forEach((opt) => {
          if (pickedIds.includes(opt.id)) {
            deltas += opt.priceDelta;
          }
        });
      });
    }

    return (base + deltas) * modalQuantity;
  };

  // Add customized item to cart
  const handleAddToCart = () => {
    if (!selectedProduct) return;

    // Validate required groups
    if (selectedProduct.optionGroups) {
      for (const grp of selectedProduct.optionGroups) {
        const picked = selectedOptions[grp.id] || [];
        if (grp.isRequired && picked.length < grp.minSelected) {
          toast.warning(`Por favor selecione a opção obrigatória: ${grp.name}`);
          return;
        }
      }
    }

    // Build human-readable customizations list
    const customizationsList: string[] = [];
    if (selectedProduct.optionGroups) {
      selectedProduct.optionGroups.forEach((group) => {
        const picked = selectedOptions[group.id] || [];
        group.options.forEach((opt) => {
          if (picked.includes(opt.id)) {
            customizationsList.push(
              opt.priceDelta > 0 ? `${opt.name} (+${formatBRL(opt.priceDelta)})` : opt.name
            );
          }
        });
      });
    }

    const total = calculateModalPrice();
    const unit = total / modalQuantity;

    const newItem: CartItem = {
      cartId: `cart_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      unitPrice: unit,
      quantity: modalQuantity,
      totalPrice: total,
      customizations: customizationsList,
      notes: itemNotes.trim() || undefined,
    };

    const newCartItems = [...cart, newItem];

    if (addonDrink === "prod_coca_lata") {
      newCartItems.push({
        cartId: `cart_drink_${Date.now()}`,
        productId: "prod_coca_lata",
        productName: "Coca-Cola Original 350ml",
        unitPrice: 6.5,
        quantity: 1,
        totalPrice: 6.5,
        customizations: ["Combo Marmita 🥤"],
      });
    } else if (addonDrink === "prod_suco_laranja") {
      newCartItems.push({
        cartId: `cart_drink_${Date.now()}`,
        productId: "prod_suco_laranja",
        productName: "Suco Natural de Laranja 500ml",
        unitPrice: 9.9,
        quantity: 1,
        totalPrice: 9.9,
        customizations: ["Combo Marmita 🍊"],
      });
    }

    setCart(newCartItems);
    setSelectedProduct(null);
    setAddonDrink(null);
    toast.success("Adicionado à sacola! 🛍️");
  };

  const removeFromCart = (cartId: string) => {
    setCart(cart.filter((i) => i.cartId !== cartId));
  };

  const cartSubtotal = cart.reduce((acc, item) => acc + item.totalPrice, 0);
  const deliveryFee = deliveryType === "delivery" ? (restaurant?.deliveryFee || 5.5) : 0;
  const cartTotal = cartSubtotal + deliveryFee;

  // Submit Order
  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerPhone) {
      toast.warning("Preencha seu nome e WhatsApp.");
      return;
    }
    if (deliveryType === "delivery" && !customerAddress) {
      toast.warning("Preencha seu endereço de entrega.");
      return;
    }

    const minVal = restaurant?.minOrderValue || 20.0;
    if (deliveryType === "delivery" && cartSubtotal < minVal) {
      toast.warning(`O valor mínimo para entrega é ${formatBRL(minVal)}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant?.id || "rest_vorti_marmitex",
          customerName,
          customerPhone,
          customerAddress,
          deliveryType,
          paymentMethod,
          cashChangeFor: paymentMethod === "cash" ? cashChangeFor : null,
          items: cart,
          notes: [orderNotes.trim(), needsCutlery ? "Enviar talheres descartáveis 🍴" : "Sem talheres descartáveis 🌱"].filter(Boolean).join(" • "),
        }),
      });

      const data = await res.json();
      if (data.success && data.order) {
        setConfirmedOrder(data.order);
        setCart([]);
        setIsCartOpen(false);
        toast.success(`Pedido #${data.order.orderNumber} realizado com sucesso! 🎉`);
      } else {
        toast.error(data.error || "Erro ao enviar pedido.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro na comunicação com o servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#FAF9F5]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
          <p className="text-sm font-medium text-stone-600">Carregando cardápio no capricho...</p>
        </div>
      </div>
    );
  }

  // Filter products by search & category
  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      products: cat.products.filter((p) => {
        const matchesCat = activeCategory === "all" || cat.id === activeCategory;
        const matchesSearch =
          !searchQuery ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesSearch;
      }),
    }))
    .filter((cat) => cat.products.length > 0);

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-900 pb-32 selection:bg-orange-500 selection:text-white">
      {/* Top Banner & Header */}
      <header className="relative bg-white border-b border-stone-200">
        <div className="h-44 md:h-60 w-full relative overflow-hidden bg-stone-800">
          <img
            src={restaurant?.bannerUrl || "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=1200&auto=format&fit=crop&q=80"}
            alt="Banner"
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

          {/* Quick link to Dashboard / Staff */}
          <a
            href="/"
            className="absolute top-4 right-4 z-10 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1.5 text-xs font-semibold text-white hover:bg-black/80 transition-all border border-white/20"
          >
            <IconChefHat className="size-3.5 text-orange-400" />
            <span>Painel da Cozinha</span>
          </a>
        </div>

        {/* Restaurant Info Card */}
        <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-10">
          <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/60 p-5 md:p-6 border border-stone-100 flex flex-col md:flex-row gap-5 items-start md:items-center">
            <img
              src={restaurant?.logoUrl || "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80"}
              alt="Logo"
              className="size-20 md:size-24 rounded-2xl object-cover border-4 border-white shadow-md -mt-10 md:mt-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-stone-900 break-words leading-tight">
                  {restaurant?.name || "Vorti Marmitex & Grelhados"}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 shrink-0">
                  <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  Aberto Agora
                </span>
              </div>
              <p className="text-sm text-stone-600 mb-3 max-w-xl">
                {restaurant?.description}
              </p>

              {/* Delivery info pills */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-stone-600">
                <div className="flex items-center gap-1 bg-stone-100 px-2.5 py-1 rounded-lg">
                  <IconMotorbike className="size-3.5 text-orange-600" />
                  <span>{restaurant?.avgDeliveryTime || "30-45 min"}</span>
                  <span className="text-stone-300">•</span>
                  <span className="text-stone-900 font-semibold tabular-nums">
                    Taxa {formatBRL(restaurant?.deliveryFee ?? 5.50)}
                  </span>
                </div>
                <div className="flex items-center gap-1 bg-stone-100 px-2.5 py-1 rounded-lg">
                  <IconMapPin className="size-3.5 text-orange-600" />
                  <span className="tabular-nums">Pedido mín: {formatBRL(restaurant?.minOrderAmount ?? 20.00)}</span>
                </div>
                <div className="flex items-center gap-1 bg-stone-100 px-2.5 py-1 rounded-lg text-amber-700">
                  <IconStar className="size-3.5 fill-amber-500 text-amber-500" />
                  <span className="font-bold">4.9</span>
                  <span className="text-stone-400">(420+)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Category Tabs */}
        <div className="max-w-4xl mx-auto px-4 mt-6 mb-2">
          {/* Search Box */}
          <div className="relative mb-4">
            <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar no cardápio de hoje (ex: parmegiana, bife, purê...)"
              className="w-full rounded-xl bg-stone-100 pl-10 pr-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 border border-transparent focus:border-orange-500 transition-all"
            />
          </div>

          {/* Sticky Category Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setActiveCategory("all")}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                activeCategory === "all"
                  ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                  : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
              }`}
            >
              🍽️ Todos os Itens
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                  activeCategory === cat.id
                    ? "bg-orange-600 text-white shadow-md shadow-orange-600/20"
                    : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content: Dishes by Category */}
      <main className="max-w-4xl mx-auto px-4 mt-6 space-y-8">
        {filteredCategories.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-8">
            <IconSearch className="size-10 text-stone-300 mx-auto mb-3" />
            <p className="text-base font-semibold text-stone-800">Nenhum item encontrado</p>
            <p className="text-sm text-stone-500 mt-1">Tente buscar por outro termo ou categoria.</p>
          </div>
        ) : (
          filteredCategories.map((cat) => (
            <section key={cat.id} className="scroll-mt-20">
              <div className="mb-4">
                <h2 className="text-xl font-bold tracking-tight text-stone-900 flex items-center gap-2">
                  <span>{cat.name}</span>
                </h2>
                {cat.description && (
                  <p className="text-xs text-stone-500 mt-0.5">{cat.description}</p>
                )}
              </div>

              {/* Product Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {cat.products.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => openProductModal(prod)}
                    className={`group relative bg-white rounded-2xl p-3.5 sm:p-4 border transition-all cursor-pointer flex justify-between gap-3 overflow-hidden ${
                      !prod.isAvailable
                        ? "opacity-60 bg-stone-50 border-stone-200"
                        : "border-stone-200/80 hover:border-orange-500/50 hover:shadow-lg hover:shadow-stone-200/50"
                    }`}
                  >
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        {prod.badge && (
                          <span className="inline-block rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-bold text-orange-800 uppercase tracking-wide mb-1.5">
                            {prod.badge}
                          </span>
                        )}
                        <h3 className="font-bold text-stone-900 text-sm sm:text-base group-hover:text-orange-600 transition-colors truncate">
                          {prod.name}
                        </h3>
                        <p className="text-xs text-stone-500 line-clamp-2 mt-1 leading-relaxed">
                          {prod.description}
                        </p>
                      </div>

                      <div className="mt-3 flex items-baseline gap-2 flex-wrap">
                        {prod.promotionalPrice ? (
                          <>
                            <span className="text-sm sm:text-base font-extrabold text-orange-600 tabular-nums">
                              {formatBRL(prod.promotionalPrice)}
                            </span>
                            <span className="text-xs text-stone-400 line-through tabular-nums">
                              {formatBRL(prod.price)}
                            </span>
                          </>
                        ) : (
                          <span className="text-sm sm:text-base font-extrabold text-stone-900 tabular-nums">
                            {formatBRL(prod.price)}
                          </span>
                        )}

                        {!prod.isAvailable && (
                          <span className="ml-auto text-[10px] sm:text-[11px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded-md border border-rose-200">
                            {prod.pauseReason || "Esgotado"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dish Image */}
                    <div className="relative size-20 sm:size-24 md:size-28 shrink-0 rounded-xl overflow-hidden bg-stone-100 border border-stone-100 self-center">
                      {prod.imageUrl ? (
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-300">
                          <IconChefHat className="size-8" />
                        </div>
                      )}

                      {prod.isAvailable && (
                        <div className="absolute bottom-1.5 right-1.5 size-7 rounded-lg bg-white/95 shadow-md flex items-center justify-center text-stone-800 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                          <IconPlus className="size-4" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 inset-x-4 max-w-lg mx-auto z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-2xl shadow-xl shadow-orange-600/30 flex items-center justify-between transition-all transform hover:-translate-y-0.5 font-bold"
          >
            <div className="flex items-center gap-3">
              <div className="size-8 rounded-xl bg-orange-700/60 flex items-center justify-center">
                <IconShoppingBag className="size-5 text-white" />
              </div>
              <div className="text-left leading-tight">
                <div className="text-sm font-extrabold">Ver Sacola</div>
                <div className="text-xs text-orange-100 font-normal">
                  {cart.reduce((a, b) => a + b.quantity, 0)} item(s) selecionado(s)
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-extrabold tabular-nums">{formatBRL(cartTotal)}</span>
              <IconArrowRight className="size-4 text-orange-200" />
            </div>
          </button>
        </div>
      )}

      {/* Modal: Customizing Dish (Monte sua Marmita) */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/60 backdrop-blur-xs p-0 md:p-4">
          <div className="w-full md:max-w-xl bg-white rounded-t-3xl md:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom duration-200">
            {/* Modal Header with Product Image */}
            <div className="relative h-44 shrink-0 bg-stone-900">
              {selectedProduct.imageUrl && (
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.name}
                  className="w-full h-full object-cover opacity-90"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 size-8 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <IconX className="size-5" />
              </button>
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <h3 className="text-xl font-bold">{selectedProduct.name}</h3>
                <p className="text-xs text-stone-200 line-clamp-1">{selectedProduct.description}</p>
              </div>
            </div>

            {/* Modal Content: Options & Guarnições */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {selectedProduct.optionGroups && selectedProduct.optionGroups.length > 0 ? (
                selectedProduct.optionGroups.map((group) => {
                  const picked = selectedOptions[group.id] || [];
                  const isSatisfied = group.isRequired ? picked.length >= group.minSelected : true;

                  return (
                    <div key={group.id} className="border-b border-stone-100 pb-5">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                            <span>{group.name}</span>
                            {group.isRequired && (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                                Obrigatório
                              </span>
                            )}
                          </h4>
                          {group.description && (
                            <p className="text-xs text-stone-500">{group.description}</p>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-stone-400">
                          {picked.length}/{group.maxSelected}
                        </span>
                      </div>

                      {/* Options List */}
                      <div className="space-y-2 mt-3">
                        {group.options.map((opt) => {
                          const isSelected = picked.includes(opt.id);

                          return (
                            <div
                              key={opt.id}
                              onClick={() => handleOptionToggle(group.id, opt, group)}
                              className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                                !opt.isAvailable
                                  ? "opacity-50 bg-stone-50 border-stone-200 cursor-not-allowed"
                                  : isSelected
                                  ? "border-orange-500 bg-orange-50/50"
                                  : "border-stone-200 hover:border-stone-300"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  className={`size-5 rounded-md flex items-center justify-center border transition-all ${
                                    isSelected
                                      ? "bg-orange-600 border-orange-600 text-white"
                                      : "border-stone-300 bg-white"
                                  }`}
                                >
                                  {isSelected && <IconCheck className="size-3.5 stroke-[3]" />}
                                </div>
                                <div>
                                  <div className="text-xs font-semibold text-stone-900">
                                    {opt.name}
                                  </div>
                                  {opt.description && (
                                    <div className="text-[11px] text-stone-500">
                                      {opt.description}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="text-xs font-bold text-stone-700">
                                {!opt.isAvailable ? (
                                  <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                                    Esgotado
                                  </span>
                                ) : opt.priceDelta > 0 ? (
                                  <span className="tabular-nums">+ {formatBRL(opt.priceDelta)}</span>
                                ) : (
                                  <span className="text-stone-400 font-normal">Grátis</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-stone-500">Prato sem opções adicionais.</p>
              )}

              {/* Chef's Pairing Suggestion: Bebida Gelada */}
              {selectedProduct.hasCustomizations && (
                <div className="bg-orange-50/60 border border-orange-200/80 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <IconSparkles className="size-4 text-orange-600" />
                      <span className="text-xs font-bold text-orange-950">Sugestão do Chef: Bebida Gelada</span>
                    </div>
                    <span className="text-[10px] bg-orange-100 text-orange-800 font-bold px-2 py-0.5 rounded-full">
                      Combo Perfeito
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setAddonDrink(addonDrink === "prod_coca_lata" ? null : "prod_coca_lata")}
                      className={`p-2.5 rounded-xl text-left border transition-all flex items-center justify-between ${
                        addonDrink === "prod_coca_lata"
                          ? "bg-white border-orange-600 shadow-xs ring-2 ring-orange-500/20"
                          : "bg-white/80 border-stone-200 hover:bg-white text-stone-700"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-stone-900">Coca-Cola 350ml</div>
                        <div className="text-[11px] text-orange-600 font-bold tabular-nums">+ R$ 6,50</div>
                      </div>
                      <div
                        className={`size-5 rounded-full flex items-center justify-center border text-xs ${
                          addonDrink === "prod_coca_lata"
                            ? "bg-orange-600 border-orange-600 text-white font-bold"
                            : "border-stone-300 text-stone-400"
                        }`}
                      >
                        {addonDrink === "prod_coca_lata" ? "✓" : "+"}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAddonDrink(addonDrink === "prod_suco_laranja" ? null : "prod_suco_laranja")}
                      className={`p-2.5 rounded-xl text-left border transition-all flex items-center justify-between ${
                        addonDrink === "prod_suco_laranja"
                          ? "bg-white border-orange-600 shadow-xs ring-2 ring-orange-500/20"
                          : "bg-white/80 border-stone-200 hover:bg-white text-stone-700"
                      }`}
                    >
                      <div>
                        <div className="text-xs font-bold text-stone-900">Suco Laranja 500ml</div>
                        <div className="text-[11px] text-orange-600 font-bold tabular-nums">+ R$ 9,90</div>
                      </div>
                      <div
                        className={`size-5 rounded-full flex items-center justify-center border text-xs ${
                          addonDrink === "prod_suco_laranja"
                            ? "bg-orange-600 border-orange-600 text-white font-bold"
                            : "border-stone-300 text-stone-400"
                        }`}
                      >
                        {addonDrink === "prod_suco_laranja" ? "✓" : "+"}
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Special Instructions */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  Alguma observação? (Opcional)
                </label>
                <textarea
                  value={itemNotes}
                  onChange={(e) => setItemNotes(e.target.value)}
                  placeholder="Ex: Não colocar cebola no bife, caprichar no feijão..."
                  rows={2}
                  className="w-full text-xs p-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between gap-3">
              {/* Quantity Selector */}
              <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-xl px-2 py-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                  className="size-7 flex items-center justify-center text-stone-600 hover:text-stone-900 disabled:opacity-30 cursor-pointer"
                  disabled={modalQuantity <= 1}
                >
                  <IconMinus className="size-4" />
                </button>
                <span className="w-6 text-center text-sm font-bold text-stone-900 tabular-nums">
                  {modalQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => setModalQuantity(modalQuantity + 1)}
                  className="size-7 flex items-center justify-center text-stone-600 hover:text-stone-900 cursor-pointer"
                >
                  <IconPlus className="size-4" />
                </button>
              </div>

              {/* Add Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-orange-600/20 text-xs md:text-sm flex items-center justify-between transition-all cursor-pointer"
              >
                <span>Adicionar à Sacola</span>
                <span className="tabular-nums">{formatBRL(calculateModalPrice())}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cart & Checkout Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/60 backdrop-blur-xs">
          <div className="w-full md:max-w-md h-full bg-white flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <IconShoppingBag className="size-5 text-orange-600" />
                <h3 className="font-bold text-stone-900 text-base">Sua Sacola</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="size-8 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center hover:bg-stone-300"
              >
                <IconX className="size-4" />
              </button>
            </div>

            {/* Minimum Order Value Bar */}
            {restaurant?.minOrderValue && restaurant.minOrderValue > 0 && (
              <div className="mx-4 mt-3 p-3 rounded-xl border border-stone-200 text-xs transition-all bg-stone-50/70 shadow-2xs">
                {cartSubtotal >= restaurant.minOrderValue ? (
                  <div className="flex items-center gap-2 text-emerald-700 font-bold">
                    <span className="size-2 rounded-full bg-emerald-500" />
                    <span>✓ Pedido mínimo de {formatBRL(restaurant.minOrderValue)} atingido!</span>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-amber-800 font-medium">
                      <span>Faltam {formatBRL(restaurant.minOrderValue - cartSubtotal)} para o mínimo</span>
                      <span className="text-[11px] text-stone-500">Mínimo: {formatBRL(restaurant.minOrderValue)}</span>
                    </div>
                    <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-orange-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (cartSubtotal / restaurant.minOrderValue) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.map((item) => (
                <div
                  key={item.cartId}
                  className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 space-y-2"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="text-xs font-bold text-stone-900">
                        {item.quantity}x {item.productName}
                      </div>
                      {item.customizations.length > 0 && (
                        <div className="text-[11px] text-stone-500 mt-1 space-y-0.5">
                          {item.customizations.map((c, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <span className="size-1 rounded-full bg-orange-500" />
                              <span>{c}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      {item.notes && (
                        <div className="text-[11px] text-amber-700 italic mt-1">
                          Obs: {item.notes}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-stone-900 tabular-nums">
                        {formatBRL(item.totalPrice)}
                      </div>
                      <button
                        onClick={() => removeFromCart(item.cartId)}
                        className="text-[11px] text-rose-600 hover:underline mt-1"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Checkout Form */}
              <form onSubmit={handleCheckout} className="space-y-4 pt-4 border-t border-stone-200">
                {/* Delivery Type */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    Modo de Entrega
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryType("delivery")}
                      className={`p-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                        deliveryType === "delivery"
                          ? "border-orange-500 bg-orange-50 text-orange-900"
                          : "border-stone-200 text-stone-600 bg-white"
                      }`}
                    >
                      <IconMotorbike className="size-4" />
                      Entrega ({formatBRL(restaurant?.deliveryFee ?? 5.50)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType("pickup")}
                      className={`p-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                        deliveryType === "pickup"
                          ? "border-orange-500 bg-orange-50 text-orange-900"
                          : "border-stone-200 text-stone-600 bg-white"
                      }`}
                    >
                      <IconChefHat className="size-4" />
                      Retirada (Grátis)
                    </button>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      Seu Nome *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ex: Carlos Oliveira"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 mb-1">
                      WhatsApp para Acompanhamento *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Ex: (11) 98765-4321"
                      className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>

                  {deliveryType === "delivery" && (
                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-stone-700">
                            CEP (Opcional - busca automática)
                          </label>
                          {loadingCep && (
                            <span className="text-[10px] text-orange-600 font-semibold animate-pulse">
                              Consultando CEP...
                            </span>
                          )}
                        </div>
                        <input
                          type="text"
                          maxLength={9}
                          value={customerCep}
                          onChange={(e) => handleCepLookup(e.target.value)}
                          placeholder="Ex: 01311-000"
                          className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-700 mb-1">
                          Endereço Completo de Entrega *
                        </label>
                        <input
                          type="text"
                          required
                          value={customerAddress}
                          onChange={(e) => setCustomerAddress(e.target.value)}
                          placeholder="Rua, Número, Bairro e Complemento"
                          className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    Forma de Pagamento
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("pix")}
                      className={`p-2 rounded-xl text-[11px] font-bold border flex flex-col items-center gap-1 transition-all ${
                        paymentMethod === "pix"
                          ? "border-emerald-600 bg-emerald-50 text-emerald-900"
                          : "border-stone-200 text-stone-600 bg-white"
                      }`}
                    >
                      <IconQrcode className="size-4 text-emerald-600" />
                      PIX
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("card_delivery")}
                      className={`p-2 rounded-xl text-[11px] font-bold border flex flex-col items-center gap-1 transition-all ${
                        paymentMethod === "card_delivery"
                          ? "border-orange-500 bg-orange-50 text-orange-900"
                          : "border-stone-200 text-stone-600 bg-white"
                      }`}
                    >
                      <IconCreditCard className="size-4 text-orange-600" />
                      Cartão Entrega
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cash")}
                      className={`p-2 rounded-xl text-[11px] font-bold border flex flex-col items-center gap-1 transition-all ${
                        paymentMethod === "cash"
                          ? "border-stone-800 bg-stone-100 text-stone-900"
                          : "border-stone-200 text-stone-600 bg-white"
                      }`}
                    >
                      <IconCash className="size-4 text-stone-700" />
                      Dinheiro
                    </button>
                  </div>

                  {paymentMethod === "cash" && (
                    <div className="mt-2 space-y-2">
                      <input
                        type="text"
                        value={cashChangeFor}
                        onChange={(e) => setCashChangeFor(e.target.value)}
                        placeholder="Precisa de troco para quanto? (Ex: R$ 50,00)"
                        className="w-full text-xs p-2 rounded-xl border border-stone-200 bg-stone-50"
                      />
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-stone-400 font-medium">Atalhos:</span>
                        <button
                          type="button"
                          onClick={() => setCashChangeFor("Não precisa de troco (valor exato)")}
                          className="text-[10px] px-2 py-0.5 rounded-lg border border-stone-200 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold transition-all"
                        >
                          Valor Exato
                        </button>
                        <button
                          type="button"
                          onClick={() => setCashChangeFor("R$ 50,00")}
                          className="text-[10px] px-2 py-0.5 rounded-lg border border-stone-200 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold transition-all"
                        >
                          R$ 50
                        </button>
                        <button
                          type="button"
                          onClick={() => setCashChangeFor("R$ 100,00")}
                          className="text-[10px] px-2 py-0.5 rounded-lg border border-stone-200 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold transition-all"
                        >
                          R$ 100
                        </button>
                      </div>
                    </div>
                  )}

                  {paymentMethod === "pix" && (
                    <div className="mt-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 flex items-center justify-between">
                      <div>
                        <span className="font-bold">Chave PIX:</span> {restaurant?.pixKey || "pix@vorti.com.br"}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(restaurant?.pixKey || "pix@vorti.com.br");
                          toast.success("Chave PIX copiada!");
                        }}
                        className="px-2 py-1 bg-emerald-600 text-white rounded-md font-bold text-[10px]"
                      >
                        Copiar
                      </button>
                    </div>
                  )}
                </div>

                {/* Precisa de Talheres descartáveis */}
                <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🍴</span>
                    <div>
                      <div className="text-xs font-bold text-stone-800">Precisa de talheres descartáveis?</div>
                      <div className="text-[10px] text-stone-500">Ajude a diminuir o plástico de uso único</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNeedsCutlery(!needsCutlery)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      needsCutlery
                        ? "bg-orange-600 text-white shadow-xs"
                        : "bg-white border border-stone-300 text-stone-600 hover:bg-stone-100"
                    }`}
                  >
                    {needsCutlery ? "Sim, enviar" : "Não preciso"}
                  </button>
                </div>

                {/* Subtotals */}
                <div className="space-y-1.5 pt-3 text-xs text-stone-600 border-t border-stone-200">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{formatBRL(cartSubtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taxa de Entrega</span>
                    <span className="tabular-nums">{deliveryType === "pickup" ? "Grátis" : formatBRL(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between text-base font-extrabold text-stone-900 pt-1 border-t border-stone-100">
                    <span>Total</span>
                    <span className="text-orange-600 tabular-nums">{formatBRL(cartTotal)}</span>
                  </div>
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-orange-600/20 text-sm flex items-center justify-center gap-2 transition-all mt-4"
                >
                  {isSubmitting ? (
                    <span>Registrando Pedido...</span>
                  ) : (
                    <>
                      <span>Confirmar Pedido</span>
                      <span className="tabular-nums">• {formatBRL(cartTotal)}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirmed Order Tracking Modal */}
      {confirmedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-stone-100 animate-in zoom-in-95 duration-200">
            <div className="size-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <IconCheck className="size-6 stroke-[3]" />
            </div>

            <div className="text-center">
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                Pedido #{confirmedOrder.orderNumber}
              </span>
              <h3 className="text-xl font-extrabold text-stone-900 mt-2">
                Pedido Enviado para a Cozinha!
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                A equipe já recebeu seu pedido. Nosso assistente inteligente vai acompanhar o preparo.
              </p>
            </div>

            {/* Tracking Status Bar */}
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3 text-xs">
              <div className="flex items-center justify-between font-bold text-stone-800">
                <span>Status Atual:</span>
                <span className="text-orange-600 uppercase tracking-wide">
                  {confirmedOrder.status === "pending" ? "Recebido / Na Fila" : confirmedOrder.status}
                </span>
              </div>
              <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                <div className="bg-orange-500 h-full w-1/3 rounded-full animate-pulse" />
              </div>
              <div className="text-[11px] text-stone-500 flex items-center gap-1.5">
                <IconClock className="size-3.5 text-stone-400" />
                <span>Previsão de entrega: 35-45 minutos</span>
              </div>
            </div>

            {/* PIX Payment Details Box */}
            {confirmedOrder.paymentMethod === "pix" && (
              <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                    <IconQrcode className="size-4 text-emerald-600" />
                    <span>Pagamento via PIX</span>
                  </div>
                  <span className="font-extrabold text-emerald-800 tabular-nums">
                    {formatBRL(confirmedOrder.total)}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-snug">
                  Copie a chave abaixo e realize a transferência pelo aplicativo do seu banco:
                </p>
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-emerald-200">
                  <span className="flex-1 font-mono text-[11px] text-stone-700 truncate select-all">
                    {restaurant?.pixKey || "pix@vorti.com.br"}
                  </span>
                  <button
                    onClick={() => handleCopyPix(restaurant?.pixKey || "pix@vorti.com.br")}
                    className="shrink-0 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] flex items-center gap-1 transition-all"
                  >
                    {copiedPix ? (
                      <>
                        <IconCheck className="size-3" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <IconCopy className="size-3" />
                        <span>Copiar Chave</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {confirmedOrder.paymentMethod === "card_delivery" && (
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600 flex items-center gap-2">
                <IconCreditCard className="size-4 text-stone-600 shrink-0" />
                <span>O motoboy levará a maquininha de cartão no momento da entrega.</span>
              </div>
            )}

            {confirmedOrder.paymentMethod === "cash" && (
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-600 flex items-center gap-2">
                <IconCash className="size-4 text-stone-600 shrink-0" />
                <span>Pagamento em dinheiro na entrega{confirmedOrder.cashChangeFor ? ` (Troco para ${formatBRL(confirmedOrder.cashChangeFor)})` : ""}.</span>
              </div>
            )}

            <div className="flex flex-col gap-2">
              <a
                href={`https://wa.me/5511999990000?text=${encodeURIComponent(
                  `Olá! Acabei de fazer o pedido #${confirmedOrder.orderNumber} (${confirmedOrder.customerName}). Gostaria de acompanhar!`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs text-center flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
              >
                <IconBrandWhatsapp className="size-4" />
                <span>Acompanhar pelo WhatsApp</span>
              </a>
              <a
                href="/"
                className="w-full bg-stone-900 text-white font-bold py-2.5 px-4 rounded-xl text-xs text-center hover:bg-stone-800 transition-colors"
              >
                Ver no Painel da Cozinha (Demo)
              </a>
              <button
                onClick={() => setConfirmedOrder(null)}
                className="w-full text-stone-500 hover:text-stone-700 text-xs font-semibold py-2"
              >
                Fazer outro pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryMenuPage;
