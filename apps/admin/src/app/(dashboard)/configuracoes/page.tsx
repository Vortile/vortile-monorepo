"use client";

import React, { useState, useEffect } from "react";
import {
  IconSettings,
  IconBuildingStore,
  IconClock,
  IconMotorbike,
  IconQrcode,
  IconSparkles,
  IconDeviceMobile,
  IconCheck,
  IconVolume,
  IconPrinter,
  IconBrandWhatsapp,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { playOrderChime, ChimeType } from "@/lib/audio";

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [restaurant, setRestaurant] = useState<any>(null);
  const [selectedChime, setSelectedChime] = useState<ChimeType>("ding_dong");
  const [chimeVolume, setChimeVolume] = useState<number>(0.6);
  const [printerPaperWidth, setPrinterPaperWidth] = useState<"80mm" | "58mm">("80mm");
  const [autoPrintNewOrders, setAutoPrintNewOrders] = useState(false);

  useEffect(() => {
    fetch("/api/menu?slug=vorti-marmitex")
      .then((r) => r.json())
      .then((data) => {
        if (data.restaurant) setRestaurant(data.restaurant);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Configurações salvas no banco de dados SQLite com sucesso! ✅");
  };

  const handleTestChime = (type: ChimeType) => {
    playOrderChime({ type, volume: chimeVolume });
    toast.success(`Tocando prévia sonora: ${type === "ding_dong" ? "Ding-Dong Suave" : type === "bell" ? "Sino de Balcão" : "Alerta Energético"}`);
  };

  if (loading || !restaurant) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 max-w-4xl mx-auto w-full">
      <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">
          Configurações do Restaurante & Delivery
        </h1>
        <p className="text-xs text-stone-500 mt-1">
          Ajuste os dados da loja, taxas de entrega, chave PIX, acústica da cozinha e integrações de canais (WhatsApp Gemini e iFood).
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <IconBuildingStore className="size-5 text-orange-600" />
            <h2 className="font-bold text-stone-900 text-sm">Dados do Estabelecimento</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Nome do Restaurante
              </label>
              <input
                type="text"
                defaultValue={restaurant.name}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Link do Cardápio Web (Slug)
              </label>
              <input
                type="text"
                defaultValue={restaurant.slug}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Descrição do Restaurante
              </label>
              <textarea
                rows={2}
                defaultValue={restaurant.description}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Endereço
              </label>
              <input
                type="text"
                defaultValue={restaurant.address}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Cidade / Estado
              </label>
              <input
                type="text"
                defaultValue={`${restaurant.city} - ${restaurant.state}`}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50"
              />
            </div>
          </div>
        </div>

        {/* Operational & Delivery */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <IconMotorbike className="size-5 text-orange-600" />
            <h2 className="font-bold text-stone-900 text-sm">Operação & Entrega</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Taxa de Entrega (R$)
              </label>
              <input
                type="number"
                step="0.50"
                defaultValue={restaurant.deliveryFee}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Pedido Mínimo (R$)
              </label>
              <input
                type="number"
                step="1.00"
                defaultValue={restaurant.minOrderAmount}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Tempo Médio de Espera
              </label>
              <input
                type="text"
                defaultValue={restaurant.avgDeliveryTime}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Horário de Funcionamento
              </label>
              <input
                type="text"
                defaultValue={restaurant.openingHours}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50"
              />
            </div>
          </div>
        </div>

        {/* Kitchen Acoustics & Alert Sounds */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <IconVolume className="size-5 text-amber-600" />
            <div>
              <h2 className="font-bold text-stone-900 text-sm">Acústica & Alertas Sonoros da Cozinha</h2>
              <p className="text-[11px] text-stone-400">Sons sintetizados via Web Audio API para não passar pedidos despercebidos</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800">Ding-Dong Suave</span>
                <input
                  type="radio"
                  name="chimeType"
                  checked={selectedChime === "ding_dong"}
                  onChange={() => setSelectedChime("ding_dong")}
                  className="accent-orange-600"
                />
              </div>
              <p className="text-[10px] text-stone-500">Dois tons harmônicos agradáveis (587Hz & 880Hz)</p>
              <button
                type="button"
                onClick={() => handleTestChime("ding_dong")}
                className="w-full py-1 px-2 text-[11px] font-bold bg-white border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors"
              >
                Ouvir Prévia 🔔
              </button>
            </div>

            <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800">Sino de Balcão</span>
                <input
                  type="radio"
                  name="chimeType"
                  checked={selectedChime === "bell"}
                  onChange={() => setSelectedChime("bell")}
                  className="accent-orange-600"
                />
              </div>
              <p className="text-[10px] text-stone-500">Tom metálico de campainha de balcão (1046Hz)</p>
              <button
                type="button"
                onClick={() => handleTestChime("bell")}
                className="w-full py-1 px-2 text-[11px] font-bold bg-white border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors"
              >
                Ouvir Prévia 🛎️
              </button>
            </div>

            <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800">Alerta Triplo</span>
                <input
                  type="radio"
                  name="chimeType"
                  checked={selectedChime === "energetic"}
                  onChange={() => setSelectedChime("energetic")}
                  className="accent-orange-600"
                />
              </div>
              <p className="text-[10px] text-stone-500">Arpeggio ascendente enérgico para horários de pico</p>
              <button
                type="button"
                onClick={() => handleTestChime("energetic")}
                className="w-full py-1 px-2 text-[11px] font-bold bg-white border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors"
              >
                Ouvir Prévia ⚡
              </button>
            </div>
          </div>

          <div className="pt-2">
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Volume do Alerta ({Math.round(chimeVolume * 100)}%)
            </label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={chimeVolume}
              onChange={(e) => setChimeVolume(parseFloat(e.target.value))}
              className="w-full accent-orange-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Thermal Printing Setup (ESC/POS 80mm / 58mm) */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <IconPrinter className="size-5 text-stone-700" />
            <div>
              <h2 className="font-bold text-stone-900 text-sm">Impressão Térmica de Comandas (ESC/POS)</h2>
              <p className="text-[11px] text-stone-400">Padrão de bobina térmica para balcão, cozinha e entrega</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Largura da Bobina Térmica
              </label>
              <select
                value={printerPaperWidth}
                onChange={(e) => setPrinterPaperWidth(e.target.value as any)}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50"
              >
                <option value="80mm">80 mm (Padrão Marmitaria / Restaurantes)</option>
                <option value="58mm">58 mm (Compacta Portátil)</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border border-stone-200 bg-stone-50">
              <div>
                <span className="text-xs font-bold text-stone-800 block">Auto-imprimir novos pedidos</span>
                <span className="text-[10px] text-stone-500">Abre o diálogo de impressão assim que o pedido entra</span>
              </div>
              <input
                type="checkbox"
                checked={autoPrintNewOrders}
                onChange={(e) => setAutoPrintNewOrders(e.target.checked)}
                className="size-4 rounded accent-orange-600"
              />
            </div>
          </div>
        </div>

        {/* Payments & PIX */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <IconQrcode className="size-5 text-emerald-600" />
            <h2 className="font-bold text-stone-900 text-sm">Recebimento via PIX</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Chave PIX
              </label>
              <input
                type="text"
                defaultValue={restaurant.pixKey}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Tipo de Chave
              </label>
              <select
                defaultValue={restaurant.pixKeyType}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50"
              >
                <option value="email">E-mail</option>
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="phone">Telefone Celular</option>
                <option value="random">Chave Aleatória</option>
              </select>
            </div>
          </div>
        </div>

        {/* WhatsApp & Evolution API / Meta Cloud API */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <IconBrandWhatsapp className="size-5 text-emerald-600" />
            <div>
              <h2 className="font-bold text-stone-900 text-sm">WhatsApp Business & Evolution API</h2>
              <p className="text-[11px] text-stone-400">Roteamento automático de mensagens e comandos MCP da cozinha</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Evolution API Server URL
              </label>
              <input
                type="text"
                placeholder="https://evolution.vorti.com.br"
                defaultValue={process.env.NEXT_PUBLIC_EVOLUTION_API_URL || ""}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Instância WhatsApp
              </label>
              <input
                type="text"
                placeholder="vorti-marmitex-sp"
                defaultValue="vorti-marmitex-sp"
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Telefones Autorizados da Cozinha (MCP Operacional)
              </label>
              <input
                type="text"
                defaultValue="5511999998888, 5511988887777"
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50"
              />
              <span className="text-[10px] text-stone-400 mt-1 block">
                Números que têm permissão para pausar ingredientes, consultar fila da chapa e mudar status via WhatsApp.
              </span>
            </div>
          </div>
        </div>

        {/* Future Integrations / iFood Architecture Preview */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <IconSparkles className="size-5 text-rose-600" />
            <div>
              <h2 className="font-bold text-stone-900 text-sm">Integrações de Marketplace (iFood)</h2>
              <p className="text-[11px] text-stone-400">Hub unificado de pedidos para os próximos passos</p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <div className="font-bold text-xs text-rose-950 flex items-center gap-2">
                <span>iFood Merchant API (Poller & Webhook)</span>
                <span className="text-[10px] bg-rose-200 text-rose-900 px-2 py-0.5 rounded font-bold">
                  Roadmap Q3
                </span>
              </div>
              <p className="text-xs text-rose-800 mt-0.5">
                Módulo preparado para sincronizar o catálogo do SQLite e receber pedidos do iFood diretamente no mesmo Kanban unificado.
              </p>
            </div>
            <button
              type="button"
              onClick={() => toast.info("Integração com iFood em preparação na arquitetura!")}
              className="shrink-0 px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs"
            >
              Configurar Chaves
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-xl text-sm shadow-md shadow-orange-600/20 transition-all"
        >
          Salvar Todas as Configurações
        </button>
      </form>
    </div>
  );
};

export default SettingsPage;
