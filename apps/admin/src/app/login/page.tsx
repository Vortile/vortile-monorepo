"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IconFlame, IconShieldLock, IconMotorbike, IconArrowRight } from "@tabler/icons-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";

const LoginPage = () => {
  const router = useRouter();
  const { switchUser } = useAuth();
  const [identifier, setIdentifier] = useState("admin@vorti.com.br");
  const [pin, setPin] = useState("1234");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!identifier || !pin) {
      toast.warning("Informe o e-mail/telefone e o PIN");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrPhone: identifier, pin }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        toast.success(`Bem-vindo, ${data.user.name}!`);
        switchUser(data.user.id);
        router.push("/");
      } else {
        toast.error(data.error || "PIN ou identificador incorreto.");
      }
    } catch {
      toast.error("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  };

  const quickLoginAs = (email: string, userPin: string, userId: string) => {
    setIdentifier(email);
    setPin(userPin);
    switchUser(userId);
    setTimeout(() => {
      handleLogin();
    }, 50);
  };

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-900 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="size-12 rounded-2xl bg-[#0066FF] text-white flex items-center justify-center font-bold shadow-lg shadow-[#0066FF]/25 mx-auto">
            <IconFlame className="size-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-stone-900">Vortile Delivery</h1>
          <p className="text-xs text-stone-500">
            Acesso operacional para administradores e operadores de cozinha
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-xl space-y-5">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                E-mail ou WhatsApp
              </label>
              <input
                type="text"
                autoFocus
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@vorti.com.br"
                className="w-full text-xs p-3 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-orange-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1.5">
                PIN de Acesso (4 dígitos)
              </label>
              <input
                type="password"
                maxLength={6}
                required
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full text-lg tracking-widest text-center font-mono p-2.5 rounded-xl border border-stone-200 bg-stone-50 focus:bg-white focus:outline-none focus:border-orange-500 transition-all font-bold"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-stone-900/20 transition-all"
            >
              <span>{loading ? "Entrando..." : "Acessar Sistema"}</span>
              <IconArrowRight className="size-4" />
            </button>
          </form>

          {/* Quick Access Switcher for Restaurant Staff */}
          <div className="pt-4 border-t border-stone-100 space-y-2.5">
            <span className="text-[11px] font-bold text-stone-400 uppercase tracking-wider block text-center">
              Acesso Rápido de Demonstração
            </span>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => quickLoginAs("admin@vorti.com.br", "1234", "usr_admin_luciano")}
                className="p-2.5 rounded-xl border border-stone-200 hover:border-orange-500/50 bg-stone-50 hover:bg-orange-50/40 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 group-hover:text-orange-600">
                  <IconShieldLock className="size-4 text-orange-600 shrink-0" />
                  <span>Luciano</span>
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">Admin (Acesso Total)</div>
              </button>

              <button
                type="button"
                onClick={() => quickLoginAs("operador@vorti.com.br", "4321", "usr_operador_mateus")}
                className="p-2.5 rounded-xl border border-stone-200 hover:border-orange-500/50 bg-stone-50 hover:bg-orange-50/40 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 group-hover:text-orange-600">
                  <IconMotorbike className="size-4 text-emerald-600 shrink-0" />
                  <span>Mateus</span>
                </div>
                <div className="text-[10px] text-stone-500 mt-0.5">Operador (Esteira/WPP)</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
