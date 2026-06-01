/**
 * CronometroContext.jsx
 * Estados possíveis:
 *   rodando=true  pausado=false → timer contando
 *   rodando=true  pausado=true  → timer pausado (congelado)
 *   rodando=false               → sem sessão ativa
 */

import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api   from '../services/api';
import toast from 'react-hot-toast';

const CronometroContext = createContext(null);

export function CronometroProvider({ children }) {
  const [sessao,     setSessao]     = useState(null);
  const [segundos,   setSegundos]   = useState(0);
  const [rodando,    setRodando]    = useState(false);
  const [pausado,    setPausado]    = useState(false);
  const [carregando, setCarregando] = useState(true);

  const intervalRef = useRef(null);
  const syncRef     = useRef(null);
  const segundosRef = useRef(0);

  useEffect(() => { segundosRef.current = segundos; }, [segundos]);

  const iniciarTick = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => setSegundos(s => s + 1), 1000);
  }, []);

  const pararTick = useCallback(() => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  }, []);

  const iniciarSync = useCallback(() => {
    if (syncRef.current) clearInterval(syncRef.current);
    syncRef.current = setInterval(async () => {
      try { await api.patch('/cronometro/pausar', { duracao_seg: segundosRef.current }); }
      catch { /* silencioso */ }
    }, 30000);
  }, []);

  const pararSync = useCallback(() => {
    if (syncRef.current) { clearInterval(syncRef.current); syncRef.current = null; }
  }, []);

  /* Restaurar sessão ao montar (reload de página) */
  useEffect(() => {
    api.get('/cronometro/ativa')
      .then(({ data }) => {
        if (data.sessao) {
          setSessao(data.sessao);
          setSegundos(data.sessao.segundos_decorridos || 0);
          setRodando(true);
          if (data.sessao.pausado) {
            setPausado(true);
            // não inicia tick — timer congelado
          } else {
            setPausado(false);
            iniciarTick();
            iniciarSync();
          }
        }
      })
      .catch(() => {})
      .finally(() => setCarregando(false));

    return () => { pararTick(); pararSync(); };
  }, []);

  /* ── Iniciar ── */
  async function iniciar(materiaId, materiaNome, materiaCor) {
    try {
      const { data } = await api.post('/cronometro/iniciar', { materia_id: materiaId });
      setSessao({ ...data.sessao, materia_nome: materiaNome, materia_cor: materiaCor });
      setSegundos(0);
      setRodando(true);
      setPausado(false);
      iniciarTick();
      iniciarSync();
      toast.success(`⏱️ Cronômetro iniciado: ${materiaNome}`);
    } catch {
      toast.error('Erro ao iniciar cronômetro');
    }
  }

  /* ── Pausar timer ── */
  async function pausar() {
    pararTick();
    pararSync();
    try {
      await api.patch('/cronometro/pausar-timer', { duracao_seg: segundosRef.current });
      setPausado(true);
      toast('⏸️ Timer pausado', { icon: '⏸️' });
    } catch {
      toast.error('Erro ao pausar timer');
      // reverter: reativar tick
      iniciarTick();
      iniciarSync();
    }
  }

  /* ── Retomar timer ── */
  async function retomar() {
    try {
      await api.patch('/cronometro/retomar');
      setPausado(false);
      iniciarTick();
      iniciarSync();
      toast.success('▶️ Timer retomado');
    } catch {
      toast.error('Erro ao retomar timer');
    }
  }

  /* ── Encerrar ── */
  async function encerrar() {
    pararTick();
    pararSync();
    try {
      await api.patch('/cronometro/pausar', { duracao_seg: segundosRef.current });
      const { data } = await api.patch('/cronometro/encerrar');
      setSessao(null);
      setSegundos(0);
      setRodando(false);
      setPausado(false);
      const min = data.duracao_min;
      if (data.auto_registrado) {
        toast.success(`✅ ${min} min — horas registradas automaticamente!`);
      } else {
        toast(`⏹️ Sessão encerrada: ${min} min (< 1 min, não registrado)`, { icon: 'ℹ️' });
      }
    } catch {
      toast.error('Erro ao encerrar cronômetro');
      setSessao(null); setSegundos(0); setRodando(false); setPausado(false);
    }
  }

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
      sessao, segundos, rodando, pausado, carregando,
      iniciar, pausar, retomar, encerrar, formatarTempo
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
