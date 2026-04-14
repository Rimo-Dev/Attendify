import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { api, clearAuthStorage, getStoredUser, storeAuth } from "../lib/api";
import type { ApiResponse, EmployeeUser } from "../types";

interface AuthContextValue {
  user: EmployeeUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<EmployeeUser | null>(() => {
    const stored = getStoredUser();
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  async function refreshMe() {
    try {
      const response = await api.get<ApiResponse<EmployeeUser>>("/auth/me");
      setUser(response.data.data);
      const token = localStorage.getItem("attendify_token");
      if (token) {
        storeAuth(token, JSON.stringify(response.data.data));
      }
    } catch {
      clearAuthStorage();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("attendify_token");
    if (!token) {
      setLoading(false);
      return;
    }
    refreshMe();
  }, []);

  async function login(email: string, password: string) {
    const response = await api.post<ApiResponse<{ token: string; user: EmployeeUser }>>("/auth/login", { email, password });
    storeAuth(response.data.data.token, JSON.stringify(response.data.data.user));
    setUser(response.data.data.user);
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } finally {
      clearAuthStorage();
      setUser(null);
    }
  }

  const value = useMemo(() => ({ user, loading, login, logout, refreshMe }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }
  return context;
}
