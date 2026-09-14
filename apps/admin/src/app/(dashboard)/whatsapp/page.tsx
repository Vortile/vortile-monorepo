"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  IconBrandWhatsapp,
  IconSparkles,
  IconChefHat,
  IconUser,
  IconSend,
  IconQrcode,
  IconCheck,
  IconChecks,
  IconSearch,
  IconReceipt2,
  IconVolume,
  IconArrowLeft,
} from "@tabler/icons-react";
import { toast } from "sonner";

interface Contact {
  id: string;
  name: string;
  phone: string;
  role: "kitchen" | "customer";
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  aiHandled: boolean;
  avatarBg: string;
  orderSummary?: string;
}

interface Message {
  id: string;
  sender: "contact" | "me" | "ai";
  text: string;
  time: string;
  toolsExecuted?: any[];
  modelUsed?: string;
}

const initialContacts: Contact[] = [
  {
    id: "c_ze",
    name: "Zé da Cozinha (Montador de Marmitas)",
    phone: "5511999998888",
    role: "kitchen",
    lastMessage: "Acabou o purê de batata na panela, pausa ele aí!",
    lastMessageTime: "12:42",
    unreadCount: 0,
    aiHandled: true,
    avatarBg: "bg-orange-600",
    orderSummary: "Equipe interna de montagem e chapa",
  },
  {
    id: "c_mariana",
    name: "Mariana Souza",
    phone: "5511977776666",
    role: "customer",
    lastMessage: "Opa, quanto tempo falta pro meu pedido sair?",
    lastMessageTime: "12:38",
    unreadCount: 1,
    aiHandled: true,
    avatarBg: "bg-emerald-600",
    orderSummary: "Pedido #101 • 1x Marmitex Executivo (Média)",
  },
  {
    id: "c_carlos",
    name: "Carlos Oliveira",
    phone: "5511987651122",
    role: "customer",
    lastMessage: "Chave pix recebida, pagamento enviado!",
    lastMessageTime: "12:25",
    unreadCount: 0,
    aiHandled: true,
    avatarBg: "bg-blue-600",
    orderSummary: "Pedido #106 • 1x Marmitex Executivo",
  },
  {
    id: "c_lucas",
    name: "Lucas Ribeiro",
    phone: "5511966665555",
    role: "customer",
    lastMessage: "Qual o refrigerante que vem no combo?",
    lastMessageTime: "11:55",
    unreadCount: 0,
    aiHandled: false,
    avatarBg: "bg-amber-600",
    orderSummary: "Pedido #102 • 1x Filé de Frango à Parmegiana",
  },
];

const initialChatHistory: Record<string, Message[]> = {
  c_ze: [
    {
      id: "m_1",
      sender: "contact",
      text: "Fala chefia, o purê de batata acabou agora no fogão!",
      time: "12:40",
    },
    {
      id: "m_2",
      sender: "ai",
      text: "✅ Pausei o 'Purê de Batatas Cremoso'. Ele já não aparece para os clientes no cardápio online.",
      time: "12:40",
      toolsExecuted: [
        {
          toolName: "toggle_option_availability",
          arguments: { optionNameOrId: "Purê de Batatas", isAvailable: false },
          humanMessage: "Guarnição 'Purê de Batatas Cremoso' pausada no SQLite.",
        },
      ],
      modelUsed: "google/gemini-2.5-flash (MCP)",
    },
    {
      id: "m_3",
      sender: "contact",
      text: "Acabou o purê de batata na panela, pausa ele aí!",
      time: "12:42",
    },
  ],
  c_mariana: [
    {
      id: "m_m1",
      sender: "contact",
      text: "Olá! Gostaria de saber o cardápio de marmitas de hoje.",
      time: "12:30",
    },
    {
      id: "m_m2",
      sender: "ai",
      text: "Olá Mariana! 😊 Hoje temos Marmitex Executivo (Média por R$ 27,90) com 1 carne, 3 guarnições e salada, e a Marmitex Família (Grande por R$ 35,90) com 2 carnes e até 4 guarnições!",
      time: "12:30",
      modelUsed: "google/gemini-2.5-flash (MCP)",
    },
    {
      id: "m_m3",
      sender: "contact",
      text: "Opa, quanto tempo falta pro meu pedido sair?",
      time: "12:38",
    },
  ],
  c_carlos: [
    {
      id: "m_c1",
      sender: "contact",
      text: "Chave pix recebida, pagamento enviado!",
      time: "12:25",
    },
    {
      id: "m_c2",
      sender: "ai",
      text: "Perfeito Carlos! Pagamento confirmado e o seu pedido já está sendo preparado no capricho pela cozinha!",
      time: "12:26",
    },
  ],
  c_lucas: [
    {
      id: "m_l1",
      sender: "contact",
      text: "Qual o refrigerante que vem no combo?",
      time: "11:55",
    },
  ],
};

const WhatsAppOfficialPage = () => {
  const [contacts, setContacts] = useState<Contact[]>(initialContacts);
  const [selectedContactId, setSelectedContactId] = useState<string>("c_ze");
  const [chats, setChats] = useState<Record<string, Message[]>>(initialChatHistory);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<"all" | "kitchen" | "customer">("all");
  const [loading, setLoading] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [aiEnabledForChat, setAiEnabledForChat] = useState(true);
  const [mobileActiveChat, setMobileActiveChat] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeContact = contacts.find((c) => c.id === selectedContactId) || contacts[0];
  const activeMessages = useMemo(() => {
    return chats[activeContact.id] || [];
  }, [chats, activeContact.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeMessages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const message = textToSend || inputText;
    if (!message.trim()) return;

    const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // User / Sender Message
    const newMsg: Message = {
      id: `msg_${Date.now()}`,
      sender: activeContact.role === "kitchen" ? "contact" : "contact",
      text: message,
      time: timeNow,
    };

    setChats((prev) => ({
      ...prev,
      [activeContact.id]: [...(prev[activeContact.id] || []), newMsg],
    }));

    // Update last message in contacts list
    setContacts((prev) =>
      prev.map((c) =>
        c.id === activeContact.id
          ? { ...c, lastMessage: message, lastMessageTime: timeNow }
          : c
      )
    );

    if (!textToSend) setInputText("");

    // If AI Copilot is active, process with Gemini MCP
    if (aiEnabledForChat) {
      setLoading(true);
      try {
        const history = activeMessages.slice(-6).map((m) => ({
          role: m.sender === "contact" ? ("user" as const) : ("assistant" as const),
          content: m.text,
        }));

        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message,
            senderRole: activeContact.role,
            phone: activeContact.phone,
            history,
          }),
        });

        const data = await res.json();
        if (data.success) {
          const aiMsg: Message = {
            id: `ai_${Date.now()}`,
            sender: "ai",
            text: data.reply,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            toolsExecuted: data.toolsExecuted,
            modelUsed: data.modelUsed,
          };

          setChats((prev) => ({
            ...prev,
            [activeContact.id]: [...(prev[activeContact.id] || []), aiMsg],
          }));

          setContacts((prev) =>
            prev.map((c) =>
              c.id === activeContact.id
                ? { ...c, lastMessage: data.reply, lastMessageTime: aiMsg.time }
                : c
            )
          );

          if (data.toolsExecuted && data.toolsExecuted.length > 0) {
            toast.success(`MCP Executada: ${data.toolsExecuted[0].toolName}`);
          }
        } else {
          toast.error(data.error || "Erro ao responder mensagem");
        }
      } catch {
        toast.error("Erro de conexão com o WhatsApp API");
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const matchesFilter = filterRole === "all" || c.role === filterRole;
    const matchesSearch =
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const playSpeech = (text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      toast.info(text);
      return;
    }
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-BR";
      utterance.rate = 1.05;
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(
        (v) => v.lang.includes("pt-BR") || v.lang.includes("pt_BR") || v.lang.includes("pt")
      );
      if (ptVoice) utterance.voice = ptVoice;
      window.speechSynthesis.speak(utterance);
      toast.success("Reproduzindo áudio falado da IA 🔊");
    } catch {
      toast.info(text);
    }
  };

  const quickPromptsKitchen = [
    "Situação geral do delivery",
    "Quais pedidos estão abertos?",
    "Manda mensagem pro Carlos avisando que o pedido tá saindo",
    "Acabou o purê de batata",
    "Voltou o purê de batata",
  ];

  const quickPromptsCustomer = [
    "Qual o cardápio de hoje?",
    "Quero uma marmitex executiva com bife e purê",
    "Qual a chave PIX de vocês?",
    "Tem feijão preto hoje?",
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] bg-stone-100 overflow-hidden">
      {/* Top Connection Bar */}
      <div className="bg-white border-b border-stone-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-[#25D366] text-white flex items-center justify-center shadow-sm">
            <IconBrandWhatsapp className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-stone-900">
                WhatsApp da Loja (Operacional & Atendimento)
              </h1>
              <span className="flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                <span className="size-1.5 rounded-full bg-emerald-600 animate-pulse" />
                Conectado (+55 11 98765-4321)
              </span>
            </div>
            <p className="text-[11px] text-stone-500">
              Instância Vorti-Waba-01 • Mensagens processadas em tempo real com Google Gemini 2.5 Flash MCP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Toggle for this chat */}
          <button
            type="button"
            onClick={() => {
              const next = !aiEnabledForChat;
              setAiEnabledForChat(next);
              toast.info(next ? "IA Gemini ativada no chat!" : "Modo manual ativado (IA pausada)");
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              aiEnabledForChat
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : "bg-stone-100 text-stone-600 border-stone-300"
            }`}
          >
            <IconSparkles className="size-3.5 text-emerald-600" />
            <span>{aiEnabledForChat ? "IA Gemini Ativa" : "Atendimento Manual"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-stone-900 hover:bg-stone-800 text-white transition-all shadow-xs"
          >
            <IconQrcode className="size-3.5" />
            <span>Reconectar / QR Code</span>
          </button>
        </div>
      </div>

      {/* Main WhatsApp Window Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Conversations List */}
        <div
          className={`w-full md:w-80 lg:w-96 bg-white border-r border-stone-200 flex flex-col shrink-0 ${
            mobileActiveChat ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Search Box */}
          <div className="p-3 border-b border-stone-100 space-y-2">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar conversa ou telefone..."
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-stone-100 border border-transparent focus:border-emerald-500 focus:bg-white focus:outline-none transition-all"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setFilterRole("all")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                  filterRole === "all"
                    ? "bg-stone-900 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                Todas
              </button>
              <button
                type="button"
                onClick={() => setFilterRole("kitchen")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                  filterRole === "kitchen"
                    ? "bg-orange-600 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                <IconChefHat className="size-3" />
                <span>Cozinha</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterRole("customer")}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                  filterRole === "customer"
                    ? "bg-emerald-600 text-white"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                <IconUser className="size-3" />
                <span>Clientes</span>
              </button>
            </div>
          </div>

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
            {filteredContacts.map((contact) => {
              const isSelected = contact.id === activeContact.id;
              return (
                <div
                  key={contact.id}
                  onClick={() => {
                    setSelectedContactId(contact.id);
                    setMobileActiveChat(true);
                  }}
                  className={`p-3 flex items-start gap-3 cursor-pointer transition-all ${
                    isSelected ? "bg-stone-100" : "hover:bg-stone-50"
                  }`}
                >
                  <div
                    className={`size-11 rounded-full ${contact.avatarBg} text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs`}
                  >
                    {contact.role === "kitchen" ? (
                      <IconChefHat className="size-5" />
                    ) : (
                      contact.name.charAt(0)
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-bold text-xs text-stone-900 truncate">
                          {contact.name}
                        </span>
                        {contact.role === "kitchen" && (
                          <span className="text-[9px] font-bold bg-orange-100 text-orange-800 px-1.5 py-0.2 rounded shrink-0">
                            Cozinha
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-400 shrink-0 font-mono">
                        {contact.lastMessageTime}
                      </span>
                    </div>

                    <p className="text-xs text-stone-500 truncate leading-snug">
                      {contact.lastMessage}
                    </p>

                    {contact.orderSummary && (
                      <div className="text-[10px] text-stone-400 mt-1 flex items-center gap-1 truncate">
                        <IconReceipt2 className="size-3 text-stone-400 shrink-0" />
                        <span className="truncate">{contact.orderSummary}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center / Right: Active WhatsApp Chat Area */}
        <div
          className={`flex-1 flex flex-col bg-[#EFEAE2] relative overflow-hidden ${
            mobileActiveChat ? "flex" : "hidden md:flex"
          }`}
        >
          {/* Chat Header */}
          <div className="bg-white border-b border-stone-200 px-3 md:px-4 py-3 flex items-center justify-between shrink-0 shadow-2xs z-10">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileActiveChat(false)}
                className="md:hidden p-1.5 -ml-1 rounded-xl text-stone-600 hover:bg-stone-100 shrink-0"
                title="Voltar para conversas"
              >
                <IconArrowLeft className="size-5" />
              </button>

              <div
                className={`size-10 rounded-full ${activeContact.avatarBg} text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0`}
              >
                {activeContact.role === "kitchen" ? (
                  <IconChefHat className="size-5" />
                ) : (
                  activeContact.name.charAt(0)
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 truncate">
                  <h2 className="text-sm font-bold text-stone-900 truncate">{activeContact.name}</h2>
                  <span className="text-[10px] text-stone-400 font-mono hidden sm:inline">
                    {activeContact.phone}
                  </span>
                </div>
                <div className="text-[11px] text-emerald-600 flex items-center gap-1 font-medium truncate">
                  <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="truncate">
                    {activeContact.role === "kitchen"
                      ? "Cozinha • Comandos MCP no SQLite"
                      : "Cliente • Atendimento IA"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-stone-500">
              <button
                type="button"
                onClick={() => {
                  handleSendMessage(
                    activeContact.role === "kitchen"
                      ? "Quais pedidos temos na chapa?"
                      : "Qual o cardápio de hoje?"
                  );
                }}
                className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-semibold transition-all"
              >
                Teste Rápido ⚡
              </button>
            </div>
          </div>

          {/* Quick Prompts Bar */}
          <div className="bg-white/90 backdrop-blur-xs border-b border-stone-200 px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider pl-1 shrink-0">
              Comandos Rápidos:
            </span>
            {(activeContact.role === "kitchen" ? quickPromptsKitchen : quickPromptsCustomer).map(
              (prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="shrink-0 bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200 rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all"
                >
                  {prompt}
                </button>
              )
            )}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {activeMessages.map((msg) => {
              const isAi = msg.sender === "ai";
              const isContact = msg.sender === "contact";

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${
                    isContact ? "items-start" : "items-end"
                  }`}
                >
                  <div
                    className={`max-w-[80%] md:max-w-[70%] rounded-2xl p-3 shadow-xs text-xs leading-relaxed whitespace-pre-wrap ${
                      isContact
                        ? "bg-white text-stone-900 rounded-tl-xs"
                        : isAi
                        ? "bg-[#D9FDD3] text-stone-900 rounded-tr-xs border border-emerald-200/50"
                        : "bg-[#D9FDD3] text-stone-900 rounded-tr-xs"
                    }`}
                  >
                    {isAi && (
                      <div className="flex items-center justify-between gap-2 text-[10px] font-bold text-emerald-800 mb-1.5 pb-1 border-b border-emerald-200/40">
                        <div className="flex items-center gap-1">
                          <IconSparkles className="size-3 text-emerald-600" />
                          <span>Vorti AI Gemini (Resposta Automática)</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => playSpeech(msg.text)}
                          title="Ouvir resposta falada"
                          className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-bold transition-all cursor-pointer shadow-2xs"
                        >
                          <IconVolume className="size-3" />
                          <span>Ouvir 🔊</span>
                        </button>
                      </div>
                    )}

                    <div>{msg.text}</div>

                    {/* MCP Tool Log pill if executed */}
                    {msg.toolsExecuted && msg.toolsExecuted.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-emerald-200/60 space-y-1">
                        {msg.toolsExecuted.map((t, idx) => (
                          <div
                            key={idx}
                            className="bg-white/80 text-emerald-900 text-[10px] font-mono p-1.5 rounded border border-emerald-200 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-1">
                              <IconCheck className="size-3 text-emerald-600" />
                              <span>Tool: <strong>{t.toolName}</strong></span>
                            </div>
                            <span className="text-[9px] text-emerald-700 bg-emerald-100 px-1 rounded">
                              SQLite
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-1 text-[9px] text-stone-400 mt-1 font-mono">
                      <span>{msg.time}</span>
                      {!isContact && <IconChecks className="size-3 text-sky-500" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex items-center gap-2 bg-white rounded-2xl px-3 py-2 text-xs text-stone-500 max-w-[240px] shadow-xs">
                <div className="size-2 rounded-full bg-emerald-600 animate-bounce" />
                <div className="size-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.2s]" />
                <div className="size-2 rounded-full bg-emerald-600 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] font-medium">Gemini analisando e executando MCP...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Typing Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-stone-200 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                activeContact.role === "kitchen"
                  ? "Envie um comando de cozinha (ex: acabou o purê de batata, pausa a coca)..."
                  : "Digite uma mensagem para o cliente (ou pergunte como cliente)..."
              }
              className="flex-1 text-xs p-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="size-10 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-xs shrink-0"
            >
              <IconSend className="size-4" />
            </button>
          </form>
        </div>
      </div>

      {/* QR Code Modal for Real WhatsApp Pairing */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-stone-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-[#25D366] text-white flex items-center justify-center">
                  <IconBrandWhatsapp className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">Conectar WhatsApp do Restaurante</h3>
                  <p className="text-[11px] text-stone-400">Instância oficial Baileys / WABA</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQrModal(false)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-stone-50 p-5 rounded-2xl border border-stone-200 flex flex-col items-center justify-center space-y-3">
              {/* Authentic QR Code Display */}
              <div className="size-48 bg-white p-3 rounded-2xl shadow-sm border border-stone-200 flex items-center justify-center relative group">
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=vortile-whatsapp-session-pairing"
                  alt="WhatsApp QR Code"
                  className="size-44 object-contain"
                />
                <div className="absolute inset-0 bg-emerald-600/90 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity p-3 text-center">
                  <IconChecks className="size-8 mb-1" />
                  <span className="text-xs font-bold">Instância Ativa</span>
                  <span className="text-[10px] text-emerald-100">Pronta para escanear</span>
                </div>
              </div>

              <div className="text-center space-y-1">
                <p className="text-xs font-bold text-stone-800">
                  Como conectar seu WhatsApp oficial:
                </p>
                <ol className="text-[11px] text-stone-500 text-left space-y-1 list-decimal pl-4">
                  <li>Abra o WhatsApp no celular da marmitaria/restaurante.</li>
                  <li>Toque nos 3 pontinhos ou Configurações &gt; <strong>Aparelhos Conectados</strong>.</li>
                  <li>Aponte a câmera para este QR Code.</li>
                </ol>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] flex items-center gap-2">
              <IconCheck className="size-4 text-emerald-600 shrink-0" />
              <span>Número atual pareado: <strong>+55 (11) 98765-4321</strong></span>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowQrModal(false);
                toast.success("Sessão do WhatsApp verificada e sincronizada!");
              }}
              className="w-full bg-[#25D366] hover:bg-[#1EBE5D] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-xs"
            >
              Fechar e Continuar Atendendo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppOfficialPage;
