"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  IconMicrophone,
  IconSend,
  IconX,
  IconSparkles,
  IconVolume,
  IconCheck,
} from "@tabler/icons-react";
import { toast } from "sonner";

interface KitchenCopilotModalProps {
  isOpen: boolean;
  autoStartListening?: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const KitchenCopilotModal = ({
  isOpen,
  autoStartListening = false,
  onClose,
  onSuccess,
}: KitchenCopilotModalProps) => {
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastReply, setLastReply] = useState<string | null>(null);
  const [lastTool, setLastTool] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSpeech = useCallback(async (text: string) => {
    if (!text || typeof window === "undefined") return;

    try {
      // 1. Stop any ongoing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      setIsPlayingAudio(true);

      // 2. Fetch studio-quality neural audio from /api/ai/tts (ElevenLabs or Google Neural Stream)
      const res = await fetch("/api/ai/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          speed: 1.15, // Fast operational cadence
        }),
      });

      if (res.ok) {
        const blob = await res.blob();
        const audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(audioUrl);
        audio.playbackRate = 1.15;
        audioRef.current = audio;

        audio.onended = () => {
          setIsPlayingAudio(false);
          URL.revokeObjectURL(audioUrl);
        };
        audio.onerror = () => {
          setIsPlayingAudio(false);
          URL.revokeObjectURL(audioUrl);
        };

        await audio.play();
        return;
      }
    } catch (e: any) {
      console.warn("[Studio TTS playback failed, falling back to browser]:", e?.message);
    }

    // 3. Fallback to browser SpeechSynthesis only if offline/network failed
    try {
      if (window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "pt-BR";
        utterance.rate = 1.15;
        utterance.onend = () => setIsPlayingAudio(false);
        utterance.onerror = () => setIsPlayingAudio(false);
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      setIsPlayingAudio(false);
    }
  }, []);

  const handleSendCommand = useCallback(
    async (textToSend?: string) => {
      const query = textToSend || inputText;
      if (!query.trim() || isProcessing) return;

      setIsProcessing(true);
      setLastReply(null);
      setLastTool(null);

      try {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: query,
            senderRole: "kitchen",
            restaurantId: "rest_vorti_marmitex",
          }),
        });

        const data = await res.json();
        if (data.success && data.reply) {
          setLastReply(data.reply);
          if (data.toolsExecuted && data.toolsExecuted.length > 0) {
            setLastTool(data.toolsExecuted[0].humanMessage || data.toolsExecuted[0].toolName);
          }
          playSpeech(data.reply);
          toast.success("Comando executado!");
          setInputText("");
          onSuccess();
        } else {
          toast.error(data.error || "Não entendi o comando.");
        }
      } catch {
        toast.error("Erro de conexão com o Copilot.");
      } finally {
        setIsProcessing(false);
      }
    },
    [inputText, isProcessing, onSuccess, playSpeech]
  );

  // Initialize Speech Recognition if supported
  useEffect(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "pt-BR";

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          handleSendCommand(transcript);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [handleSendCommand]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current) {
      toast.info("Reconhecimento de voz não suportado neste navegador. Digite seu comando.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch {
        // ignore already started
      }
    }
  }, [isListening]);

  // Auto-start microphone listening when triggered via 2x Space
  useEffect(() => {
    if (isOpen && autoStartListening) {
      const timer = setTimeout(() => {
        toggleListening();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoStartListening, toggleListening]);

  const quickPrompts = [
    "Situação da cozinha agora",
    "Quais pedidos tão abertos?",
    "Pausa o Purê de Batatas",
    "Ficou pronto o Feijão Carioca",
  ];

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-stone-900 text-white w-full max-w-lg rounded-3xl shadow-2xl border border-stone-800 p-6 space-y-5 overflow-hidden relative cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-orange-600 flex items-center justify-center text-white shadow-md shadow-orange-600/30">
              <IconSparkles className="size-4" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">Copilot de Cozinha</h2>
              <p className="text-[11px] text-stone-400">Comandos rápidos por voz e inteligência operacional</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <IconX className="size-5" />
          </button>
        </div>

        {/* Listening / Waveform Area */}
        <div className="bg-stone-950/80 rounded-2xl p-5 border border-stone-800/80 text-center space-y-3">
          <div className="flex justify-center">
            <button
              type="button"
              onClick={toggleListening}
              className={`relative size-16 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? "bg-rose-600 text-white ring-8 ring-rose-600/20 animate-pulse scale-110"
                  : isProcessing
                  ? "bg-amber-600 text-white animate-spin"
                  : "bg-orange-600 text-white hover:bg-orange-500 hover:scale-105 shadow-lg shadow-orange-600/30"
              }`}
            >
              <IconMicrophone className="size-7" />
            </button>
          </div>

          <div>
            <div className="text-xs font-bold text-stone-200">
              {isListening
                ? "Ouvindo sua voz... Fale agora"
                : isProcessing
                ? "Executando comando no sistema..."
                : "Toque no microfone para ditar ou digite abaixo"}
            </div>
            <p className="text-[10px] text-stone-500 mt-0.5">
              Exemplos: &quot;Despacha o 117 com o Marcos&quot; ou &quot;Acabou o bife acebolado&quot;
            </p>
          </div>
        </div>

        {/* Output response if available */}
        {lastReply && (
          <div className="bg-stone-800/80 p-4 rounded-2xl border border-stone-700/60 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-center justify-between text-[10px] font-bold text-orange-400 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <IconCheck className="size-3 text-emerald-400" />
                Resposta da Cozinha
              </span>
              <button
                type="button"
                onClick={() => playSpeech(lastReply)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-bold transition-all ${
                  isPlayingAudio
                    ? "bg-orange-600 text-white animate-pulse"
                    : "text-stone-400 hover:text-white hover:bg-stone-700/60"
                }`}
              >
                <IconVolume className="size-3.5" />
                <span>{isPlayingAudio ? "Falando..." : "Ouvir"}</span>
              </button>
            </div>
            <p className="text-xs text-stone-200 leading-relaxed">{lastReply}</p>
            {lastTool && (
              <div className="text-[10px] text-stone-400 pt-1 border-t border-stone-700/50">
                Ação: {lastTool}
              </div>
            )}
          </div>
        )}

        {/* Text Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendCommand();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            autoFocus
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Digite um comando (ex: pausa o feijão carioca)..."
            className="flex-1 bg-stone-950 text-white placeholder-stone-500 text-xs px-4 py-3 rounded-xl border border-stone-800 focus:outline-none focus:border-orange-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isProcessing}
            className="bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white p-3 rounded-xl transition-all shadow-md shadow-orange-600/20"
          >
            <IconSend className="size-4" />
          </button>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[10px] text-stone-500 font-semibold">Atalhos:</span>
          {quickPrompts.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleSendCommand(p)}
              className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2.5 py-1 rounded-lg border border-stone-700/60 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
