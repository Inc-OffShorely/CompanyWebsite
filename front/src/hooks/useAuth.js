// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const stored = sessionStorage.getItem('user');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        sessionStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const token = user?.token || null;

  const login = (userData) => {
    sessionStorage.setItem('user', JSON.stringify(userData));
    sessionStorage.setItem('isAuthenticated', 'true');
    setUser(userData);
  };

  const refreshSession = (newToken) => {
    if (!user) return;
    const updatedUser = { ...user, token: newToken };
    sessionStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  const logoutLocal = () => {
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('isAuthenticated');
    setUser(null);
    navigate('/login');
  };

  // ✅ ЕДИНЫЙ ПРАВИЛЬНЫЙ ВЫХОД
  const logoutAndNotifyBackend = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (e) {
      console.error('Logout API error', e);
    } finally {
      logoutLocal();
    }
  };

  return {
    user,
    token,
    loading,
    login,
    logout: logoutAndNotifyBackend, // ⬅️ ВАЖНО
    refreshSession,
  };
};