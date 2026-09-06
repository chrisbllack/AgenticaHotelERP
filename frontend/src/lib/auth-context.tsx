import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from './api';

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  permissions?: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('infineon_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('infineon_user');
    if (token && storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem('infineon_user');
        localStorage.removeItem('infineon_token');
        setToken(null);
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const data = response.data;
    
    if (data.success) {
      const { token: newToken, user: userData } = data.data;
      localStorage.setItem('infineon_token', newToken);
      localStorage.setItem('infineon_user', JSON.stringify(userData));
      if (userData?.property_id) {
        localStorage.setItem('infineon_property_id', userData.property_id);
      }
      setToken(newToken);
      setUser(userData);
    } else {
      throw new Error(data.message || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('infineon_token');
    localStorage.removeItem('infineon_user');
    localStorage.removeItem('infineon_property_id');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
