"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useAuthUser as useAuthUserHook } from "@Src/lib/hooks/useAuthUser";

interface AuthUser {
  _id: string;
  name: string;
  email?: string;
  address?: string;
  address_solana?: string;
  nickname?: string;
  verified: boolean;
  type: "fan" | "artist";
}

interface AuthUserContextType {
  user: AuthUser | null;
  userId: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const AuthUserContext = createContext<AuthUserContextType | undefined>(
  undefined
);

export function AuthUserProvider({ children }: { children: ReactNode }) {
  // 🔥 Una sola instancia del hook para toda la app
  const authUserData = useAuthUserHook();

  return (
    <AuthUserContext.Provider value={authUserData}>
      {children}
    </AuthUserContext.Provider>
  );
}

// Hook para consumir el contexto
export function useAuthUser(): AuthUserContextType {
  const context = useContext(AuthUserContext);
  if (context === undefined) {
    throw new Error("useAuthUser must be used within an AuthUserProvider");
  }
  return context;
}
