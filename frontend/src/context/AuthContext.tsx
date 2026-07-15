import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';

interface UserType {
  id: string;
  name: string;
  email: string;
  avatar: string;
  currency: string;
  language: string;
  theme: string;
  notifications: {
    budgetAlerts: boolean;
    billReminders: boolean;
    savingsSummary: boolean;
  };
  isVerified: boolean;
}

interface AuthContextType {
  user: UserType | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  verify: (email: string, code: string) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<UserType>) => Promise<void>;
  uploadAvatar: (formData: FormData) => Promise<string>;
  resendCode: (email: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessionUser = async () => {
      const token = localStorage.getItem('pocketpilot-token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await API.get('/profile');
        setUser(response.data);
      } catch (err) {
        console.error('Session restoration failed', err);
        localStorage.removeItem('pocketpilot-token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchSessionUser();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await API.post('/auth/login', { email, password });
    const { token, user: loggedUser } = res.data;
    localStorage.setItem('pocketpilot-token', token);
    setUser(loggedUser);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await API.post('/auth/register', { name, email, password });
    if (res.data && res.data.token) {
      const { token, user: loggedUser } = res.data;
      localStorage.setItem('pocketpilot-token', token);
      setUser(loggedUser);
    }
  };

  const verify = async (email: string, code: string) => {
    const res = await API.post('/auth/verify-email', { email, code });
    const { token, user: verifiedUser } = res.data;
    localStorage.setItem('pocketpilot-token', token);
    setUser(verifiedUser);
  };

  const resendCode = async (email: string) => {
    await API.post('/auth/resend-code', { email });
  };

  const forgotPassword = async (email: string) => {
    await API.post('/auth/forgot-password', { email });
  };

  const resetPassword = async (email: string, code: string, password: string) => {
    await API.post('/auth/reset-password', { email, code, password });
  };

  const logout = () => {
    localStorage.removeItem('pocketpilot-token');
    setUser(null);
  };

  const updateProfile = async (data: Partial<UserType>) => {
    const res = await API.put('/profile', data);
    setUser(res.data.user);
  };

  const uploadAvatar = async (formData: FormData): Promise<string> => {
    const res = await API.post('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    const url = res.data.avatarUrl;
    setUser((prev) => prev ? { ...prev, avatar: url } : null);
    return url;
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      verify,
      logout,
      updateProfile,
      uploadAvatar,
      resendCode,
      forgotPassword,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
