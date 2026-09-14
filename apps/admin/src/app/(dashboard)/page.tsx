"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  IconMotorbike,
  IconVolume,
  IconVolumeOff,
  IconRefresh,
  IconPrinter,
  IconBrandWhatsapp,
  IconX,
  IconMapPin,
  IconSparkles,
  IconMicrophone,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { playOrderChime } from "@/lib/audio";
import { ThermalReceiptModal } from "@/components/kitchen/thermal-receipt-modal";
import { KitchenCopilotModal } from "@/components/kitchen/kitchen-copilot-modal";

const formatBRL = (val: number | undefined | null) => {
  if (val == null || isNaN(val)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);
};

interface OrderItem {
  id: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customizationsJson?: string;
  notes?: string;
}

interface Order {
  id: string;
  orderNumber: number;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  deliveryType: string;
  paymentMethod: string;
  paymentStatus: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: "pending" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "cancelled";
  notes?: string;
  origin: string;
  createdAt: string;
  items?: OrderItem[];
}

const LiveOrdersDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copilotOpen, setCopilotOpen] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [dispatchOrder, setDispatchOrder] = useState<Order | null>(null);
  const [mobileColumn, setMobileColumn] = useState<"pending" | "preparing" | "ready">("pending");
  const [autoStartAudio, setAutoStartAudio] = useState(false);
  const lastSpacePressRef = useRef<number>(0);
  const previousOrderIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  // Global hotkey: 2 quick Space presses triggers Copilot & starts microphone audio
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if (isInput) return;

      if (e.code === "Space") {
        const now = Date.now();
        if (now - lastSpacePressRef.current <= 350) {
          e.preventDefault();
          setAutoStartAudio(true);
          setCopilotOpen(true);
          lastSpacePressRef.current = 0;
        } else {
          lastSpacePressRef.current = now;
        }
      } else if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setAutoStartAudio(false);
        setCopilotOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      if (data.orders) {
        const fetchedOrders: Order[] = data.orders;

        // Detect new orders for audio alert
        if (!isInitialLoadRef.current && soundEnabled) {
          const hasNew = fetchedOrders.some(
            (o) => !previousOrderIdsRef.current.has(o.id) && o.status === "pending"
          );
          if (hasNew) {
            playOrderChime({ type: "ding_dong" });
            toast.info("🔔 Novo pedido recebido na cozinha!", {
              description: "Verifique a coluna de novos pedidos.",
            });
          }
        }

        previousOrderIdsRef.current = new Set(fetchedOrders.map((o) => o.id));
        isInitialLoadRef.current = false;
        setOrders(fetchedOrders);
      }
    } catch {
      // Error fetching orders
    } finally {
      setLoading(false);
    }
  }, [soundEnabled]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 6000); // Live poll every 6s
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateOrderStatus = async (
    orderId: string,
    newStatus: Order["status"],
    driverData?: { driverName?: string; driverPhone?: string; estimatedMinutes?: number }
  ) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus, ...driverData }),
      });
      const data = await res.json();
      if (data.success) {
        if (newStatus === "out_for_delivery" && driverData?.driverName) {
          toast.success(`🛵 Pedido despachado com ${driverData.driverName}! Notificação WhatsApp registrada.`);
        } else {
          toast.success(`Pedido atualizado para: ${getStatusTitle(newStatus)}`);
        }
        fetchOrders();
      } else {
        toast.error("Erro ao atualizar status");
      }
    } catch {
      toast.error("Erro de conexão");
    }
  };

  const getStatusTitle = (status: Order["status"]) => {
    switch (status) {
      case "pending":
        return "Novo Pedido";
      case "preparing":
        return "Em Preparo";
      case "ready":
        return "Pronto";
      case "out_for_delivery":
        return "Saiu p/ Entrega";
      case "delivered":
        return "Entregue";
      default:
        return status;
    }
  };

  // Filter columns
  const pendingOrders = orders.filter((o) => o.status === "pending");
  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready" || o.status === "out_for_delivery");

  // Summary Metrics
  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((acc, o) => acc + o.total, 0);

  return (
    <div className="flex-1 p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto w-full">
      {/* Top Header — Minimalist & Focused */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-stone-200/80">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-stone-900">
              Esteira de Pedidos
            </h1>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/80">
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Ao vivo
            </span>
          </div>

          {/* Minimalist Summary Bar (Linear-style) */}
          <div className="flex items-center gap-3 text-xs text-stone-500 mt-1.5 flex-wrap">
            <span className="font-semibold text-stone-800">
              <strong className="text-stone-900 font-bold">{orders.length}</strong> pedidos hoje
            </span>
            <span className="text-stone-300">•</span>
            <span className="font-semibold text-stone-800">
              <strong className="text-stone-900 font-bold">{formatBRL(totalRevenue)}</strong> faturados
            </span>
            <span className="text-stone-300">•</span>
            <span className="text-amber-700 font-bold">
              {pendingOrders.length} novos aguardando
            </span>
            <span className="text-stone-300">•</span>
            <span className="text-emerald-700 font-bold">
              {readyOrders.length} prontos
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setCopilotOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white shadow-sm shadow-stone-900/20 transition-all active:scale-95"
          >
            <IconSparkles className="size-3.5 text-orange-400" />
            <span>Copilot de Cozinha</span>
            <span className="text-[10px] bg-stone-800 text-stone-400 px-1.5 py-0.5 rounded font-mono border border-stone-700 hidden sm:inline">
              2x Espaço
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) {
                playOrderChime({ type: "ding_dong" });
                toast.success("Alerta sonoro ativado");
              }
            }}
            className={`p-2 rounded-xl border transition-all ${
              soundEnabled
                ? "bg-stone-100 text-stone-800 border-stone-300"
                : "bg-white text-stone-400 border-stone-200 hover:bg-stone-50"
            }`}
            title={soundEnabled ? "Alerta Sonoro Ativo" : "Som Desativado"}
            aria-label={soundEnabled ? "Desativar alerta sonoro de novos pedidos" : "Ativar alerta sonoro de novos pedidos"}
          >
            {soundEnabled ? <IconVolume className="size-4" /> : <IconVolumeOff className="size-4" />}
          </button>

          <button
            type="button"
            onClick={fetchOrders}
            className="p-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 transition-all"
            title="Atualizar Pedidos"
            aria-label="Atualizar lista de pedidos manualmente"
          >
            <IconRefresh className={`size-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile Column Tabs */}
      <div className="flex lg:hidden items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-stone-200 shadow-xs">
        <button
          type="button"
          onClick={() => setMobileColumn("pending")}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileColumn === "pending"
              ? "bg-amber-500 text-white shadow-xs"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          <span>Novos</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            mobileColumn === "pending" ? "bg-white/25 text-white" : "bg-stone-200 text-stone-700"
          }`}>
            {pendingOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMobileColumn("preparing")}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileColumn === "preparing"
              ? "bg-orange-600 text-white shadow-xs"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          <span>Em Preparo</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            mobileColumn === "preparing" ? "bg-white/25 text-white" : "bg-stone-200 text-stone-700"
          }`}>
            {preparingOrders.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMobileColumn("ready")}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileColumn === "ready"
              ? "bg-emerald-600 text-white shadow-xs"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          <span>Prontos</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
            mobileColumn === "ready" ? "bg-white/25 text-white" : "bg-stone-200 text-stone-700"
          }`}>
            {readyOrders.length}
          </span>
        </button>
      </div>

      {/* Esteira de Pedidos Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Column 1: Novos Pedidos */}
        <div
          className={`flex-col rounded-2xl bg-amber-50/50 border border-amber-200/80 p-4 space-y-3 min-h-[450px] ${
            mobileColumn === "pending" ? "flex" : "hidden lg:flex"
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-amber-200/60">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="font-bold text-amber-900 text-sm">Novos Pedidos</h2>
            </div>
            <span className="text-xs font-extrabold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
              {pendingOrders.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {pendingOrders.length === 0 ? (
              <div className="text-center py-12 text-stone-400 text-xs">
                Nenhum pedido novo no momento.
              </div>
            ) : (
              pendingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={updateOrderStatus}
                  onPrintReceipt={setReceiptOrder}
                  nextStatus="preparing"
                  nextActionLabel="Iniciar Preparo 🍳"
                />
              ))
            )}
          </div>
        </div>

        {/* Column 2: Em Preparo */}
        <div
          className={`flex-col rounded-2xl bg-orange-50/40 border border-orange-200/80 p-4 space-y-3 min-h-[450px] ${
            mobileColumn === "preparing" ? "flex" : "hidden lg:flex"
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-orange-200/60">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-orange-500 animate-pulse" />
              <h2 className="font-bold text-orange-950 text-sm">Em Preparo</h2>
            </div>
            <span className="text-xs font-extrabold bg-orange-200 text-orange-950 px-2 py-0.5 rounded-full">
              {preparingOrders.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {preparingOrders.length === 0 ? (
              <div className="text-center py-12 text-stone-400 text-xs">
                Nenhum prato na chapa agora.
              </div>
            ) : (
              preparingOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={updateOrderStatus}
                  onPrintReceipt={setReceiptOrder}
                  nextStatus="ready"
                  nextActionLabel="Marmita Pronta! 📦"
                />
              ))
            )}
          </div>
        </div>

        {/* Column 3: Prontos & Em Rota */}
        <div
          className={`flex-col rounded-2xl bg-emerald-50/40 border border-emerald-200/80 p-4 space-y-3 min-h-[450px] ${
            mobileColumn === "ready" ? "flex" : "hidden lg:flex"
          }`}
        >
          <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60">
            <div className="flex items-center gap-2">
              <span className="size-3 rounded-full bg-emerald-500" />
              <h2 className="font-bold text-emerald-950 text-sm">Pronto / Saiu para Entrega</h2>
            </div>
            <span className="text-xs font-extrabold bg-emerald-200 text-emerald-950 px-2 py-0.5 rounded-full">
              {readyOrders.length}
            </span>
          </div>

          <div className="space-y-3 flex-1 overflow-y-auto">
            {readyOrders.length === 0 ? (
              <div className="text-center py-12 text-stone-400 text-xs">
                Nenhum pedido aguardando entrega.
              </div>
            ) : (
              readyOrders.map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={updateOrderStatus}
                  onPrintReceipt={setReceiptOrder}
                  nextStatus="delivered"
                  nextActionLabel={
                    order.status === "out_for_delivery"
                      ? "Confirmar Entrega ✅"
                      : order.deliveryType === "pickup"
                      ? "Entregar no Balcão ✅"
                      : "Concluir Pedido ✅"
                  }
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Dispatch Driver Modal */}
      <DispatchDriverModal
        order={dispatchOrder}
        isOpen={!!dispatchOrder}
        onClose={() => setDispatchOrder(null)}
        onDispatch={(orderId, name, phone, eta) => {
          updateOrderStatus(orderId, "out_for_delivery", {
            driverName: name,
            driverPhone: phone,
            estimatedMinutes: eta,
          });
        }}
      />

      {/* Thermal Receipt Modal */}
      <ThermalReceiptModal
        order={receiptOrder}
        isOpen={!!receiptOrder}
        onClose={() => setReceiptOrder(null)}
      />

      {/* Floating Push-to-Talk Copilot Pill */}
      <button
        type="button"
        onClick={() => {
          setAutoStartAudio(true);
          setCopilotOpen(true);
        }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-stone-900/95 hover:bg-stone-900 text-white shadow-2xl shadow-black/40 px-5 py-3 rounded-full flex items-center gap-3 border border-stone-700/60 backdrop-blur-md transition-all hover:scale-105 active:scale-95 group"
      >
        <div className="size-7 rounded-full bg-orange-600 flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
          <IconMicrophone className="size-4" />
        </div>
        <div className="text-left pr-1">
          <div className="text-xs font-bold flex items-center gap-1.5">
            <span>Copilot da Cozinha</span>
            <span className="text-[10px] bg-stone-800 text-stone-400 px-1.5 py-0.2 rounded font-mono border border-stone-700 hidden sm:inline">
              2x Espaço
            </span>
          </div>
          <div className="text-[10px] text-stone-400">Toque 2x no Espaço ou clique para falar</div>
        </div>
      </button>

      {/* Copilot Modal */}
      <KitchenCopilotModal
        isOpen={copilotOpen}
        autoStartListening={autoStartAudio}
        onClose={() => {
          setAutoStartAudio(false);
          setCopilotOpen(false);
        }}
        onSuccess={fetchOrders}
      />
    </div>
  );
};

// Individual Kanban Order Card Component
const OrderCard = ({
  order,
  onStatusChange,
  onPrintReceipt,
  nextStatus,
  nextActionLabel,
}: {
  order: Order;
  onStatusChange: (id: string, s: Order["status"]) => void;
  onPrintReceipt: (order: Order) => void;
  nextStatus: Order["status"];
  nextActionLabel: string;
}) => {
  const isWhatsapp = order.origin === "whatsapp_ai";
  const driverMatch = order.notes?.match(/\[MOTOBOY:\s*([^\]]+)\]/i);
  const driverInfo = driverMatch ? driverMatch[1] : null;

  return (
    <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-xs hover:shadow-md transition-all space-y-3">
      {/* Order Header */}
      <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-black text-stone-900">
              #{order.orderNumber}
            </span>
            {isWhatsapp ? (
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded flex items-center gap-1 shrink-0">
                <span className="size-1 rounded-full bg-emerald-600 animate-pulse" />
                WhatsApp IA
              </span>
            ) : (
              <span className="text-[10px] font-bold bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded shrink-0">
                Cardápio Web
              </span>
            )}
          </div>
          <div className="text-xs font-bold text-stone-900 mt-1 truncate">{order.customerName}</div>
          <div className="text-[11px] text-stone-400 font-mono">{order.customerPhone}</div>
        </div>

        <div className="text-right shrink-0 flex flex-col items-end">
          <div className="text-sm font-black text-stone-900 tabular-nums">
            {formatBRL(order.total)}
          </div>
          <div className="flex items-center gap-1 mt-1">
            <span className="inline-block text-[10px] font-semibold text-stone-600 uppercase bg-stone-100 px-1.5 py-0.5 rounded">
              {order.paymentMethod === "pix" ? "⚡ PIX" : order.paymentMethod === "cash" ? "💵 Dinheiro" : "💳 Cartão"}
            </span>
            <button
              type="button"
              onClick={() => onPrintReceipt(order)}
              title="Imprimir Cupom Térmico (80mm)"
              className="p-1 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            >
              <IconPrinter className="size-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Driver Assignment Badge */}
      {order.status === "out_for_delivery" && (
        <div className="flex items-center gap-1.5 bg-blue-50 text-blue-900 text-[11px] font-bold px-2.5 py-1 rounded-xl border border-blue-200/80">
          <IconMotorbike className="size-3.5 text-blue-600 shrink-0" />
          <span className="truncate">Em Trânsito: {driverInfo || "Motoboy a caminho"}</span>
        </div>
      )}

      {/* Delivery Destination — Subtle Line */}
      <div className="text-xs text-stone-500 flex items-center gap-1.5">
        <IconMapPin className="size-3.5 shrink-0 text-stone-400" />
        <span className="truncate">{order.customerAddress || "Retirada no Balcão"}</span>
      </div>

      {/* Items List — Scannable in 300ms */}
      {order.items && order.items.length > 0 && (
        <div className="border-t border-b border-stone-100 py-2 space-y-1.5 text-xs">
          {order.items.map((item) => {
            let customList: string[] = [];
            try {
              if (item.customizationsJson) customList = JSON.parse(item.customizationsJson);
            } catch {
              // ignore parse errors
            }

            return (
              <div key={item.id} className="space-y-0.5">
                <div className="font-bold text-stone-900 flex justify-between">
                  <span>
                    {item.quantity}x {item.productName}
                  </span>
                  <span className="text-stone-400 font-normal tabular-nums">{formatBRL(item.totalPrice)}</span>
                </div>
                {customList.length > 0 && (
                  <p className="text-[11px] text-stone-500 leading-snug">
                    {customList.join(" • ")}
                  </p>
                )}
                {item.notes && (
                  <p className="text-[11px] text-amber-800 italic">
                    Obs: {item.notes}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* General Order Notes — Minimalist Italic, No Box */}
      {order.notes && (
        <div className="text-xs text-amber-900/90 italic pl-2.5 border-l-2 border-amber-400 py-0.5 leading-snug">
          Obs: {order.notes}
        </div>
      )}

      {/* Action Buttons Row — 1 Primary Action + Print Icon */}
      <div className="pt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPrintReceipt(order)}
          className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-500 hover:text-stone-800 transition-all flex items-center justify-center shrink-0"
          title="Imprimir Cupom Térmico (80mm)"
        >
          <IconPrinter className="size-4" />
        </button>

        <button
          type="button"
          onClick={() => onStatusChange(order.id, nextStatus)}
          className={`flex-1 text-xs font-bold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs ${
            order.status === "pending"
              ? "bg-stone-900 hover:bg-stone-800 text-white"
              : order.status === "preparing"
              ? "bg-orange-600 hover:bg-orange-700 text-white shadow-orange-600/20"
              : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
          }`}
        >
          <span>{nextActionLabel}</span>
        </button>
      </div>
    </div>
  );
}

// Modal for Motoboy Dispatch
const DispatchDriverModal = ({
  order,
  isOpen,
  onClose,
  onDispatch,
}: {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onDispatch: (orderId: string, driverName: string, driverPhone?: string, etaMinutes?: number) => void;
}) => {
  const [driverName, setDriverName] = useState("Carlos");
  const [driverPhone, setDriverPhone] = useState("11988887777");
  const [eta, setEta] = useState(20);

  const commonDrivers = [
    { name: "Carlos", phone: "11988887777", vehicle: "Honda Fan 160" },
    { name: "Marcos", phone: "11977776666", vehicle: "Honda Titan 150" },
    { name: "Lucas", phone: "11966665555", vehicle: "Yamaha Factor 150" },
  ];

  if (!isOpen || !order) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-xs cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-150 cursor-default"
      >
        <div className="p-5 border-b border-stone-100 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center">
              <IconMotorbike className="size-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-stone-900">Despacho com Motoboy</h3>
              <p className="text-[11px] text-stone-500">
                Pedido #{order.orderNumber} • {order.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <IconX className="size-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200/80 text-xs text-stone-700 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-stone-900">
              <IconMapPin className="size-3.5 text-orange-600 shrink-0" />
              <span>Endereço de Entrega:</span>
            </div>
            <p className="pl-5 text-stone-600">{order.customerAddress || "Endereço cadastrado"}</p>
          </div>

          {/* Quick Driver Presets */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-2">
              Selecione o Entregador da Casa:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {commonDrivers.map((d) => (
                <button
                  key={d.name}
                  type="button"
                  onClick={() => {
                    setDriverName(d.name);
                    setDriverPhone(d.phone);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    driverName === d.name
                      ? "border-orange-600 bg-orange-50/70 text-orange-950 font-bold ring-1 ring-orange-500"
                      : "border-stone-200 hover:bg-stone-50 text-stone-700 font-medium"
                  }`}
                >
                  <div className="text-xs font-bold">{d.name}</div>
                  <div className="text-[10px] text-stone-400 mt-0.5 truncate">{d.vehicle}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Driver Input */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Nome do Motoboy
              </label>
              <input
                type="text"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                placeholder="Ex: Carlos"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Previsão (Minutos)
              </label>
              <input
                type="number"
                value={eta}
                onChange={(e) => setEta(Number(e.target.value) || 20)}
                className="w-full text-xs p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                min={5}
                max={90}
              />
            </div>
          </div>

          <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl flex items-center gap-2">
            <IconBrandWhatsapp className="size-4 text-emerald-600 shrink-0" />
            <span>Notificação automática com rastreio e nome do motoboy será registrada para o cliente.</span>
          </div>
        </div>

        <div className="p-4 bg-stone-50 border-t border-stone-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200/60 rounded-xl transition-all"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => {
              onDispatch(order.id, driverName, driverPhone, eta);
              onClose();
            }}
            className="px-4 py-2.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl shadow-md shadow-orange-600/20 transition-all flex items-center gap-1.5"
          >
            <IconMotorbike className="size-4" />
            <span>Despachar & Notificar 🛵</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveOrdersDashboard;
