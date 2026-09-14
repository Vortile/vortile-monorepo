"use client";

import React, { useState, useEffect } from "react";
import {
  IconUsers,
  IconUserPlus,
  IconShieldLock,
  IconMotorbike,
  IconCheck,
  IconX,
  IconTrash,
  IconKey,
  IconMail,
  IconPhone,
  IconInfoCircle,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { useAuth, UserRole } from "@/lib/auth-context";

interface UserItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  pin: string;
  isActive: boolean;
  createdAt: string;
}

const UsuariosPage = () => {
  const { currentUser, switchUser, refreshUsers, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New user form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<UserRole>("operador");
  const [pin, setPin] = useState("1234");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.users) {
        setUsers(data.users);
      }
    } catch (e) {
      toast.error("Erro ao carregar usuários");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone) {
      toast.warning("Preencha todos os campos obrigatórios");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          role,
          pin,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Usuário ${name} cadastrado com sucesso! 🎉`);
        setShowAddModal(false);
        setName("");
        setEmail("");
        setPhone("");
        setPin("1234");
        fetchUsers();
        refreshUsers();
      } else {
        toast.error(data.error || "Erro ao cadastrar usuário");
      }
    } catch (e) {
      toast.error("Erro na comunicação com o servidor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (userId === currentUser.id) {
      toast.warning("Você não pode excluir o seu próprio usuário atual!");
      return;
    }

    if (!confirm(`Tem certeza que deseja remover ${userName}?`)) return;

    try {
      const res = await fetch(`/api/users?id=${userId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success(`Usuário ${userName} removido.`);
        fetchUsers();
        refreshUsers();
      } else {
        toast.error("Erro ao remover usuário");
      }
    } catch (e) {
      toast.error("Erro na comunicação");
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex-1 p-8 flex flex-col items-center justify-center text-center space-y-3">
        <div className="size-14 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center">
          <IconShieldLock className="size-7" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">Acesso Restrito a Administradores</h2>
        <p className="text-xs text-stone-500 max-w-sm">
          Seu usuário atual está configurado como <strong>Operador de Delivery</strong>. Apenas administradores podem cadastrar pessoas e gerenciar acessos.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black text-stone-900 tracking-tight">
              Gestão de Usuários & Cargos
            </h1>
            <span className="bg-stone-100 text-stone-700 text-xs font-bold px-2.5 py-0.5 rounded-full border border-stone-200">
              {users.length} usuários
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Cadastre novos operadores de delivery e administradores da loja com permissões e PINs dedicados.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white transition-all shadow-sm shadow-orange-600/20"
        >
          <IconUserPlus className="size-4" />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Role Switcher Demo Box */}
      <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <IconInfoCircle className="size-4 text-orange-600 shrink-0" />
          <span>
            Usuário conectado agora: <strong>{currentUser.name}</strong> ({currentUser.role === "admin" ? "Administrador" : "Operador"})
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-stone-400 font-medium">Trocar usuário ativo:</span>
          {users.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => {
                switchUser(u.id);
                toast.success(`Alternado para: ${u.name} (${u.role})`);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                currentUser.id === u.id
                  ? "bg-stone-900 text-white border-stone-900"
                  : "bg-white text-stone-600 border-stone-200 hover:border-stone-300"
              }`}
            >
              {u.name.split(" ")[0]} ({u.role})
            </button>
          ))}
        </div>
      </div>

      {/* Users List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {users.map((user) => {
          const isMe = user.id === currentUser.id;
          const userIsAdmin = user.role === "admin";

          return (
            <div
              key={user.id}
              className="bg-white rounded-2xl p-5 border border-stone-200 shadow-xs space-y-4 hover:border-stone-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`size-11 rounded-2xl flex items-center justify-center font-bold text-white shadow-xs ${
                        userIsAdmin ? "bg-stone-900" : "bg-orange-600"
                      }`}
                    >
                      {userIsAdmin ? <IconShieldLock className="size-5" /> : <IconMotorbike className="size-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-stone-900 text-sm">{user.name}</h3>
                        {isMe && (
                          <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                            Você
                          </span>
                        )}
                      </div>
                      <span
                        className={`inline-block text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded mt-0.5 ${
                          userIsAdmin
                            ? "bg-stone-100 text-stone-800"
                            : "bg-orange-50 text-orange-800 border border-orange-200"
                        }`}
                      >
                        {userIsAdmin ? "Administrador" : "Operador de Delivery"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-stone-500 pt-2 border-t border-stone-100">
                  <div className="flex items-center gap-2 truncate">
                    <IconMail className="size-3.5 text-stone-400 shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconPhone className="size-3.5 text-stone-400 shrink-0" />
                    <span>{user.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <IconKey className="size-3.5 text-stone-400 shrink-0" />
                    <span>PIN de Acesso: •••• ({user.pin})</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                <span className="text-[10px] text-stone-400">
                  Criado em {new Date(user.createdAt).toLocaleDateString()}
                </span>
                {!isMe && (
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(user.id, user.name)}
                    className="text-stone-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Excluir Usuário"
                  >
                    <IconTrash className="size-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add User */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl space-y-4 border border-stone-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
                <IconUserPlus className="size-5 text-orange-600" />
                <span>Cadastrar Novo Usuário</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João da Silva"
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  E-mail de Acesso *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="joao@vorti.com.br"
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  WhatsApp / Celular *
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 98765-4321"
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Cargo / Nível de Acesso *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("operador")}
                    className={`p-3 rounded-xl border font-bold text-left flex flex-col gap-0.5 transition-all ${
                      role === "operador"
                        ? "bg-orange-50 border-orange-600 text-orange-950 shadow-xs"
                        : "border-stone-200 text-stone-600 bg-stone-50"
                    }`}
                  >
                    <span className="text-xs">🛵 Operador de Delivery</span>
                    <span className="text-[10px] font-normal text-stone-500">
                      Esteira de pedidos, motoboy e WhatsApp.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`p-3 rounded-xl border font-bold text-left flex flex-col gap-0.5 transition-all ${
                      role === "admin"
                        ? "bg-stone-900 border-stone-900 text-white shadow-xs"
                        : "border-stone-200 text-stone-600 bg-stone-50"
                    }`}
                  >
                    <span className="text-xs">👑 Administrador</span>
                    <span className="text-[10px] font-normal text-stone-400">
                      Acesso total a financeiro, equipe e cardápio.
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  PIN Rápido (4 dígitos)
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="1234"
                  className="w-32 p-2.5 rounded-xl border border-stone-300 font-mono text-center text-sm font-bold tracking-widest"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md shadow-orange-600/20"
              >
                {isSubmitting ? "Cadastrando..." : "Confirmar Cadastro"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuariosPage;
