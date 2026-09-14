"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  IconCheck,
  IconClock,
  IconArrowLeft,
  IconBrandWhatsapp,
  IconMapPin,
} from "@tabler/icons-react";

interface OrderTracking {
  id: string;
  orderNumber: number;
  status: "pending" | "preparing" | "ready" | "out_for_delivery" | "delivered" | "cancelled";
  customerName: string;
  customerAddress: string;
  deliveryType: "delivery" | "pickup";
  total: number;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
}

const formatBRL = (val: number | undefined | null) => {
  if (val == null || isNaN(val)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);
};

const OrderTrackingPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = use(params);
  const orderId = resolvedParams.id;

  const [order, setOrder] = useState<OrderTracking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/orders?id=${orderId}`);
        const data = await res.json();
        if (data.order) {
          setOrder(data.order);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
    const interval = setInterval(fetchOrder, 5000);
    return () => clearInterval(interval);
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="size-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-stone-50">
        <h2 className="text-xl font-bold text-stone-900 mb-2">Pedido não encontrado</h2>
        <p className="text-xs text-stone-500 mb-4">Verifique o link enviado pelo restaurante ou WhatsApp.</p>
        <Link
          href="/"
          className="bg-orange-600 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md"
        >
          Voltar ao Cardápio
        </Link>
      </div>
    );
  }

  const steps = [
    { key: "pending", label: "Recebido", desc: "Aguardando confirmação da cozinha" },
    { key: "preparing", label: "Em Preparo", desc: "Montando e embalando sua marmita" },
    { key: "out_for_delivery", label: "Em Rota", desc: "Motoboy a caminho do seu endereço" },
    { key: "delivered", label: "Entregue", desc: "Bom apetite!" },
  ];

  const getStepIndex = (status: OrderTracking["status"]) => {
    switch (status) {
      case "pending":
        return 0;
      case "preparing":
        return 1;
      case "ready":
      case "out_for_delivery":
        return 2;
      case "delivered":
        return 3;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(order.status);

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-start p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="bg-stone-900 text-white p-6">
          <div className="flex items-center justify-between mb-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs text-stone-300 hover:text-white"
            >
              <IconArrowLeft className="size-4" />
              <span>Cardápio</span>
            </Link>
            <span className="text-xs font-mono font-bold bg-orange-600 px-2.5 py-1 rounded-full text-white">
              #{order.orderNumber}
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight">Status do Pedido</h1>
          <p className="text-xs text-stone-400 mt-1">Acompanhamento ao vivo com atualização contínua</p>
        </div>

        {/* Live Progress Timeline */}
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            {steps.map((step, idx) => {
              const isPast = idx < currentIndex;
              const isCurrent = idx === currentIndex;

              return (
                <div key={step.key} className="flex items-start gap-3.5">
                  <div className="relative flex flex-col items-center">
                    <div
                      className={`size-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isPast
                          ? "bg-emerald-600 text-white shadow-xs"
                          : isCurrent
                          ? "bg-orange-600 text-white ring-4 ring-orange-100 shadow-md animate-pulse"
                          : "bg-stone-100 text-stone-400 border border-stone-200"
                      }`}
                    >
                      {isPast ? (
                        <IconCheck className="size-4" />
                      ) : isCurrent ? (
                        <IconClock className="size-4" />
                      ) : (
                        <span>{idx + 1}</span>
                      )}
                    </div>
                    {idx < steps.length - 1 && (
                      <div
                        className={`w-0.5 h-8 mt-1 ${
                          isPast ? "bg-emerald-500" : "bg-stone-200"
                        }`}
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0 pt-1">
                    <h3
                      className={`text-sm font-black ${
                        isCurrent
                          ? "text-orange-600"
                          : isPast
                          ? "text-stone-900"
                          : "text-stone-400"
                      }`}
                    >
                      {step.label}
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Delivery Details */}
          <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 space-y-2.5 text-xs">
            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <span className="text-stone-500 font-medium">Destinatário:</span>
              <span className="font-bold text-stone-900">{order.customerName}</span>
            </div>

            <div className="flex items-start justify-between border-b border-stone-200 pb-2">
              <span className="text-stone-500 font-medium flex items-center gap-1">
                <IconMapPin className="size-3.5" />
                <span>Endereço:</span>
              </span>
              <span className="font-bold text-stone-900 text-right max-w-[60%]">
                {order.customerAddress}
              </span>
            </div>

            <div className="flex items-center justify-between border-b border-stone-200 pb-2">
              <span className="text-stone-500 font-medium">Total do Pedido:</span>
              <span className="font-black text-sm text-stone-900 tabular-nums">
                {formatBRL(order.total)}
              </span>
            </div>

            {order.notes && (
              <div className="text-[11px] text-stone-600 italic bg-amber-50 p-2 rounded-xl border border-amber-200/60">
                {order.notes}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <a
              href="https://wa.me/5511987654321?text=Olá,%20gostaria%20de%20saber%20do%20meu%20pedido"
              target="_blank"
              rel="noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-2xl text-xs text-center flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
            >
              <IconBrandWhatsapp className="size-4" />
              <span>Falar no WhatsApp da Loja</span>
            </a>

            <Link
              href="/"
              className="w-full bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 font-bold py-2.5 px-4 rounded-2xl text-xs text-center block transition-all"
            >
              Fazer Outro Pedido
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingPage;
