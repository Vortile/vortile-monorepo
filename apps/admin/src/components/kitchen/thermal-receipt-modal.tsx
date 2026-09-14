"use client";

import { useRef, useState } from "react";
import {
  IconPrinter,
  IconX,
  IconReceipt2,
  IconFlame,
  IconToolsKitchen2,
} from "@tabler/icons-react";

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
  status: string;
  notes?: string;
  origin: string;
  createdAt: string;
  items?: OrderItem[];
}

interface ThermalReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatBRL = (val: number | undefined | null) => {
  if (val == null || isNaN(val)) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);
};

export const ThermalReceiptModal = ({ order, isOpen, onClose }: ThermalReceiptModalProps) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [stationMode, setStationMode] = useState<"full" | "grill" | "assembly">("full");

  if (!isOpen || !order) return null;

  const handlePrint = () => {
    window.print();
  };

  const isTakeaway = order.deliveryType === "pickup";
  const formattedDate = new Date(order.createdAt).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 backdrop-blur-xs cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-stone-200 flex flex-col max-h-[92vh] cursor-default"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-100 bg-stone-50">
          <div className="flex items-center gap-2">
            <IconPrinter className="size-5 text-orange-600" />
            <span className="font-bold text-stone-900 text-sm">
              Impressão Térmica (80mm) - Pedido #{order.orderNumber}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
          >
            <IconX className="size-5" />
          </button>
        </div>

        {/* Station Tabs */}
        <div className="flex border-b border-stone-200 bg-stone-100/70 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setStationMode("full")}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              stationMode === "full"
                ? "bg-white text-stone-900 shadow-xs border border-stone-200/80"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
            }`}
          >
            <IconReceipt2 className="size-3.5 text-stone-700" />
            <span>Comanda Geral</span>
          </button>
          <button
            type="button"
            onClick={() => setStationMode("grill")}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              stationMode === "grill"
                ? "bg-white text-orange-950 shadow-xs border border-orange-200"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
            }`}
          >
            <IconFlame className="size-3.5 text-orange-600" />
            <span>Praça Grelha</span>
          </button>
          <button
            type="button"
            onClick={() => setStationMode("assembly")}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              stationMode === "assembly"
                ? "bg-white text-emerald-950 shadow-xs border border-emerald-200"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-200/60"
            }`}
          >
            <IconToolsKitchen2 className="size-3.5 text-emerald-600" />
            <span>Praça Montagem</span>
          </button>
        </div>

        {/* Scrollable Receipt Area */}
        <div className="p-6 overflow-y-auto bg-stone-100 flex justify-center">
          {/* Printable 80mm Ticket Box */}
          <div
            ref={receiptRef}
            id="printable-receipt"
            className="w-[320px] bg-white p-5 shadow-xs border border-stone-300 font-mono text-[11px] leading-tight text-black space-y-3 print:border-none print:shadow-none print:w-full"
          >
            {/* 1. COMANDA GERAL / COMPLETA */}
            {stationMode === "full" && (
              <>
                {/* Store Header */}
                <div className="text-center space-y-1 border-b border-dashed border-stone-400 pb-3">
                  <div className="font-black text-sm tracking-wider uppercase">
                    VORTI MARMITEX & GRELHADOS
                  </div>
                  <div className="text-[10px] text-stone-600">
                    CNPJ: 45.892.114/0001-20
                  </div>
                  <div className="text-[10px] text-stone-600">
                    Rua Augusta, 1492 - Consolação, SP
                  </div>
                  <div className="text-[10px] text-stone-600">
                    Tel/WhatsApp: (11) 98765-4321
                  </div>
                </div>

                {/* Order Meta */}
                <div className="border-b border-dashed border-stone-400 pb-2 space-y-1">
                  <div className="flex justify-between font-bold text-xs">
                    <span>PEDIDO #{order.orderNumber}</span>
                    <span>{formattedDate}</span>
                  </div>
                  <div className="flex justify-between text-[10px]">
                    <span>CANAL: {order.origin === "whatsapp_ai" ? "WHATSAPP IA" : "CARDÁPIO WEB"}</span>
                    <span className="font-bold uppercase">
                      {isTakeaway ? "RETIRADA BALCÃO" : "DELIVERY"}
                    </span>
                  </div>
                </div>

                {/* Customer Details */}
                <div className="border-b border-dashed border-stone-400 pb-2 space-y-0.5">
                  <div className="font-bold">CLIENTE: {order.customerName.toUpperCase()}</div>
                  <div>TEL: {order.customerPhone}</div>
                  {!isTakeaway && (
                    <div className="mt-1">
                      <span className="font-bold">ENDEREÇO:</span>
                      <div className="break-words">{order.customerAddress || "Não informado"}</div>
                    </div>
                  )}
                </div>

                {/* Items List */}
                <div className="border-b border-dashed border-stone-400 pb-3 space-y-2">
                  <div className="font-bold uppercase text-[10px] tracking-wider text-stone-600 border-b border-stone-200 pb-1 flex justify-between">
                    <span>ITEM</span>
                    <span>TOTAL</span>
                  </div>
                  {order.items?.map((item, idx) => {
                    let customList: string[] = [];
                    try {
                      if (item.customizationsJson) customList = JSON.parse(item.customizationsJson);
                    } catch {
                      // ignore parse error
                    }

                    return (
                      <div key={idx} className="space-y-0.5">
                        <div className="flex justify-between font-bold">
                          <span>{item.quantity}x {item.productName.toUpperCase()}</span>
                          <span className="tabular-nums">{formatBRL(item.totalPrice)}</span>
                        </div>
                        {customList.length > 0 && (
                          <div className="pl-2 space-y-0.5 text-[10px] text-stone-700">
                            {customList.map((c, cIdx) => (
                              <div key={cIdx}>• {c}</div>
                            ))}
                          </div>
                        )}
                        {item.notes && (
                          <div className="pl-2 text-[10px] italic font-bold">
                            OBS: {item.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Totals & Payments */}
                <div className="border-b border-dashed border-stone-400 pb-2 space-y-1">
                  <div className="flex justify-between">
                    <span>SUBTOTAL:</span>
                    <span className="tabular-nums">{formatBRL(order.subtotal)}</span>
                  </div>
                  {!isTakeaway && (
                    <div className="flex justify-between">
                      <span>TAXA DE ENTREGA:</span>
                      <span className="tabular-nums">{formatBRL(order.deliveryFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-black text-xs pt-1 border-t border-stone-200">
                    <span>TOTAL:</span>
                    <span className="tabular-nums">{formatBRL(order.total)}</span>
                  </div>
                  <div className="pt-1 flex justify-between font-bold text-[10px]">
                    <span>FORMA PGTO:</span>
                    <span className="uppercase">
                      {order.paymentMethod === "pix"
                        ? "PIX (ONLINE)"
                        : order.paymentMethod === "cash"
                        ? "DINHEIRO"
                        : "CARTÃO NA ENTREGA"}
                    </span>
                  </div>
                </div>

                {/* Observations */}
                {order.notes && (
                  <div className="border-b border-dashed border-stone-400 pb-2 text-[10px]">
                    <div className="font-bold">OBSERVAÇÕES:</div>
                    <div className="break-words">{order.notes}</div>
                  </div>
                )}

                {/* Signature / Footer */}
                <div className="text-center pt-2 space-y-2">
                  <div className="text-[9px] text-stone-500">
                    OBRIGADO PELA PREFERÊNCIA!
                  </div>
                  <div className="pt-4 border-t border-dotted border-stone-300">
                    <div className="text-[9px] text-stone-400">Assinatura Motoboy / Cliente</div>
                  </div>
                </div>
              </>
            )}

            {/* 2. PRAÇA QUENTE - GRELHA & CARNES */}
            {stationMode === "grill" && (
              <>
                <div className="text-center space-y-1 border-b-2 border-black pb-2">
                  <div className="font-black text-xs tracking-wider bg-black text-white py-0.5 px-2 uppercase">
                    *** PRAÇA QUENTE: GRELHA / CHAPISTA ***
                  </div>
                  <div className="font-black text-lg pt-1">
                    PEDIDO #{order.orderNumber}
                  </div>
                  <div className="flex justify-between text-[10px] text-stone-700">
                    <span>HORA: {formattedDate.split(" ")[1] || formattedDate}</span>
                    <span className="font-bold uppercase">
                      {isTakeaway ? "RETIRADA" : "DELIVERY"}
                    </span>
                  </div>
                </div>

                {/* Grill Items Breakdown */}
                <div className="border-b border-dashed border-stone-400 py-2 space-y-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
                    CARNES & GRELHADOS A PREPARAR:
                  </div>

                  {order.items?.map((item, idx) => {
                    let customList: string[] = [];
                    try {
                      if (item.customizationsJson) customList = JSON.parse(item.customizationsJson);
                    } catch {
                      // ignore parse error
                    }

                    // Extract meat choices
                    const meatSelections = customList.filter(
                      (c) =>
                        c.toLowerCase().includes("bife") ||
                        c.toLowerCase().includes("carne") ||
                        c.toLowerCase().includes("frango") ||
                        c.toLowerCase().includes("filé") ||
                        c.toLowerCase().includes("alcatra") ||
                        c.toLowerCase().includes("bisteca") ||
                        c.toLowerCase().includes("parmegiana")
                    );

                    return (
                      <div key={idx} className="bg-stone-50 p-2 rounded border border-stone-300 space-y-1">
                        <div className="font-black text-xs flex items-center justify-between">
                          <span>[ QTD: {item.quantity}x ] {item.productName.toUpperCase()}</span>
                        </div>
                        {meatSelections.length > 0 ? (
                          <div className="pl-2 space-y-0.5">
                            {meatSelections.map((meat, mIdx) => (
                              <div key={mIdx} className="font-black text-sm text-stone-900">
                                ➔ {meat.toUpperCase()}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="pl-2 text-[10px] text-stone-500 italic">
                            (Item de chapa direta / grelhado padrão)
                          </div>
                        )}
                        {item.notes && (
                          <div className="text-[10px] font-bold text-red-700 bg-red-50 p-1 rounded border border-red-200 mt-1">
                            PONTO / OBS: {item.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Customer Global Notes */}
                {order.notes && (
                  <div className="bg-amber-50 p-2 rounded border border-amber-300 text-[10px] space-y-0.5">
                    <span className="font-bold">OBSERVAÇÃO GERAL DO PEDIDO:</span>
                    <div>{order.notes}</div>
                  </div>
                )}

                <div className="text-center pt-2 font-bold text-[10px] text-stone-600 uppercase border-t border-dashed border-stone-400">
                  ➔ APÓS PRONTO: ENVIAR P/ BANCADA DE MONTAGEM
                </div>
              </>
            )}

            {/* 3. PRAÇA FRIA - MONTAGEM & GUARNIÇÕES */}
            {stationMode === "assembly" && (
              <>
                <div className="text-center space-y-1 border-b-2 border-black pb-2">
                  <div className="font-black text-xs tracking-wider bg-stone-900 text-white py-0.5 px-2 uppercase">
                    *** PRAÇA FRIA: MONTAGEM & EMBALAGEM ***
                  </div>
                  <div className="font-black text-lg pt-1">
                    PEDIDO #{order.orderNumber}
                  </div>
                  <div className="flex justify-between text-[10px] text-stone-700">
                    <span>CLIENTE: {order.customerName.toUpperCase()}</span>
                    <span className="font-bold uppercase">
                      {isTakeaway ? "RETIRADA" : "DELIVERY"}
                    </span>
                  </div>
                </div>

                {/* Assembly Checklist */}
                <div className="border-b border-dashed border-stone-400 py-2 space-y-3">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-stone-600">
                    COMPOSIÇÃO DAS MARMITAS & EMBALAGEM:
                  </div>

                  {order.items?.map((item, idx) => {
                    let customList: string[] = [];
                    try {
                      if (item.customizationsJson) customList = JSON.parse(item.customizationsJson);
                    } catch {
                      // ignore parse error
                    }

                    return (
                      <div key={idx} className="border border-stone-300 p-2 rounded space-y-1.5">
                        <div className="font-black text-xs flex justify-between border-b border-stone-200 pb-1">
                          <span>[ {item.quantity}x ] {item.productName.toUpperCase()}</span>
                          <span className="text-[10px] font-normal text-stone-600">[ ] CONFERIDO</span>
                        </div>
                        {customList.length > 0 && (
                          <div className="space-y-1 text-[11px] pl-1">
                            {customList.map((c, cIdx) => (
                              <div key={cIdx} className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px]">[ ]</span>
                                <span className="font-medium">{c}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {item.notes && (
                          <div className="text-[10px] font-bold bg-amber-50 p-1 rounded text-amber-900">
                            ATENÇÃO: {item.notes}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Packaging & Dispatch Checklist */}
                <div className="space-y-1 text-[10px] bg-stone-50 p-2 rounded border border-stone-200">
                  <div className="font-bold uppercase">CHECKLIST DE EXPEDIÇÃO:</div>
                  <div className="flex items-center gap-1.5">
                    <span>[ ] Talheres e guardanapos descartáveis</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>[ ] Bebidas e sobremesas refrigeradas conferidas</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>[ ] Grampear cupom térmico na sacola</span>
                  </div>
                </div>

                <div className="text-center pt-2 font-bold text-[10px] text-stone-600 uppercase border-t border-dashed border-stone-400">
                  ➔ MARMITA LACRADA: TRANSFERIR P/ SAÍDA MOTOBOY
                </div>
              </>
            )}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 bg-white border-t border-stone-100 flex items-center justify-between">
          <div className="text-xs text-stone-500 font-medium">
            Formato: <strong className="text-stone-800">ESC/POS 80mm</strong>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-100 transition-colors"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2 shadow-xs transition-colors"
            >
              <IconPrinter className="size-4" />
              <span>
                Imprimir {stationMode === "full" ? "Comanda Geral" : stationMode === "grill" ? "Grelha" : "Montagem"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
