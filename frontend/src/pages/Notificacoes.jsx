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
      .then(({ data }) => {
        setNotificacoes(data.notificacoes);
        setNaoLidas(data.naoLidas);
      })
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
      setNotificacoes(p => p.map(n => n.id === id ? { ...n, lida: true } : n));
      setNaoLidas(p => Math.max(0, p - 1));
    } catch {}
  }

  async function marcarTodas() {
    try {
      await api.patch('/notificacoes/marcar-todas');
      setNotificacoes(p => p.map(n => ({ ...n, lida: true })));
      setNaoLidas(0);
      toast.success('Todas marcadas como lidas');
    } catch {}
  }

  const fmt = iso => new Date(iso).toLocaleString('pt-BR', {
    day:'2-digit', month:'2-digit', year:'numeric',
    hour:'2-digit', minute:'2-digit'
  });

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:'3rem' }}>
      <span style={{ color:'var(--text-secondary)' }}>Carregando...</span>
    </div>
  );

  return (
    <div className="fade-in">
      <div style={{ display:'flex', justifyContent:'space-between',
        alignItems:'center', marginBottom:'1rem' }}>
        <h2 style={{ fontSize:'1.4rem', fontWeight:700, color:'var(--text-primary)' }}>
          🔔 Notificações
          {naoLidas > 0 && (
            <span className="badge-nao-lida" style={{ marginLeft:10 }}>{naoLidas}</span>
          )}
        </h2>
        {naoLidas > 0 && (
          <button onClick={marcarTodas} className="btn-primary"
            style={{ fontSize:'0.8rem', padding:'0.4rem 1rem' }}>
            ✓ Marcar todas como lidas
          </button>
        )}
      </div>

      <BarraProgresso />

      {notificacoes.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'3rem' }}>
          <p style={{ fontSize:'3rem' }}>🎉</p>
          <p style={{ color:'var(--text-secondary)', marginTop:8 }}>Nenhuma notificação</p>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
          {notificacoes.map(n => (
            <div key={n.id} className="card" style={{
              display:'flex', justifyContent:'space-between', alignItems:'flex-start',
              gap:'1rem', opacity: n.lida ? 0.55 : 1,
              borderLeft: n.lida ? '3px solid var(--border)' : '3px solid var(--accent)',
              padding:'1rem 1.25rem'
            }}>
              <div style={{ display:'flex', gap:'0.75rem', flex:1 }}>
                <span style={{ fontSize:'1.4rem', flexShrink:0 }}>
                  {ICONES[n.tipo] || '🔔'}
                </span>
                <div>
                  <p style={{ fontSize:'0.875rem', lineHeight:1.6,
                    color:'var(--text-primary)' }}>{n.mensagem}</p>
                  <p style={{ fontSize:'0.72rem', color:'var(--text-secondary)', marginTop:4 }}>
                    {fmt(n.data_envio)}
                  </p>
                </div>
              </div>
              {!n.lida && (
                <button onClick={() => marcarLida(n.id)} style={{
                  background:'none', border:'1px solid var(--border)',
                  borderRadius:6, color:'var(--text-secondary)',
                  cursor:'pointer', padding:'0.25rem 0.6rem',
                  fontSize:'0.75rem', whiteSpace:'nowrap',
                  transition:'border-color 0.2s'
                }}>✓ Lida</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
