import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (emailOrPhone: string, password: string) => Promise<void>;
  signup: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (token) {
      refreshUser();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const refreshUser = async () => {
    try {
      const data = await api.auth.getProfile();
      if (data.error) {
        logout();
      } else {
        setUser({
          id: data.id,
          fullName: data.full_name,
          email: data.email,
          phone: data.phone,
          isAffiliate: data.is_affiliate,
          affiliateApproved: data.affiliate_approved,
          affiliateBalance: data.affiliate_balance
        });
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (emailOrPhone: string, password: string) => {
    const data = await api.auth.login(emailOrPhone, password);
    if (data.error) {
      throw new Error(data.error);
    }
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const signup = async (signupData: any) => {
    const data = await api.auth.signup(signupData);
    if (data.error) {
      throw new Error(data.error);
    }
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
