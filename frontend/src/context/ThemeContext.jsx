import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [tema, setTema] = useState(
    () => localStorage.getItem('tema') || 'dark'
  );

  useEffect(() => {
    // SEMPRE setar o atributo — nunca remover
    document.documentElement.setAttribute('data-theme', tema);
    document.documentElement.style.colorScheme = tema === 'light' ? 'light' : 'dark';
    localStorage.setItem('tema', tema);
  }, [tema]);

  function alternarTema() {
    setTema(t => t === 'dark' ? 'light' : 'dark');
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
