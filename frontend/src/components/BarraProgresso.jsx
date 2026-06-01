/**
 * BarraProgresso.jsx
 * Widget de resumo do ciclo semanal exibido em todas as páginas protegidas
 * Consome /api/ciclos/resumo-semana — dados do usuário logado
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function BarraProgresso() {
  const [resumo,  setResumo]  = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/ciclos/resumo-semana')
      .then(({ data }) => setResumo(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !resumo) return null;

  const planejado = parseFloat(resumo.planejado) || 0;
  const estudado  = parseFloat(resumo.estudado)  || 0;
  const pct       = planejado > 0
    ? Math.min(100, Math.round((estudado / planejado) * 100))
    : 0;

  const cor = pct >= 100 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#6366f1';

  return (
    <Link to="/ciclo" style={{ textDecoration: 'none' }}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border)',
        borderRadius: '0.625rem',
        padding: '0.75rem 1rem',
        marginBottom: '1.5rem',
        display: 'flex', alignItems: 'center', gap: '1rem',
        cursor: 'pointer', transition: 'box-shadow 0.2s',
        boxShadow: 'var(--shadow)'
      }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.15)'}
        onMouseLeave={e => e.currentTarget.style.boxShadow = 'var(--shadow)'}
      >
        {/* Ícone */}
        <span style={{ fontSize: '1.4rem' }}>📅</span>

        {/* Textos */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: 6 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600,
              color: 'var(--text-primary)' }}>
              Ciclo desta semana
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: cor }}>
              {pct}% — {estudado}h / {planejado}h
            </span>
          </div>
          {/* Barra */}
          <div style={{ background: 'var(--border)', borderRadius: 999, height: 6, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 999,
              background: cor, width: `${pct}%`,
              transition: 'width 0.8s ease'
            }} />
          </div>
        </div>

        {/* Seta */}
        <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>›</span>
      </div>
    </Link>
  );
}
