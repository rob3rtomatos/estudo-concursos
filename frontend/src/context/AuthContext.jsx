/**
 * AuthContext.jsx - Contexto global de autenticação
 * Provê: usuario, token, login(), logout(), loading
 */

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario]   = useState(null);
  const [loading, setLoading]   = useState(true);  // Verificar token salvo

  // Ao montar, verificar se há token salvo e validar com o backend
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Definir token no header do axios globalmente
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Verificar se token ainda é válido
      api.get('/auth/me')
        .then(({ data }) => setUsuario(data.usuario))
        .catch(() => {
          // Token inválido: limpar
          localStorage.removeItem('token');
          delete api.defaults.headers.common['Authorization'];
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  /**
   * Fazer login: salva token e usuário no estado
   * @param {string} token
   * @param {{ id, nome, email }} dadosUsuario
   */
  function login(token, dadosUsuario) {
    localStorage.setItem('token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUsuario(dadosUsuario);
  }

  /** Deslogar: limpa token e estado */
  function logout() {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Hook para acessar o contexto de autenticação */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
