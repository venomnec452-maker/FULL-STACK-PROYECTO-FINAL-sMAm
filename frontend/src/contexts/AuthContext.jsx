import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../api/client';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('stockmaster_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('stockmaster_token') || null);
  const [isLoading, setIsLoading] = useState(true);

  // Al montar la aplicación, verificar la sesión con /auth/me
  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('stockmaster_token');
      if (storedToken) {
        try {
          const res = await apiClient.get('/auth/me');
          setUser(res.data.data.user);
          localStorage.setItem('stockmaster_user', JSON.stringify(res.data.data.user));
        } catch (error) {
          console.warn('[AuthContext] Sesión no válida o expirada.');
          setUser(null);
          setToken(null);
          localStorage.removeItem('stockmaster_token');
          localStorage.removeItem('stockmaster_user');
        }
      }
      setIsLoading(false);
    };

    verifySession();
  }, []);

  const login = async (email, password) => {
    const res = await apiClient.post('/auth/login', { email, password });
    const { user: userData, accessToken } = res.data.data;

    setUser(userData);
    setToken(accessToken);

    localStorage.setItem('stockmaster_token', accessToken);
    localStorage.setItem('stockmaster_user', JSON.stringify(userData));

    return userData;
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Ignorar error de red al salir
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('stockmaster_token');
      localStorage.removeItem('stockmaster_user');
    }
  };

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isAdmin: user?.role === 'admin',
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser utilizado dentro de un AuthProvider');
  }
  return context;
};
