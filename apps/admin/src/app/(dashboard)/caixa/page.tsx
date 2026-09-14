"use client";

import React, { useState, useEffect } from "react";
import {
  IconCash,
  IconQrcode,
  IconCreditCard,
  IconReceipt2,
  IconPlus,
  IconMinus,
  IconLock,
  IconLockOpen,
  IconAlertCircle,
  IconCheck,
  IconClock,
  IconHistory,
  IconRefresh,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

interface ShiftRegister {
  id: string;
  openedBy: string;
  openedAt: string;
  closedBy?: string;
  closedAt?: string;
  initialAmount: number;
  totalSales: number;
  totalPix: number;
  totalCard: number;
  totalCash: number;
  totalInflow: number;
  totalOutflow: number;
  expectedCash: number;
  actualCash?: number;
  difference?: number;
  status: "open" | "closed";
  notes?: string;
  ordersCount?: number;
}

interface CashTx {
  id: string;
  type: "inflow" | "outflow";
  amount: number;
  reason: string;
  createdBy: string;
  createdAt: string;
}

const CaixaTurnoPage = () => {
  const { currentUser, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [register, setRegister] = useState<ShiftRegister | null>(null);
  const [transactions, setTransactions] = useState<CashTx[]>([]);
  const [historyShifts, setHistoryShifts] = useState<ShiftRegister[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // Modals state
  const [showOpenModal, setShowOpenModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState<"inflow" | "outflow">("outflow");

  // Form states
  const [openInitialAmount, setOpenInitialAmount] = useState("100.00");
  const [openNotes, setOpenNotes] = useState("Abertura de turno com troco padrão");
  const [closeActualCash, setCloseActualCash] = useState("");
  const [closeNotes, setCloseNotes] = useState("");
  const [txAmount, setTxAmount] = useState("");
  const [txReason, setTxReason] = useState("");

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);
  };

  const fetchCaixa = async () => {
    try {
      const res = await fetch("/api/caixa");
      const data = await res.json();
      if (data.isOpen && data.register) {
        setRegister(data.register);
        setTransactions(data.transactions || []);
      } else {
        setRegister(null);
        setTransactions([]);
      }
    } catch (e) {
      toast.error("Erro ao carregar dados do caixa");
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/caixa?history=true");
      const data = await res.json();
      if (data.shifts) setHistoryShifts(data.shifts);
    } catch (e) {}
  };

  useEffect(() => {
    fetchCaixa();
  }, []);

  const handleOpenCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/caixa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "open",
          data: {
            initialAmount: Number(openInitialAmount) || 0,
            openedBy: currentUser.name,
            notes: openNotes,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Turno de caixa aberto com sucesso! 💰");
        setShowOpenModal(false);
        fetchCaixa();
      } else {
        toast.error(data.error || "Erro ao abrir caixa");
      }
    } catch (e) {
      toast.error("Erro na comunicação");
    }
  };

  const handleCloseCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!register) return;

    try {
      const res = await fetch("/api/caixa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "close",
          data: {
            registerId: register.id,
            actualCash: Number(closeActualCash) || 0,
            closedBy: currentUser.name,
            notes: closeNotes,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Caixa fechado com sucesso!");
        setShowCloseModal(false);
        fetchCaixa();
      } else {
        toast.error(data.error || "Erro ao fechar caixa");
      }
    } catch (e) {
      toast.error("Erro na comunicação");
    }
  };

  const handleCreateTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!register) return;

    try {
      const res = await fetch("/api/caixa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "transaction",
          data: {
            registerId: register.id,
            type: txType,
            amount: Number(txAmount),
            reason: txReason,
            createdBy: currentUser.name,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(txType === "outflow" ? "Sangria registrada! 💸" : "Suprimento registrado! 💵");
        setShowTxModal(false);
        setTxAmount("");
        setTxReason("");
        fetchCaixa();
      } else {
        toast.error(data.error || "Erro ao registrar movimentação");
      }
    } catch (e) {
      toast.error("Erro na comunicação");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 max-w-6xl mx-auto w-full">
      {/* Top Header */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-2xl font-black text-stone-900 tracking-tight">
              Abertura & Fechamento de Caixa
            </h1>
            {register ? (
              <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                <span className="size-2 rounded-full bg-emerald-600 animate-pulse" />
                Caixa Aberto
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-800 text-xs font-bold px-2.5 py-0.5 rounded-full border border-rose-200">
                <IconLock className="size-3.5 text-rose-600" />
                Caixa Fechado
              </span>
            )}
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Controle de troco inicial, vendas do turno, sangrias e conciliação de fechamento em dinheiro, PIX e cartão.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {register ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setTxType("outflow");
                  setShowTxModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-all"
              >
                <IconMinus className="size-3.5 text-rose-600" />
                <span>Sangria</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setTxType("inflow");
                  setShowTxModal(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 transition-all"
              >
                <IconPlus className="size-3.5 text-emerald-600" />
                <span>Suprimento</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCloseActualCash(String(register.expectedCash.toFixed(2)));
                  setShowCloseModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-sm"
              >
                <IconLock className="size-3.5" />
                <span>Fechar Caixa</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowOpenModal(true)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm"
            >
              <IconLockOpen className="size-4" />
              <span>Abrir Novo Turno de Caixa</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory) fetchHistory();
            }}
            className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-600"
            title="Histórico de Caixas"
          >
            <IconHistory className="size-4" />
          </button>
        </div>
      </div>

      {/* When Register is OPEN: Metrics & Totals */}
      {register && (
        <div className="space-y-6">
          {/* Shift Details Banner */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <IconClock className="size-4 text-stone-400" />
              <span>Aberto por <strong>{register.openedBy}</strong> às {new Date(register.openedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} de {new Date(register.openedAt).toLocaleDateString()}</span>
            </div>
            <div className="text-stone-500 font-medium">
              Fundo de Troco Inicial: <strong className="text-stone-900">{formatBRL(register.initialAmount)}</strong>
            </div>
          </div>

          {/* KPI Cards: Sales by Payment Method */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Vendas no Turno</div>
              <div className="text-2xl font-black text-stone-900 mt-1 tabular-nums">
                {formatBRL(register.totalSales)}
              </div>
              <div className="text-[11px] text-stone-400 mt-1 font-medium">{register.ordersCount || 0} pedidos faturados</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider">
                <span>Recebido em PIX</span>
                <IconQrcode className="size-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700 mt-1 tabular-nums">
                {formatBRL(register.totalPix)}
              </div>
              <div className="text-[11px] text-stone-400 mt-1">Direto na conta da loja</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider">
                <span>Cartão Entrega</span>
                <IconCreditCard className="size-4 text-orange-600" />
              </div>
              <div className="text-2xl font-black text-orange-700 mt-1 tabular-nums">
                {formatBRL(register.totalCard)}
              </div>
              <div className="text-[11px] text-stone-400 mt-1">Débito e crédito maquininha</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-xs font-semibold text-stone-500 uppercase tracking-wider">
                <span>Dinheiro em Caixa</span>
                <IconCash className="size-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-blue-700 mt-1 tabular-nums">
                {formatBRL(register.expectedCash)}
              </div>
              <div className="text-[11px] text-stone-400 mt-1 font-medium">Troco + Vendas em espécie</div>
            </div>
          </div>

          {/* Transactions List (Sangrias & Suprimentos) */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-stone-900 text-sm">Movimentações de Caixa (Sangrias e Suprimentos)</h3>
              <span className="text-xs font-semibold text-stone-400">{transactions.length} registros</span>
            </div>

            {transactions.length === 0 ? (
              <p className="text-xs text-stone-400 py-4 text-center">Nenhuma sangria ou suprimento registrado neste turno.</p>
            ) : (
              <div className="space-y-2">
                {transactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-3 rounded-xl border border-stone-200/80 bg-stone-50/50 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`size-2 rounded-full ${
                          tx.type === "inflow" ? "bg-emerald-500" : "bg-rose-500"
                        }`}
                      />
                      <span className="font-bold text-stone-900">
                        {tx.type === "inflow" ? "Suprimento (Entrada)" : "Sangria (Retirada)"}
                      </span>
                      <span className="text-stone-500">• {tx.reason}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`font-black tabular-nums ${
                          tx.type === "inflow" ? "text-emerald-700" : "text-rose-700"
                        }`}
                      >
                        {tx.type === "inflow" ? "+" : "-"} {formatBRL(tx.amount)}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {new Date(tx.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* When Register is CLOSED: Prompt to Open */}
      {!register && (
        <div className="bg-white p-12 rounded-3xl border border-stone-200 text-center space-y-4 shadow-xs">
          <div className="size-16 rounded-3xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            <IconLock className="size-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-stone-900">O caixa está fechado no momento</h2>
            <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
              Abra um turno de caixa informando o fundo de troco inicial para começar a registrar as vendas do dia.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowOpenModal(true)}
            className="px-6 py-3 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-600/20"
          >
            Abrir Caixa Agora 💰
          </button>
        </div>
      )}

      {/* Past Shifts History Table */}
      {showHistory && (
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
            <IconHistory className="size-4 text-orange-600" />
            <span>Histórico de Turnos Fechados</span>
          </h3>
          {historyShifts.length === 0 ? (
            <p className="text-xs text-stone-400 py-3 text-center">Nenhum turno anterior registrado.</p>
          ) : (
            <div className="divide-y divide-stone-100 text-xs">
              {historyShifts.map((s) => (
                <div key={s.id} className="py-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-stone-900">
                      Fechado por {s.closedBy || s.openedBy}
                    </span>
                    <p className="text-[11px] text-stone-400">
                      Aberto: {new Date(s.openedAt).toLocaleString()} • Fechado: {s.closedAt ? new Date(s.closedAt).toLocaleString() : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="font-black text-stone-900 tabular-nums">
                      Vendas: {formatBRL(s.totalSales)}
                    </span>
                    <div className="text-[11px] text-stone-500">
                      Troco Inicial: {formatBRL(s.initialAmount)} | Em Espécie: {formatBRL(s.actualCash || 0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Abertura de Caixa */}
      {showOpenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-stone-100">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <IconLockOpen className="size-5 text-emerald-600" />
                <span>Abrir Turno de Caixa</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowOpenModal(false)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleOpenCaixa} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Fundo de Troco Inicial (R$) *
                </label>
                <input
                  type="number"
                  step="0.50"
                  required
                  value={openInitialAmount}
                  onChange={(e) => setOpenInitialAmount(e.target.value)}
                  placeholder="Ex: 100.00"
                  className="w-full text-base font-bold p-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Operador Responsável
                </label>
                <input
                  type="text"
                  disabled
                  value={currentUser.name}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-100 text-stone-600"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Observações da Abertura
                </label>
                <input
                  type="text"
                  value={openNotes}
                  onChange={(e) => setOpenNotes(e.target.value)}
                  placeholder="Ex: Fundo de caixa com notas trocadas"
                  className="w-full p-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md shadow-emerald-600/20"
              >
                Confirmar Abertura de Caixa
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Fechamento de Caixa */}
      {showCloseModal && register && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-stone-100">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <IconLock className="size-5 text-rose-600" />
                <span>Fechamento do Turno</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCloseCaixa} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                <div className="flex justify-between text-stone-600">
                  <span>Troco Inicial:</span>
                  <span className="font-bold">{formatBRL(register.initialAmount)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Vendas em Espécie:</span>
                  <span className="font-bold">{formatBRL(register.totalCash)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Suprimentos (+):</span>
                  <span>{formatBRL(register.totalInflow)}</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Sangrias (-):</span>
                  <span>{formatBRL(register.totalOutflow)}</span>
                </div>
                <div className="flex justify-between text-stone-900 font-extrabold pt-1 border-t border-stone-200 text-sm">
                  <span>Dinheiro Esperado no Caixa:</span>
                  <span className="text-blue-700">{formatBRL(register.expectedCash)}</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Contagem Física do Dinheiro (R$) *
                </label>
                <input
                  type="number"
                  step="0.10"
                  required
                  value={closeActualCash}
                  onChange={(e) => setCloseActualCash(e.target.value)}
                  className="w-full text-base font-bold p-3 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>

              {closeActualCash && (
                <div className="p-2.5 rounded-xl text-[11px] font-bold flex items-center justify-between bg-stone-100">
                  <span>Diferença apurada:</span>
                  <span
                    className={
                      Number(closeActualCash) - register.expectedCash >= 0
                        ? "text-emerald-700"
                        : "text-rose-700"
                    }
                  >
                    {formatBRL(Number(closeActualCash) - register.expectedCash)} (
                    {Number(closeActualCash) - register.expectedCash >= 0 ? "Sobra" : "Falta"})
                  </span>
                </div>
              )}

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Observações do Fechamento
                </label>
                <input
                  type="text"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Ex: Tudo conferido e envelopes lacrados"
                  className="w-full p-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md shadow-rose-600/20"
              >
                Concluir Fechamento de Caixa
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Sangria ou Suprimento */}
      {showTxModal && register && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-stone-100">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-base">
                {txType === "outflow" ? "Registrar Sangria (Retirada)" : "Registrar Suprimento (Entrada de Troco)"}
              </h3>
              <button
                type="button"
                onClick={() => setShowTxModal(false)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTx} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Valor da Movimentação (R$) *
                </label>
                <input
                  type="number"
                  step="0.50"
                  required
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full text-base font-bold p-3 rounded-xl border border-stone-300 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Motivo / Justificativa *
                </label>
                <input
                  type="text"
                  required
                  value={txReason}
                  onChange={(e) => setTxReason(e.target.value)}
                  placeholder={
                    txType === "outflow"
                      ? "Ex: Adiantamento motoboy Carlos, compra de gelo"
                      : "Ex: Reforço de moedas e notas de 2 reais"
                  }
                  className="w-full p-2.5 rounded-xl border border-stone-300"
                />
              </div>

              <button
                type="submit"
                className={`w-full text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md ${
                  txType === "outflow"
                    ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/20"
                    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20"
                }`}
              >
                Confirmar {txType === "outflow" ? "Sangria" : "Suprimento"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaixaTurnoPage;
