import { createContext, useContext, useState, useEffect, useRef, type ReactNode } from 'react';

export interface AuthUser {
  token: string;
  username: string;
  role: 'ADMIN' | 'USER';
  userId: number;
  permissions: string[];
}

interface AuthContextType {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isLoggedIn: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Bronze: inactivity timeout = 30 min (matches server-side JWT expiry)
const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('auth');
    return saved ? JSON.parse(saved) : null;
  });

  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth');
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
  };

  const resetInactivityTimer = () => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      logout();
    }, INACTIVITY_TIMEOUT_MS);
  };

  const updateToken = (newToken: string) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, token: newToken };
      localStorage.setItem('auth', JSON.stringify(updated));
      return updated;
    });
  };

  useEffect(() => {
    if (!user) return;
    resetInactivityTimer();
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(e => window.addEventListener(e, resetInactivityTimer, { passive: true }));
    return () => {
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
      events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
    };
  }, [user?.token]);

  useEffect(() => {
    (window as any).__updateAuthToken = updateToken;
    return () => { delete (window as any).__updateAuthToken; };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await fetch('http://localhost:3001/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? 'Login failed');
    }
    const data = await res.json();
    const authUser: AuthUser = {
      token:       data.token,
      username:    data.username,
      role:        data.role,
      userId:      data.userId,
      permissions: data.permissions ?? [],
    };
    setUser(authUser);
    localStorage.setItem('auth', JSON.stringify(authUser));
    resetInactivityTimer();
  };

  /** Silver: check if user has a specific permission */
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true; // admin has all permissions
    return user.permissions.includes(permission);
  };

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      isAdmin:    user?.role === 'ADMIN',
      isLoggedIn: user !== null,
      hasPermission,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
