/**
 * api.js - Instância do Axios configurada para o backend
 * Usa proxy do Vite em dev (/api → http://backend:5000/api)
 */

import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  // Em produção usar VITE_API_URL; em dev o proxy do Vite redireciona /api
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
});

// Interceptor de resposta: exibir toast de erro automático em 4xx/5xx
api.interceptors.response.use(
  response => response,
  error => {
    const msg = error.response?.data?.erro || 'Erro de conexão com o servidor';
    // Não mostrar toast em 401 (será tratado pela lógica de auth)
    if (error.response?.status !== 401) {
      toast.error(msg);
    }
    return Promise.reject(error);
  }
);

export default api;
