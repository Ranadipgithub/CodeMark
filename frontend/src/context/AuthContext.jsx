import { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Axios instance with credentials (so it passes httpOnly cookies automatically)
  const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    withCredentials: true,
  });

  useEffect(() => {
    const checkLoggedin = async () => {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkLoggedin();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, api }}>
      {children}
    </AuthContext.Provider>
  );
};
