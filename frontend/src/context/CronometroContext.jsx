/**
 * CronometroContext.jsx
 * Estado global do cronômetro — persiste entre navegações
 * Sincroniza com o backend a cada 30 segundos
 * O cronômetro SÓ para se o usuário clicar em "Encerrar"
 */

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api   from '../services/api';
import toast from 'react-hot-toast';

const CronometroContext = createContext(null);

export function CronometroProvider({ children }) {
  const [sessao,   setSessao]   = useState(null);   // Dados da sessão (matéria, etc.)
  const [segundos, setSegundos] = useState(0);      // Contador local em segundos
  const [rodando,  setRodando]  = useState(false);  // Cronômetro ativo?
  const [carregando, setCarregando] = useState(true);

  const intervalRef  = useRef(null);   // Ref do setInterval do tick
  const syncRef      = useRef(null);   // Ref do setInterval de sync com backend
  const segundosRef  = useRef(0);      // Ref para acessar segundos dentro de callbacks

  // Manter ref atualizada
  useEffect(() => { segundosRef.current = segundos; }, [segundos]);

  /** Inicia o tick local (1x por segundo) */
  const iniciarTick = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setSegundos(s => s + 1);
    }, 1000);
  }, []);

  /** Para o tick local */
  const pararTick = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  /** Sincroniza segundos com o backend a cada 30s (persistência) */
  const iniciarSync = useCallback(() => {
    if (syncRef.current) clearInterval(syncRef.current);
    syncRef.current = setInterval(async () => {
      try {
        await api.patch('/cronometro/pausar', { duracao_seg: segundosRef.current });
      } catch { /* silencioso */ }
    }, 30000);
  }, []);

  const pararSync = useCallback(() => {
    if (syncRef.current) {
      clearInterval(syncRef.current);
      syncRef.current = null;
    }
  }, []);

  /** Ao montar: verificar se há sessão ativa no backend (restaurar após reload) */
  useEffect(() => {
    api.get('/cronometro/ativa')
      .then(({ data }) => {
        if (data.sessao) {
          setSessao(data.sessao);
          setSegundos(data.sessao.segundos_decorridos || 0);
          setRodando(true);
          iniciarTick();
          iniciarSync();
        }
      })
      .catch(() => {})
      .finally(() => setCarregando(false));

    // Cleanup ao desmontar (ex: logout)
    return () => { pararTick(); pararSync(); };
  }, []);

  /**
   * Iniciar cronômetro com uma matéria
   * @param {number} materiaId
   * @param {string} materiaNome
   * @param {string} materiaCor
   */
  async function iniciar(materiaId, materiaNome, materiaCor) {
    try {
      const { data } = await api.post('/cronometro/iniciar', { materia_id: materiaId });
      setSessao({ ...data.sessao, materia_nome: materiaNome, materia_cor: materiaCor });
      setSegundos(0);
      setRodando(true);
      iniciarTick();
      iniciarSync();
      toast.success(`⏱️ Cronômetro iniciado: ${materiaNome}`);
    } catch {
      toast.error('Erro ao iniciar cronômetro');
    }
  }

  /**
   * Encerrar cronômetro (único jeito de parar)
   * Auto-registra as horas se >= 1 minuto
   */
  async function encerrar() {
    pararTick();
    pararSync();
    try {
      // Enviar segundos finais antes de encerrar
      await api.patch('/cronometro/pausar', { duracao_seg: segundosRef.current });
      const { data } = await api.patch('/cronometro/encerrar');

      setSessao(null);
      setSegundos(0);
      setRodando(false);

      const min = data.duracao_min;
      if (data.auto_registrado) {
        toast.success(`✅ Sessão encerrada: ${min} min — horas registradas automaticamente!`);
      } else {
        toast(`⏹️ Sessão encerrada: ${min} min (< 1 min, não registrado)`, { icon: 'ℹ️' });
      }
    } catch {
      toast.error('Erro ao encerrar cronômetro');
      // Resetar estado mesmo com erro
      setSessao(null);
      setSegundos(0);
      setRodando(false);
    }
  }

  /** Formatar segundos como MM:SS ou HH:MM:SS */
  function formatarTempo(seg) {
    const h  = Math.floor(seg / 3600);
    const m  = Math.floor((seg % 3600) / 60);
    const s  = seg % 60;
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  }

  return (
    <CronometroContext.Provider value={{
      sessao, segundos, rodando, carregando,
      iniciar, encerrar, formatarTempo
    }}>
      {children}
    </CronometroContext.Provider>
  );
}

export function useCronometro() {
  const ctx = useContext(CronometroContext);
  if (!ctx) throw new Error('useCronometro deve ser usado dentro de CronometroProvider');
  return ctx;
}
