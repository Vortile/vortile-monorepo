"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "admin" | "operador";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  pin: string;
}

interface AuthContextType {
  currentUser: User;
  usersList: User[];
  switchUser: (userId: string) => void;
  refreshUsers: () => Promise<void>;
  isAdmin: boolean;
  isOperador: boolean;
}

const defaultAdmin: User = {
  id: "usr_admin_luciano",
  name: "Luciano (Administrador)",
  email: "admin@vorti.com.br",
  phone: "5511987654321",
  role: "admin",
  pin: "1234",
};

const AuthContext = createContext<AuthContextType>({
  currentUser: defaultAdmin,
  usersList: [defaultAdmin],
  switchUser: () => {},
  refreshUsers: async () => {},
  isAdmin: true,
  isOperador: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User>(defaultAdmin);
  const [usersList, setUsersList] = useState<User[]>([defaultAdmin]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.users && data.users.length > 0) {
        setUsersList(data.users);
        // keep current user or default to first admin
        const found = data.users.find((u: User) => u.id === currentUser.id);
        if (found) setCurrentUser(found);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const switchUser = (userId: string) => {
    const target = usersList.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem("vortile_active_user_id", target.id);
    }
  };

  const isAdmin = currentUser.role === "admin";
  const isOperador = currentUser.role === "operador";

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        usersList,
        switchUser,
        refreshUsers: fetchUsers,
        isAdmin,
        isOperador,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
