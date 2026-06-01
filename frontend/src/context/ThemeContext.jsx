/**
 * ThemeContext.jsx - Gerencia tema claro/escuro
 * Persiste preferência no localStorage
 */

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // Ler preferência salva (padrão: claro)
  const [tema, setTema] = useState(
    () => localStorage.getItem('tema') || 'light'
  );

  // Aplicar atributo no <html> sempre que o tema mudar
  useEffect(() => {
    const html = document.documentElement;
    if (tema === 'dark') {
      html.setAttribute('data-theme', 'dark');
    } else {
      html.removeAttribute('data-theme');
    }
    localStorage.setItem('tema', tema);
  }, [tema]);

  function alternarTema() {
    setTema(t => t === 'light' ? 'dark' : 'light');
  }

  return (
    <ThemeContext.Provider value={{ tema, alternarTema }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTema() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTema deve ser usado dentro de ThemeProvider');
  return ctx;
}
