import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('qlinic_token');
    const savedUser = localStorage.getItem('qlinic_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);

    // Listen for profile updates from ProfilePage
    const handleStorageUpdate = () => {
      const updated = localStorage.getItem('qlinic_user');
      if (updated) setUser(JSON.parse(updated));
    };
    window.addEventListener('storage', handleStorageUpdate);
    return () => window.removeEventListener('storage', handleStorageUpdate);
  }, []);

  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    const { token, user: userData } = res.data;
    localStorage.setItem('qlinic_token', token);
    localStorage.setItem('qlinic_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const signup = async (data) => {
    const res = await api.post('/auth/signup', data);
    const { token, user: userData } = res.data;
    localStorage.setItem('qlinic_token', token);
    localStorage.setItem('qlinic_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.removeItem('qlinic_token');
    localStorage.removeItem('qlinic_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
