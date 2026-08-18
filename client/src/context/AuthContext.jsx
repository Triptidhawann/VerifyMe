import { createContext, useState, useEffect, useContext } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Validate token and get user on mount
  useEffect(() => {
    const checkLoggedIn = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.getWithAuth('/users/me', token);
        if (response.success) {
          setUser(response.user);
        } else {
          logout();
        }
      } catch (error) {
        console.error("Token verification failed");
        logout();
      }
      setLoading(false);
    };

    checkLoggedIn();
  }, [token]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.success) {
      localStorage.setItem('token', response.token);
      setToken(response.token);
      setUser(response.user);
    }
    return response;
  };

  const signup = async (name, email, password) => {
    const response = await api.post('/auth/signup', { name, email, password });
    if (response.success) {
      localStorage.setItem('token', response.token);
      setToken(response.token);
      setUser(response.user);
    }
    return response;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
