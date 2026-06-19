import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { type UserPermissions, normalizePermissions } from '../utils/permissions';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  role: string;
  permissions: UserPermissions;
  isActive: boolean;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, userData: Omit<AuthUser, 'permissions'> & { permissions?: unknown }) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const loadFromStorage = (): { user: AuthUser | null; token: string | null } => {
  try {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');
    if (!token || !userJson) return { user: null, token: null };
    return { user: JSON.parse(userJson) as AuthUser, token };
  } catch {
    return { user: null, token: null };
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const initial = loadFromStorage();
  const [user, setUser] = useState<AuthUser | null>(initial.user);
  const [token, setToken] = useState<string | null>(initial.token);

  const login = useCallback((newToken: string, userData: Omit<AuthUser, 'permissions'> & { permissions?: unknown }) => {
    const normalizedUser: AuthUser = {
      ...userData,
      permissions: normalizePermissions(userData.permissions, userData.role),
    };
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(normalizedUser));
    setToken(newToken);
    setUser(normalizedUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token && !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
};
