import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, ApiResponse, UserRole } from '../types/index.ts';
import { api } from '../services/api.ts';

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: UserRole;
  schoolName: string;
  className?: string;
  studentName?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<ApiResponse<{ token: string; user: User }>>;
  register: (payload: RegisterPayload) => Promise<ApiResponse<User>>;
  logout: () => Promise<void>;
  updateProfile: (data: {
    name?: string;
    schoolName?: string;
    className?: string;
    studentName?: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => Promise<ApiResponse<User>>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    // If we already have token and user cached, don't show full-screen blocking loader
    return !localStorage.getItem('token');
  });

  const fetchCurrentUser = async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) {
      setUser(null);
      localStorage.removeItem('user');
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.getMe();
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      } else if (res.message && (
        res.message.includes('Unauthorized') ||
        res.message.includes('hết hạn') ||
        res.message.includes('không còn tồn tại')
      )) {
        // Only invalidate session on genuine auth failures, not network/server hiccups
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      // On network failure or connection blip, retain the user session and do NOT log out!
      console.warn('Network hiccup during session check, retaining cached credentials:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const res = await api.login({ email, password });
    if (res.success && res.data) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setToken(res.data.token);
      setUser(res.data.user);
    }
    setIsLoading(false);
    return res;
  };

  const register = async (payload: RegisterPayload) => {
    return await api.register(payload);
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch {
      // Ignore
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
    }
  };

  const updateProfile = async (data: {
    name?: string;
    schoolName?: string;
    className?: string;
    studentName?: string;
    phone?: string;
    currentPassword?: string;
    newPassword?: string;
  }) => {
    const res = await api.updateProfile(data);
    if (res.success && res.data) {
      setUser(res.data);
    }
    return res;
  };

  const refreshUser = async () => {
    await fetchCurrentUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
