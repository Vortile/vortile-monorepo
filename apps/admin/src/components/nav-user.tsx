"use client";

import {
  IconDotsVertical,
  IconUsers,
  IconShieldLock,
  IconMotorbike,
} from "@tabler/icons-react";
import Link from "next/link";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth-context";

export const NavUser = () => {
  const { isMobile } = useSidebar();
  const { currentUser, usersList, switchUser, isAdmin } = useAuth();

  const initials = currentUser.name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              />
            }
          >
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback
                className={`rounded-lg text-white font-bold text-xs ${
                  isAdmin ? "bg-stone-900" : "bg-orange-600"
                }`}
              >
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
              <span className="truncate font-bold text-xs text-stone-900">
                {currentUser.name}
              </span>
              <span className="text-stone-400 truncate text-[10px]">
                {isAdmin ? "Administrador 👑" : "Operador Delivery 🛵"}
              </span>
            </div>
            <IconDotsVertical className="ml-auto size-4 text-stone-400" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64 rounded-2xl p-2 shadow-xl border border-stone-200"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={6}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-1 font-normal">
                <div className="flex items-center gap-2.5 px-1 py-1 text-left">
                  <Avatar className="h-9 w-9 rounded-xl">
                    <AvatarFallback
                      className={`rounded-xl text-white font-bold text-xs ${
                        isAdmin ? "bg-stone-900" : "bg-orange-600"
                      }`}
                    >
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left leading-tight min-w-0">
                    <span className="truncate font-bold text-xs text-stone-900">
                      {currentUser.name}
                    </span>
                    <span className="text-stone-400 truncate text-[10px]">
                      {currentUser.email}
                    </span>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* Quick Switch User List */}
            <div className="px-2 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
              Alternar Usuário Ativo:
            </div>
            {usersList.map((u) => (
              <DropdownMenuItem
                key={u.id}
                onClick={() => {
                  switchUser(u.id);
                  toast.success(`Usuário ativo: ${u.name}`);
                }}
                className={`flex items-center justify-between text-xs rounded-xl px-2 py-1.5 cursor-pointer ${
                  currentUser.id === u.id ? "bg-stone-100 font-bold" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  {u.role === "admin" ? (
                    <IconShieldLock className="size-4 text-stone-800" />
                  ) : (
                    <IconMotorbike className="size-4 text-orange-600" />
                  )}
                  <span>{u.name.split(" ")[0]}</span>
                </div>
                <span className="text-[10px] text-stone-400 uppercase font-mono">
                  {u.role}
                </span>
              </DropdownMenuItem>
            ))}

            {isAdmin && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/usuarios" />}>
                  <IconUsers className="size-4" />
                  <span>Gerenciar Usuários & Equipe</span>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
};
