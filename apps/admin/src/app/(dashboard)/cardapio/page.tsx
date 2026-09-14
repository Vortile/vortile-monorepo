"use client";

import React, { useState, useEffect } from "react";
import {
  IconToolsKitchen2,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconRefresh,
  IconSparkles,
  IconPlus,
  IconSearch,
  IconCloudUpload,
  IconFlame,
} from "@tabler/icons-react";
import { toast } from "sonner";

const formatBRL = (val: number | undefined | null) => {
  if (val == null || isNaN(val)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);
};

const MenuManagementPage = () => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [filterMode, setFilterMode] = useState<"all" | "available" | "paused">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSyncingIfood, setIsSyncingIfood] = useState(false);
  const [lastIfoodSync, setLastIfoodSync] = useState<string | null>(null);

  const fetchMenu = async () => {
    try {
      const res = await fetch("/api/menu?slug=vorti-marmitex");
      const data = await res.json();
      if (data.categories) {
        setCategories(data.categories);
      }
    } catch (e) {
      toast.error("Erro ao carregar cardápio");
    } finally {
      setLoading(false);
    }
  };

  const syncIfoodCatalog = async () => {
    setIsSyncingIfood(true);
    try {
      const res = await fetch("/api/integrations/ifood?action=catalog");
      const data = await res.json();
      if (data.success) {
        setLastIfoodSync(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
        toast.success(`Cardápio iFood sincronizado com sucesso! ${data.catalog.itemCount} itens atualizados.`);
      } else {
        toast.error("Erro ao sincronizar com iFood");
      }
    } catch {
      toast.error("Falha ao sincronizar com iFood");
    } finally {
      setIsSyncingIfood(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const toggleProduct = async (productId: string, currentStatus: boolean, name: string) => {
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentStatus ? `pausa o produto ${name}` : `ativa o produto ${name}`,
          senderRole: "kitchen",
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.reply);
        fetchMenu();
      }
    } catch (e) {
      toast.error("Erro ao atualizar produto");
    }
  };

  const toggleOption = async (optionName: string, currentStatus: boolean) => {
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentStatus ? `acabou o ${optionName}` : `voltou o ${optionName}`,
          senderRole: "kitchen",
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.reply);
        fetchMenu();
      }
    } catch (e) {
      toast.error("Erro ao atualizar guarnição");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  const allProducts = categories.flatMap((c) => c.products || []);
  const totalProducts = allProducts.length;
  const availableProducts = allProducts.filter((p) => p.isAvailable).length;
  const pausedProducts = totalProducts - availableProducts;

  const allOptions = allProducts.flatMap((p) =>
    (p.optionGroups || []).flatMap((g: any) => g.options || [])
  );
  const pausedOptions = allOptions.filter((o) => !o.isAvailable).length;

  const filteredCategories = categories
    .map((category) => {
      const filteredProds = category.products.filter((product: any) => {
        const matchesQuery =
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
        if (!matchesQuery) return false;
        if (filterMode === "available") return product.isAvailable;
        if (filterMode === "paused") return !product.isAvailable;
        return true;
      });
      return { ...category, products: filteredProds };
    })
    .filter((category) => category.products.length > 0);

  return (
    <div className="flex-1 p-6 space-y-6 max-w-6xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-stone-900">
              Gestão do Cardápio & Disponibilidade
            </h1>
            <span className="bg-orange-50 text-orange-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-orange-200 flex items-center gap-1">
              <IconSparkles className="size-3 text-orange-600" />
              Sincronizado com WhatsApp MCP
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Controle pratos, carnes e guarnições. Qualquer alteração aqui ou feita pela equipe no WhatsApp via IA reflete instantaneamente no Cardápio Web dos clientes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={syncIfoodCatalog}
            disabled={isSyncingIfood}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-all disabled:opacity-50"
            title="Exporta o cardápio e status de estoque diretamente para a API do iFood Merchant"
          >
            <IconCloudUpload className={`size-4 ${isSyncingIfood ? "animate-bounce" : ""}`} />
            <span>{isSyncingIfood ? "Sincronizando..." : "Sincronizar iFood"}</span>
          </button>

          <button
            onClick={fetchMenu}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-all"
          >
            <IconRefresh className="size-4" />
            <span>Recarregar</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Total de Pratos</div>
          <div className="text-2xl font-extrabold text-stone-900 mt-1 tabular-nums">{totalProducts}</div>
          <div className="text-[11px] text-stone-500 mt-0.5">{categories.length} categorias ativas</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Pratos Disponíveis</div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1 tabular-nums">{availableProducts}</div>
          <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">Visíveis no Cardápio Web</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Itens Esgotados</div>
          <div className="text-2xl font-extrabold text-rose-600 mt-1 tabular-nums">{pausedProducts}</div>
          <div className="text-[11px] text-rose-700 mt-0.5 font-medium">
            {pausedOptions} guarnição(ões) pausada(s)
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-2xs">
          <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">iFood Merchant V2</div>
          <div className="text-sm font-bold text-stone-900 mt-1 flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Conectado & Sincronizado
          </div>
          <div className="text-[11px] text-stone-500 mt-1.5">
            {lastIfoodSync ? `Última sinc: ${lastIfoodSync}` : "Sincronização em tempo real"}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-stone-50 p-3 rounded-2xl border border-stone-200/80">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setFilterMode("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === "all"
                ? "bg-stone-900 text-white shadow-xs"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-100"
            }`}
          >
            Todos ({totalProducts})
          </button>
          <button
            onClick={() => setFilterMode("available")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === "available"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-100"
            }`}
          >
            Disponíveis ({availableProducts})
          </button>
          <button
            onClick={() => setFilterMode("paused")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterMode === "paused"
                ? "bg-rose-600 text-white shadow-xs"
                : "bg-white text-stone-600 border border-stone-200 hover:bg-stone-100"
            }`}
          >
            Pausados / Esgotados ({pausedProducts})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
          <input
            type="text"
            placeholder="Buscar prato ou guarnição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-stone-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Categories & Items */}
      <div className="space-y-8">
        {filteredCategories.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-stone-200">
            <IconAlertCircle className="size-8 text-stone-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-stone-700">Nenhum item encontrado</p>
            <p className="text-xs text-stone-400 mt-1">Tente ajustar seus filtros ou busca.</p>
          </div>
        ) : (
          filteredCategories.map((category) => (
          <div key={category.id} className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h2 className="text-lg font-bold text-stone-900">{category.name}</h2>
                {category.description && (
                  <p className="text-xs text-stone-500">{category.description}</p>
                )}
              </div>
              <span className="text-xs font-semibold text-stone-400 bg-stone-50 px-2.5 py-1 rounded-lg">
                {category.products.length} itens
              </span>
            </div>

            {/* Products Table */}
            <div className="space-y-3">
              {category.products.map((product: any) => (
                <div
                  key={product.id}
                  className="rounded-xl border border-stone-200/80 p-4 hover:border-stone-300 transition-all bg-stone-50/40"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="size-14 rounded-xl object-cover border border-stone-200"
                        />
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-stone-900 text-sm">{product.name}</h3>
                          {product.badge && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                              {product.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 line-clamp-1 mt-0.5">{product.description}</p>
                        <div className="text-xs font-bold text-stone-800 mt-1 tabular-nums">
                          {formatBRL(product.price)}
                        </div>
                      </div>
                    </div>

                    {/* Availability Switch */}
                    <div className="flex items-center gap-3 self-end md:self-center">
                      <div className="text-right">
                        <div
                          className={`text-xs font-bold ${
                            product.isAvailable ? "text-emerald-700" : "text-rose-600"
                          }`}
                        >
                          {product.isAvailable ? "Disponível" : "Pausado no Cardápio"}
                        </div>
                        {!product.isAvailable && product.pauseReason && (
                          <div className="text-[11px] text-stone-400">
                            Motivo: {product.pauseReason}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => toggleProduct(product.id, product.isAvailable, product.name)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          product.isAvailable
                            ? "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
                            : "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-xs"
                        }`}
                      >
                        {product.isAvailable ? "Pausar Item" : "Reativar Item"}
                      </button>
                    </div>
                  </div>

                  {/* Option Groups (Guarnições / Ingredientes da Marmita) */}
                  {product.optionGroups && product.optionGroups.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-stone-200/60 space-y-3 bg-white p-3 rounded-xl">
                      <div className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                        <IconToolsKitchen2 className="size-3.5 text-orange-600" />
                        <span>Guarnições & Opções de Montagem (Pausáveis individualmente pela cozinha)</span>
                      </div>

                      {product.optionGroups.map((group: any) => (
                        <div key={group.id} className="space-y-1.5">
                          <div className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider">
                            {group.name}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {group.options.map((opt: any) => (
                              <button
                                key={opt.id}
                                onClick={() => toggleOption(opt.name, opt.isAvailable)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                                  opt.isAvailable
                                    ? "bg-stone-50 border-stone-200 text-stone-800 hover:bg-stone-100"
                                    : "bg-rose-50 border-rose-300 text-rose-700 line-through opacity-75"
                                }`}
                                title={opt.isAvailable ? "Clique para pausar" : "Clique para reativar"}
                              >
                                <span>{opt.name}</span>
                                {opt.priceDelta > 0 && (
                                  <span className="text-[10px] text-stone-400 tabular-nums">
                                    (+{formatBRL(opt.priceDelta)})
                                  </span>
                                )}
                                {!opt.isAvailable && (
                                  <span className="text-[10px] font-bold text-rose-600 no-underline">
                                    (Esgotado)
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )))
      }
      </div>
    </div>
  );
};

export default MenuManagementPage;
