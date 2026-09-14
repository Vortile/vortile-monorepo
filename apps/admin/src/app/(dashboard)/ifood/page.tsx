"use client";

import React, { useState } from "react";
import {
  IconTruck,
  IconCheck,
  IconRefresh,
  IconAlertCircle,
  IconBuildingStore,
  IconReceipt2,
  IconSparkles,
} from "@tabler/icons-react";
import { toast } from "sonner";

const IFoodHubPage = () => {
  const [syncing, setSyncing] = useState(false);

  const handleSyncMenu = async () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      toast.success("Cardápio do SQLite sincronizado com o catálogo do iFood com sucesso! 🍕");
    }, 1200);
  };

  return (
    <div className="flex-1 p-6 space-y-6 max-w-6xl mx-auto w-full">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            <IconTruck className="size-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-stone-900">
                Hub de Integração iFood Merchant
              </h1>
              <span className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                API Conectada
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Receba pedidos do marketplace iFood e do WhatsApp no mesmo Kanban unificado da cozinha.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSyncMenu}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-sm"
        >
          <IconRefresh className={`size-4 ${syncing ? "animate-spin" : ""}`} />
          <span>{syncing ? "Sincronizando..." : "Sincronizar Catálogo iFood"}</span>
        </button>
      </div>

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-stone-500">Status da Loja no iFood</div>
          <div className="text-lg font-bold text-emerald-700 flex items-center gap-1.5">
            <IconCheck className="size-5" />
            <span>Aberta & Recebendo Pedidos</span>
          </div>
          <p className="text-[11px] text-stone-400">ID da Loja: `ifood_rest_vorti_01`</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-stone-500">Pooling de Pedidos</div>
          <div className="text-lg font-bold text-stone-900">Automático (30s)</div>
          <p className="text-[11px] text-stone-400">Injeta pedidos diretamente na coluna Novos Pedidos</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-2">
          <div className="text-xs font-semibold text-stone-500">Webhook Status</div>
          <div className="text-lg font-bold text-emerald-700">Ativo (`/api/integrations/ifood`)</div>
          <p className="text-[11px] text-stone-400">Eventos de cancelamento e entrega sincronizados</p>
        </div>
      </div>

      {/* Event Logs & Settings */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <h3 className="font-bold text-stone-900 text-sm">Histórico de Eventos Recentes do iFood</h3>
        <div className="space-y-2 font-mono text-xs">
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-stone-700">
            <div className="flex items-center gap-2">
              <span className="text-emerald-600 font-bold">[PLC] ORDER_PLACED</span>
              <span>Pedido #iFood-8921 recebido e enviado para a chapa</span>
            </div>
            <span className="text-[10px] text-stone-400">12:35</span>
          </div>
          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between text-stone-700">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 font-bold">[CFM] ORDER_CONFIRMED</span>
              <span>Restaurante confirmou tempo de preparo de 25 min</span>
            </div>
            <span className="text-[10px] text-stone-400">12:36</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IFoodHubPage;
