"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiRequest, ApiError } from "@/lib/api";

const AUTH_KEY = "arkan-auth";

export type AuthUser = {
  id: number | string;
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string;
  is_staff?: boolean;
  permissions?: string[];
};

type AuthSession = {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
};

type RegisterInput = {
  name: string;
  phone: string;
  password: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  canAccessDashboard: boolean;
  login: (identifier: string, password: string) => Promise<AuthUser>;
  register: (input: RegisterInput) => Promise<AuthUser>;
  logout: () => Promise<void>;
  hasPermission: (code: string) => boolean;
};

type LoginResponse = {
  user: AuthUser;
  access_token: string;
  refresh_token?: string;
  token?: string;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.accessToken || !parsed?.user) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeSession(session: AuthSession | null) {
  if (!session) {
    localStorage.removeItem(AUTH_KEY);
    return;
  }
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
}

function canUseDashboard(user: AuthUser | null) {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (user.is_staff) return true;
  return (user.permissions ?? []).includes("dashboard.read");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setSession(readSession());
    setLoading(false);
  }, []);

  const applyAuthResponse = useCallback((data: LoginResponse) => {
    const next: AuthSession = {
      user: {
        ...data.user,
        permissions: data.user.permissions ?? [],
      },
      accessToken: data.access_token || data.token || "",
      refreshToken: data.refresh_token,
    };

    if (!next.accessToken) {
      throw new ApiError("لم يتم استلام رمز الدخول من الخادم", 500);
    }

    writeSession(next);
    setSession(next);
    return next.user;
  }, []);

  const login = useCallback(
    async (identifier: string, password: string) => {
      const trimmed = identifier.trim();
      const isEmail = trimmed.includes("@");
      const body = isEmail
        ? { email: trimmed, password }
        : { phone: trimmed, password };

      const data = await apiRequest<LoginResponse>("/login", {
        method: "POST",
        body,
      });

      return applyAuthResponse(data);
    },
    [applyAuthResponse],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      const data = await apiRequest<LoginResponse>("/user/register", {
        method: "POST",
        body: {
          name: input.name.trim(),
          phone: input.phone.trim(),
          password: input.password,
        },
      });
      return applyAuthResponse(data);
    },
    [applyAuthResponse],
  );

  const logout = useCallback(async () => {
    const token = session?.accessToken;
    const refresh = session?.refreshToken;
    try {
      if (token) {
        await apiRequest("/logout", {
          method: "POST",
          token,
          body: refresh ? { refresh_token: refresh } : {},
        });
      }
    } catch {
      // ignore logout network errors
    } finally {
      writeSession(null);
      setSession(null);
    }
  }, [session]);

  const hasPermission = useCallback(
    (code: string) => {
      const user = session?.user;
      if (!user) return false;
      if (user.role === "admin") return true;
      return (user.permissions ?? []).includes(code);
    },
    [session],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      loading,
      isAuthenticated: !!session?.accessToken,
      canAccessDashboard: canUseDashboard(session?.user ?? null),
      login,
      register,
      logout,
      hasPermission,
    }),
    [session, loading, login, register, logout, hasPermission],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
