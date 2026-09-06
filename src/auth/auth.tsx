import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { users } from "../data/demo";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export const DEMO_PASSWORD = "demo1234";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = useCallback((email: string, password: string): { ok: boolean; error?: string } => {
    if (password !== DEMO_PASSWORD) return { ok: false, error: "Incorrect password. Demo password is demo1234." };
    const found = users.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!found) {
      return { ok: false, error: "No account with that email. Try one of the demo accounts below." };
    }
    setUser(found);
    return { ok: true };
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
