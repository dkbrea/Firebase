"use client";

import type { User } from "@/types";
import { useRouter } from "next/navigation";
import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Mock checking for an existing session
    const mockSession = localStorage.getItem("mockUserSession");
    if (mockSession) {
      setUser(JSON.parse(mockSession));
    }
    setLoading(false);
  }, []);

  const login = (email: string) => {
    const mockUser: User = { id: "1", email, name: email.split("@")[0] };
    setUser(mockUser);
    localStorage.setItem("mockUserSession", JSON.stringify(mockUser));
    router.push("/dashboard");
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("mockUserSession");
    router.push("/auth");
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
