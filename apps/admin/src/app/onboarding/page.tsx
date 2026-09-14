"use client";

import { useState, useEffect, useCallback } from "react";
import {
  IconArrowRight,
  IconArrowLeft,
  IconCheck,
  IconFlame,
  IconBrandWhatsapp,
  IconSparkles,
  IconVolume,
  IconRocket,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const TOTAL_STEPS = 6;

const OnboardingPage = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Form State
  const [storeName, setStoreName] = useState("Marmitaria Sabor & Arte");
  const [storeCategory, setStoreCategory] = useState("Marmitex & Comida Caseira");
  const [whatsapp, setWhatsapp] = useState("(11) 98765-4321");
  const [deliveryFee, setDeliveryFee] = useState("5.50");
  const [avgDeliveryTime, setAvgDeliveryTime] = useState("30 - 45 min");
  const [minOrderAmount, setMinOrderAmount] = useState("20.00");
  const [pixKey, setPixKey] = useState("financeiro@vorti.com.br");
  const [pixKeyType, setPixKeyType] = useState("email");

  // Step 5: Interactive Tutorial Voice Text
  const tutorialSpokenText =
    "Entendido! Pausei o purê de batata no cardápio agora mesmo e nenhum cliente consegue pedir até você reativar.";

  // Handle Speech Audio Playback
  const handlePlayTutorialVoice = () => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      toast.info(tutorialSpokenText);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(tutorialSpokenText);
      utterance.lang = "pt-BR";
      utterance.rate = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(
        (v) => v.lang.includes("pt-BR") || v.lang.includes("pt_BR") || v.lang.includes("pt")
      );
      if (ptVoice) utterance.voice = ptVoice;

      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);

      window.speechSynthesis.speak(utterance);
      toast.success("Reproduzindo voz falada da IA 🔊");
    } catch {
      setIsPlayingAudio(false);
      toast.info(tutorialSpokenText);
    }
  };

  const handleNextStep = useCallback(() => {
    if (currentStep === 1 && !storeName.trim()) {
      toast.warning("Por favor informe o nome do restaurante.");
      return;
    }
    if (currentStep === 2 && !whatsapp.trim()) {
      toast.warning("Informe o WhatsApp para pedidos.");
      return;
    }
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, storeName, whatsapp]);

  // Keyboard navigation: Enter to advance
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && currentStep < TOTAL_STEPS) {
        e.preventDefault();
        handleNextStep();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, handleNextStep]);

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  // Final Submit
  const handleFinishOnboarding = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: storeName,
          category: storeCategory,
          whatsapp,
          deliveryFee: Number(deliveryFee) || 5.5,
          avgDeliveryTime,
          minOrderAmount: Number(minOrderAmount) || 20.0,
          pixKey,
          pixKeyType,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Configuração concluída com sucesso! 🚀");
        router.push("/");
      } else {
        toast.error(data.error || "Erro ao salvar dados.");
      }
    } catch {
      toast.error("Erro na comunicação com o servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoriesList = [
    "Marmitex & Comida Caseira",
    "Hamburgueria Artesanal",
    "Pizzaria & Massas",
    "Açaí & Sobremesas",
    "Lanchonete & Salgados",
  ];

  const progressPercent = Math.round((currentStep / TOTAL_STEPS) * 100);

  return (
    <div className="flex-1 flex flex-col justify-between max-w-2xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 box-border overflow-x-hidden">
      {/* Top Header & Progress */}
      <header className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <div className="size-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold shadow-md shadow-orange-600/20">
              <IconFlame className="size-4" />
            </div>
            <span className="font-bold text-sm tracking-tight text-stone-900">
              Vortile Delivery
            </span>
          </div>
          <span className="text-xs font-semibold text-stone-400 shrink-0">
            Passo {currentStep} de {TOTAL_STEPS}
          </span>
        </div>

        {/* Fluid Progress Bar */}
        <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-orange-600 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Main Step Container (1 input / 1 tutorial at a time) */}
      <main className="my-auto py-8">
        {/* Step 1: Store Name */}
        {currentStep === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div>
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                Passo 1 • Identificação
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-stone-900 mt-1 tracking-tight break-words">
                Qual é o nome do seu restaurante?
              </h1>
              <p className="text-xs md:text-sm text-stone-500 mt-1">
                Esse nome aparecerá no topo do seu Cardápio Web e nas mensagens oficiais da IA.
              </p>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                autoFocus
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                placeholder="Ex: Marmitaria da Dona Neide"
                className="w-full text-lg md:text-xl font-bold p-4 rounded-2xl border-2 border-stone-300 bg-white focus:border-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-600/10 shadow-xs transition-all"
              />

              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700">
                  Categoria principal da cozinha:
                </label>
                <div className="flex flex-wrap gap-2">
                  {categoriesList.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setStoreCategory(cat)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                        storeCategory === cat
                          ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                          : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Store WhatsApp */}
        {currentStep === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div>
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                Passo 2 • Canal de Atendimento
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-stone-900 mt-1 tracking-tight break-words">
                Qual o WhatsApp oficial da sua loja?
              </h1>
              <p className="text-xs md:text-sm text-stone-500 mt-1">
                É por esse número que os clientes enviam pedidos e a equipe comanda a cozinha pelo WhatsApp.
              </p>
            </div>

            <div className="space-y-3">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400">
                  <IconBrandWhatsapp className="size-6 text-emerald-600" />
                </div>
                <input
                  type="text"
                  autoFocus
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full text-lg md:text-xl font-bold pl-14 p-4 rounded-2xl border-2 border-stone-300 bg-white focus:border-emerald-600 focus:outline-none focus:ring-4 focus:ring-emerald-600/10 shadow-xs transition-all"
                />
              </div>
              <p className="text-[11px] text-stone-400">
                💡 Você poderá escanear o QR Code no painel para conectar o WhatsApp Web da sua loja.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Delivery Rules */}
        {currentStep === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div>
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                Passo 3 • Entrega & Prazos
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-stone-900 mt-1 tracking-tight break-words">
                Como funcionam as entregas?
              </h1>
              <p className="text-xs md:text-sm text-stone-500 mt-1">
                Defina a taxa padrão de entrega e o tempo médio que o cliente costuma esperar.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">
                  Taxa de Entrega (R$)
                </label>
                <input
                  type="number"
                  step="0.50"
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  className="w-full text-base font-bold p-3.5 rounded-xl border-2 border-stone-300 bg-white focus:border-orange-600 focus:outline-none shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">
                  Tempo Estimado
                </label>
                <input
                  type="text"
                  value={avgDeliveryTime}
                  onChange={(e) => setAvgDeliveryTime(e.target.value)}
                  placeholder="30 - 45 min"
                  className="w-full text-base font-bold p-3.5 rounded-xl border-2 border-stone-300 bg-white focus:border-orange-600 focus:outline-none shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-stone-700">
                  Pedido Mínimo (R$)
                </label>
                <input
                  type="number"
                  step="1.00"
                  value={minOrderAmount}
                  onChange={(e) => setMinOrderAmount(e.target.value)}
                  className="w-full text-base font-bold p-3.5 rounded-xl border-2 border-stone-300 bg-white focus:border-orange-600 focus:outline-none shadow-xs"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 4: PIX Key */}
        {currentStep === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div>
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
                Passo 4 • Pagamentos Instantâneos
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-stone-900 mt-1 tracking-tight break-words">
                Recebimento via PIX
              </h1>
              <p className="text-xs md:text-sm text-stone-500 mt-1">
                A chave PIX é exibida automaticamente no checkout do cliente com botão de copia e cola.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { id: "email", label: "E-mail" },
                  { id: "phone", label: "Celular" },
                  { id: "cpf", label: "CPF" },
                  { id: "cnpj", label: "CNPJ" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setPixKeyType(t.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      pixKeyType === t.id
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                        : "bg-white text-stone-700 border-stone-200"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                autoFocus
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="Insira sua chave PIX aqui"
                className="w-full text-lg font-bold p-4 rounded-2xl border-2 border-stone-300 bg-white focus:border-emerald-600 focus:outline-none shadow-xs"
              />
            </div>
          </div>
        )}

        {/* Step 5: Interactive Tutorial (Spoken Voice AI) */}
        {currentStep === 5 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div>
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1">
                <IconSparkles className="size-3.5 text-emerald-600" />
                Passo 5 • Como o Copilot com IA Funciona
              </span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-stone-900 mt-1 tracking-tight break-words">
                Comandos por Voz & Ações Reais
              </h1>
              <p className="text-xs md:text-sm text-stone-500 mt-1">
                Ao contrário de robôs com menus burros, a IA da Vortile entende linguagem falada e age diretamente no cardápio online.
              </p>
            </div>

            {/* Interactive Demo Card */}
            <div className="p-5 rounded-2xl bg-white border-2 border-orange-200 shadow-md space-y-4">
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold shrink-0">
                  🗣️
                </div>
                <div>
                  <span className="text-[11px] font-bold text-orange-600 uppercase tracking-wider">
                    Exemplo real de cozinha:
                  </span>
                  <p className="text-sm font-bold text-stone-900 mt-0.5">
                    &quot;Acabou o purê de batata, pausa ele no cardápio agora!&quot;
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                    <IconSparkles className="size-4 text-emerald-600" />
                    <span>Resposta da IA (100% Falável & Sem Listas):</span>
                  </div>
                  <button
                    type="button"
                    onClick={handlePlayTutorialVoice}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all shadow-xs ${
                      isPlayingAudio
                        ? "bg-stone-900 animate-pulse"
                        : "bg-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    <IconVolume className="size-3.5" />
                    <span>{isPlayingAudio ? "Reproduzindo..." : "Ouvir Áudio 🔊"}</span>
                  </button>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed italic">
                  &quot;{tutorialSpokenText}&quot;
                </p>
              </div>

              <div className="text-[11px] text-stone-500 flex items-center gap-1.5 pt-1">
                <IconCheck className="size-4 text-emerald-600" />
                <span>O item é pausado no banco SQLite no mesmo segundo.</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Confirmation & Finalization */}
        {currentStep === 6 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-200 text-center py-4">
            <div className="size-16 rounded-3xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-sm">
              <IconRocket className="size-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl md:text-3xl font-black text-stone-900 tracking-tight">
                Tudo pronto para começar!
              </h1>
              <p className="text-xs md:text-sm text-stone-500 max-w-md mx-auto">
                Sua loja está configurada no banco de dados local com cardápio digital e integração WhatsApp ativa.
              </p>
            </div>

            <div className="max-w-md mx-auto p-4 rounded-2xl bg-white border border-stone-200 text-left space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Restaurante:</span>
                <span className="font-bold text-stone-900">{storeName}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">WhatsApp Oficial:</span>
                <span className="font-bold text-stone-900">{whatsapp}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-stone-100">
                <span className="text-stone-500">Taxa de Entrega:</span>
                <span className="font-bold text-stone-900">R$ {Number(deliveryFee).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-stone-500">Chave PIX:</span>
                <span className="font-bold text-stone-900">{pixKey}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer Navigation Buttons */}
      <footer className="pt-6 border-t border-stone-200 flex items-center justify-between">
        {currentStep > 1 ? (
          <button
            type="button"
            onClick={handlePrevStep}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-200/60 transition-all"
          >
            <IconArrowLeft className="size-4" />
            <span>Voltar</span>
          </button>
        ) : (
          <div />
        )}

        {currentStep < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs md:text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-600/20 transition-all"
          >
            <span>Continuar</span>
            <IconArrowRight className="size-4" />
          </button>
        ) : (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleFinishOnboarding}
            className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-xs md:text-sm font-bold bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white shadow-md shadow-emerald-600/20 transition-all"
          >
            <span>{isSubmitting ? "Salvando..." : "Ir para a Esteira de Pedidos 🚀"}</span>
          </button>
        )}
      </footer>
    </div>
  );
};

export default OnboardingPage;
