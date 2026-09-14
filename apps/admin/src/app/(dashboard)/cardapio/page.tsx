"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconSparkles,
  IconPlus,
  IconSearch,
  IconEdit,
  IconTrash,
  IconFolders,
  IconEye,
} from "@tabler/icons-react";
import { toast } from "sonner";
import Link from "next/link";

interface OptionItem {
  id: string;
  name: string;
  priceDelta: number;
  isAvailable: boolean;
  pauseReason?: string;
}

interface OptionGroupItem {
  id: string;
  name: string;
  minSelected: number;
  maxSelected: number;
  isRequired: boolean;
  options: OptionItem[];
}

interface ProductItem {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  promotionalPrice?: number;
  imageUrl?: string;
  badge?: string;
  isAvailable: boolean;
  pauseReason?: string;
  hasCustomizations: boolean;
  optionGroups?: OptionGroupItem[];
}

interface CategoryItem {
  id: string;
  name: string;
  description?: string;
  products: ProductItem[];
}

const formatBRL = (val: number | undefined | null) => {
  if (val == null || isNaN(val)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);
};

const MenuManagementPage = () => {
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState("all");

  // Modals state
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [showAddOptionModal, setShowAddOptionModal] = useState(false);

  // Selected item for edit or sub-add
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  // Add/Edit Product Form state
  const [prodCategoryId, setProdCategoryId] = useState("");
  const [prodName, setProdName] = useState("");
  const [prodDescription, setProdDescription] = useState("");
  const [prodPrice, setProdPrice] = useState("");
  const [prodPromoPrice, setProdPromoPrice] = useState("");
  const [prodImageUrl, setProdImageUrl] = useState("");
  const [prodBadge, setProdBadge] = useState("");
  const [prodHasCustom, _setProdHasCustom] = useState(false);

  // Category form state
  const [catName, setCatName] = useState("");
  const [catDescription, setCatDescription] = useState("");

  // Option form state
  const [optName, setOptName] = useState("");
  const [optPriceDelta, setOptPriceDelta] = useState("0.00");

  const fetchMenu = useCallback(async () => {
    try {
      const res = await fetch("/api/menu?slug=vorti-marmitex");
      const data = await res.json();
      if (data.categories) {
        setCategories(data.categories);
        if (!prodCategoryId && data.categories.length > 0) {
          setProdCategoryId(data.categories[0].id);
        }
      }
    } catch {
      toast.error("Erro ao carregar cardápio");
    } finally {
      setLoading(false);
    }
  }, [prodCategoryId]);

  useEffect(() => {
    fetchMenu();
  }, [fetchMenu]);

  // Quick toggle product availability
  const toggleProduct = async (product: ProductItem) => {
    const newStatus = !product.isAvailable;
    try {
      const res = await fetch("/api/menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "product",
          id: product.id,
          data: {
            isAvailable: newStatus,
            pauseReason: newStatus ? null : "Pausado no painel da cozinha",
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(newStatus ? `"${product.name}" reativado!` : `"${product.name}" pausado no cardápio.`);
        fetchMenu();
      }
    } catch {
      toast.error("Erro ao atualizar disponibilidade");
    }
  };

  // Quick toggle option availability
  const toggleOption = async (option: OptionItem) => {
    const newStatus = !option.isAvailable;
    try {
      const res = await fetch("/api/menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "option",
          id: option.id,
          data: {
            isAvailable: newStatus,
            pauseReason: newStatus ? null : "Esgotado na cozinha",
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(newStatus ? `"${option.name}" liberado!` : `"${option.name}" marcado como esgotado.`);
        fetchMenu();
      }
    } catch {
      toast.error("Erro ao atualizar guarnição");
    }
  };

  // Create Product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "product",
          data: {
            categoryId: prodCategoryId,
            name: prodName,
            description: prodDescription,
            price: Number(prodPrice),
            promotionalPrice: prodPromoPrice ? Number(prodPromoPrice) : null,
            imageUrl: prodImageUrl || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
            badge: prodBadge || null,
            hasCustomizations: prodHasCustom,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Prato "${prodName}" adicionado ao cardápio! 🎉`);
        setShowAddProductModal(false);
        setProdName("");
        setProdDescription("");
        setProdPrice("");
        setProdPromoPrice("");
        setProdImageUrl("");
        setProdBadge("");
        fetchMenu();
      } else {
        toast.error(data.error || "Erro ao criar prato");
      }
    } catch {
      toast.error("Erro na comunicação");
    }
  };

  // Save Edit Product
  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const res = await fetch("/api/menu", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "product",
          id: editingProduct.id,
          data: {
            name: prodName,
            description: prodDescription,
            price: Number(prodPrice),
            promotionalPrice: prodPromoPrice ? Number(prodPromoPrice) : null,
            imageUrl: prodImageUrl,
            badge: prodBadge || null,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Prato "${prodName}" atualizado com sucesso!`);
        setShowEditProductModal(false);
        setEditingProduct(null);
        fetchMenu();
      } else {
        toast.error(data.error || "Erro ao salvar alterações");
      }
    } catch {
      toast.error("Erro na comunicação");
    }
  };

  // Delete Product
  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${productName}" do cardápio?`)) return;

    try {
      const res = await fetch(`/api/menu?entity=product&id=${productId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success(`Prato "${productName}" removido.`);
        fetchMenu();
      } else {
        toast.error("Erro ao excluir prato");
      }
    } catch {
      toast.error("Erro na comunicação");
    }
  };

  // Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "category",
          data: {
            name: catName,
            description: catDescription,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Categoria "${catName}" criada com sucesso!`);
        setShowAddCategoryModal(false);
        setCatName("");
        setCatDescription("");
        fetchMenu();
      } else {
        toast.error(data.error || "Erro ao criar categoria");
      }
    } catch {
      toast.error("Erro na comunicação");
    }
  };

  // Create Option
  const handleCreateOption = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "option",
          data: {
            groupId: selectedGroupId,
            name: optName,
            priceDelta: Number(optPriceDelta) || 0,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Opção "${optName}" adicionada!`);
        setShowAddOptionModal(false);
        setOptName("");
        setOptPriceDelta("0.00");
        fetchMenu();
      } else {
        toast.error(data.error || "Erro ao adicionar opção");
      }
    } catch {
      toast.error("Erro na comunicação");
    }
  };

  const openEditModal = (product: ProductItem) => {
    setEditingProduct(product);
    setProdName(product.name);
    setProdDescription(product.description || "");
    setProdPrice(String(product.price));
    setProdPromoPrice(product.promotionalPrice ? String(product.promotionalPrice) : "");
    setProdImageUrl(product.imageUrl || "");
    setProdBadge(product.badge || "");
    setShowEditProductModal(true);
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  // Filtered categories and products
  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      products: cat.products.filter((p) => {
        const matchesCat = activeCategoryFilter === "all" || cat.id === activeCategoryFilter;
        const matchesQuery =
          !searchQuery ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesCat && matchesQuery;
      }),
    }))
    .filter((cat) => cat.products.length > 0 || activeCategoryFilter === cat.id);

  return (
    <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-black text-stone-900 tracking-tight">
              Gestão do Cardápio & Estoque
            </h1>
            <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
              <IconSparkles className="size-3 text-emerald-600" />
              Sincronizado via SQLite & WhatsApp
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Crie novos pratos, altere preços, gerencie fotos e pause guarnições instantaneamente com reflexo no Cardápio Web e na IA.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddCategoryModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-all"
          >
            <IconFolders className="size-4" />
            <span>Nova Categoria</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setProdName("");
              setProdDescription("");
              setProdPrice("");
              setProdPromoPrice("");
              setProdImageUrl("");
              setProdBadge("");
              setShowAddProductModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-sm shadow-orange-600/20 transition-all"
          >
            <IconPlus className="size-4" />
            <span>Novo Prato / Item</span>
          </button>

          <Link
            href="/delivery"
            target="_blank"
            className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600"
            title="Ver Cardápio do Cliente"
          >
            <IconEye className="size-4" />
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar prato, carne ou guarnição..."
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-stone-50 border border-stone-200 focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setActiveCategoryFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
              activeCategoryFilter === "all"
                ? "bg-stone-900 text-white"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            Todas as Categorias
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActiveCategoryFilter(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-all ${
                activeCategoryFilter === c.id
                  ? "bg-orange-600 text-white shadow-xs"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Categories & Dishes List */}
      <div className="space-y-6">
        {filteredCategories.map((category) => (
          <div key={category.id} className="bg-white rounded-3xl border border-stone-200 p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h2 className="text-lg font-black text-stone-900">{category.name}</h2>
                {category.description && (
                  <p className="text-xs text-stone-500">{category.description}</p>
                )}
              </div>
              <span className="text-xs font-semibold text-stone-400 bg-stone-50 px-2.5 py-1 rounded-lg">
                {category.products.length} itens
              </span>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.products.map((product) => (
                <div
                  key={product.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                    product.isAvailable
                      ? "bg-white border-stone-200 hover:border-stone-300 shadow-2xs"
                      : "bg-stone-50 border-stone-200 opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="size-16 rounded-xl object-cover border border-stone-200 shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="font-bold text-stone-900 text-sm truncate">{product.name}</h3>
                          {product.badge && (
                            <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">
                              {product.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-stone-500 line-clamp-2 mt-0.5">{product.description}</p>
                        <div className="mt-1 flex items-baseline gap-2">
                          <span className="text-sm font-black text-stone-900 tabular-nums">
                            {formatBRL(product.price)}
                          </span>
                          {product.promotionalPrice && (
                            <span className="text-xs text-orange-600 font-bold">
                              Promo: {formatBRL(product.promotionalPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => openEditModal(product)}
                        className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-lg transition-colors"
                        title="Editar Prato"
                      >
                        <IconEdit className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Excluir Prato"
                      >
                        <IconTrash className="size-4" />
                      </button>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                    <div>
                      <span
                        className={`inline-flex items-center gap-1 font-bold ${
                          product.isAvailable ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        <span
                          className={`size-1.5 rounded-full ${
                            product.isAvailable ? "bg-emerald-600" : "bg-rose-600"
                          }`}
                        />
                        {product.isAvailable ? "Disponível no Cardápio" : "Pausado / Esgotado"}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleProduct(product)}
                      className={`px-3 py-1 rounded-xl font-bold transition-all ${
                        product.isAvailable
                          ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      }`}
                    >
                      {product.isAvailable ? "Pausar Item" : "Reativar Item"}
                    </button>
                  </div>

                  {/* Option Groups (Guarnições / Ingredientes) */}
                  {product.optionGroups && product.optionGroups.length > 0 && (
                    <div className="pt-3 border-t border-stone-100 space-y-2.5">
                      <div className="text-[11px] font-bold text-stone-600 uppercase tracking-wider flex items-center justify-between">
                        <span>Guarnições e Opções de Montagem:</span>
                      </div>

                      {product.optionGroups.map((group) => (
                        <div key={group.id} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs font-semibold text-stone-700">
                            <span>{group.name}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedGroupId(group.id);
                                setShowAddOptionModal(true);
                              }}
                              className="text-[11px] font-bold text-orange-600 hover:underline flex items-center gap-0.5"
                            >
                              <IconPlus className="size-3" />
                              <span>Opção</span>
                            </button>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {group.options.map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => toggleOption(opt)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
                                  opt.isAvailable
                                    ? "bg-stone-50 border-stone-200 text-stone-800 hover:bg-stone-100"
                                    : "bg-rose-50 border-rose-300 text-rose-700 line-through opacity-70"
                                }`}
                                title={opt.isAvailable ? "Clique para pausar" : "Clique para reativar"}
                              >
                                <span>{opt.name}</span>
                                {opt.priceDelta > 0 && (
                                  <span className="text-[10px] text-stone-400">
                                    (+{formatBRL(opt.priceDelta)})
                                  </span>
                                )}
                                {!opt.isAvailable && (
                                  <span className="text-[9px] font-bold text-rose-600 no-underline">
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
        ))}
      </div>

      {/* Modal: Add New Product */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-stone-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-base">Adicionar Novo Prato ao Cardápio</h3>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block font-bold text-stone-800 mb-1">Nome do Prato *</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="Ex: Frango Grelhado com Legumes"
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Categoria *</label>
                  <select
                    required
                    value={prodCategoryId}
                    onChange={(e) => setProdCategoryId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Preço (R$) *</label>
                  <input
                    type="number"
                    step="0.10"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    placeholder="28.90"
                    className="w-full p-2.5 rounded-xl border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Preço Promocional (Opcional)</label>
                  <input
                    type="number"
                    step="0.10"
                    value={prodPromoPrice}
                    onChange={(e) => setProdPromoPrice(e.target.value)}
                    placeholder="Ex: 24.90"
                    className="w-full p-2.5 rounded-xl border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Selo / Destaque</label>
                  <input
                    type="text"
                    value={prodBadge}
                    onChange={(e) => setProdBadge(e.target.value)}
                    placeholder="Ex: Mais Pedido ⭐, Chef"
                    className="w-full p-2.5 rounded-xl border border-stone-300"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-stone-800 mb-1">Descrição Apetitosa</label>
                  <textarea
                    rows={2}
                    value={prodDescription}
                    onChange={(e) => setProdDescription(e.target.value)}
                    placeholder="Ex: Peito de frango suculento, arroz soltinho e feijão carioca bem temperado."
                    className="w-full p-2.5 rounded-xl border border-stone-300"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-stone-800 mb-1">URL da Imagem</label>
                  <input
                    type="url"
                    value={prodImageUrl}
                    onChange={(e) => setProdImageUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full p-2.5 rounded-xl border border-stone-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md shadow-orange-600/20"
              >
                Adicionar Prato ao Cardápio
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Product */}
      {showEditProductModal && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-stone-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-base">Editar Prato: {editingProduct.name}</h3>
              <button
                type="button"
                onClick={() => setShowEditProductModal(false)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">Nome do Prato *</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Preço Normal (R$) *</label>
                  <input
                    type="number"
                    step="0.10"
                    required
                    value={prodPrice}
                    onChange={(e) => setProdPrice(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300"
                  />
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">Preço Promocional (R$)</label>
                  <input
                    type="number"
                    step="0.10"
                    value={prodPromoPrice}
                    onChange={(e) => setProdPromoPrice(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Selo / Destaque</label>
                <input
                  type="text"
                  value={prodBadge}
                  onChange={(e) => setProdBadge(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">URL da Imagem</label>
                <input
                  type="url"
                  value={prodImageUrl}
                  onChange={(e) => setProdImageUrl(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md shadow-orange-600/20"
              >
                Salvar Alterações
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Category */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-stone-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-base">Nova Categoria de Pratos</h3>
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">Nome da Categoria *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Ex: Pratos Executivos, Sucos Naturais"
                  className="w-full p-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Descrição</label>
                <input
                  type="text"
                  value={catDescription}
                  onChange={(e) => setCatDescription(e.target.value)}
                  placeholder="Ex: Acompanha arroz, feijão e salada do dia"
                  className="w-full p-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md shadow-orange-600/20"
              >
                Criar Categoria
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Option to Group */}
      {showAddOptionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-stone-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-base">Adicionar Nova Guarnição / Opção</h3>
              <button
                type="button"
                onClick={() => setShowAddOptionModal(false)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOption} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">Nome da Opção *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={optName}
                  onChange={(e) => setOptName(e.target.value)}
                  placeholder="Ex: Farofa de Banana da Terra"
                  className="w-full p-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">Adicional de Preço (R$)</label>
                <input
                  type="number"
                  step="0.50"
                  value={optPriceDelta}
                  onChange={(e) => setOptPriceDelta(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-2.5 rounded-xl border border-stone-300"
                />
                <p className="text-[10px] text-stone-400 mt-1">Coloque 0 se for grátis na montagem da marmita.</p>
              </div>

              <button
                type="submit"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md shadow-orange-600/20"
              >
                Adicionar Opção
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagementPage;
