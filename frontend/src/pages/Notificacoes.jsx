import { useEffect, useState } from 'react';
import api            from '../services/api';
import toast          from 'react-hot-toast';
import BarraProgresso from '../components/BarraProgresso';

const ICONES = { lembrete:'🔔', conquista:'🏆', aviso:'⚠️' };

export default function Notificacoes() {
  const [notificacoes, setNotificacoes] = useState([]);
  const [naoLidas,     setNaoLidas]     = useState(0);
  const [loading,      setLoading]      = useState(true);

  function carregar() {
    api.get('/notificacoes?limite=50')
      .then(({ data }) => { setNotificacoes(data.notificacoes); setNaoLidas(data.naoLidas); })
      .catch(() => toast.error('Erro ao carregar notificações'))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    carregar();
    api.get('/registros/hoje').then(({ data }) => {
      if (data.registros.length === 0)
        toast('📚 Você ainda não registrou horas hoje!', { icon:'⏰' });
    }).catch(() => {});
  }, []);

  async function marcarLida(id) {
    try {
      await api.patch(`/notificacoes/${id}/lida`);
      setNotificacoes(p => p.map(n => n.id === id ? { ...n, lida:true } : n));
      setNaoLidas(p => Math.max(0, p - 1));
    } catch {}
  }

  async function marcarTodas() {
    try {
      await api.patch('/notificacoes/marcar-todas');
      setNotificacoes(p => p.map(n => ({ ...n, lida:true })));
      setNaoLidas(0);
      toast.success('Todas marcadas como lidas');
    } catch {}
  }

  const fmt = iso => new Date(iso).toLocaleString('pt-BR', {
    day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'
  });

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:'3rem' }}>
      <span className="spinner" />
    </div>
  );

  return (
    <div className="page-wrapper">

      <div className="page-header">
        <h2 className="page-title">
          🔔 Notificações
          {naoLidas > 0 && (
            <span style={{
              marginLeft:'var(--sp-2)', background:'var(--danger)', color:'#fff',
              borderRadius:99, padding:'2px var(--sp-2)',
              fontSize:'0.7rem', fontWeight:800,
            }}>{naoLidas}</span>
          )}
        </h2>
        {naoLidas > 0 && (
          <button onClick={marcarTodas} className="btn-secondary">
            ✓ Marcar todas como lidas
          </button>
        )}
      </div>

      <BarraProgresso />

      {notificacoes.length === 0 ? (
        <div className="card">
          <div className="empty-state" style={{ padding:'3rem' }}>
            <span className="empty-icon">🎉</span>
            <p>Nenhuma notificação por enquanto</p>
          </div>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-3)' }}>
          {notificacoes.map(n => (
            <div key={n.id} className="card" style={{
              display:'flex', justifyContent:'space-between', alignItems:'flex-start',
              gap:'var(--sp-3)',
              padding:'var(--sp-4) var(--sp-5)',
              opacity: n.lida ? 0.55 : 1,
              borderLeft: `3px solid ${n.lida ? 'var(--border)' : 'var(--accent)'}`,
              transition:'opacity var(--transition)',
            }}>
              <div style={{ display:'flex', gap:'var(--sp-3)', flex:1, minWidth:0 }}>
                <span style={{ fontSize:'1.3rem', flexShrink:0, lineHeight:1.4 }}>
                  {ICONES[n.tipo] || '🔔'}
                </span>
                <div style={{ minWidth:0 }}>
                  <p style={{ fontSize:'0.875rem', lineHeight:1.6, color:'var(--text-primary)' }}>
                    {n.mensagem}
                  </p>
                  <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'var(--sp-1)' }}>
                    {fmt(n.data_envio)}
                  </p>
                </div>
              </div>
              {!n.lida && (
                <button onClick={() => marcarLida(n.id)}
                  className="btn-secondary"
                  style={{ fontSize:'0.75rem', padding:'var(--sp-1) var(--sp-3)', flexShrink:0 }}>
                  ✓ Lida
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
