import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect }          from 'react';
import { useAuth }       from '../context/AuthContext';
import { useTema }       from '../context/ThemeContext';
import { useCronometro } from '../context/CronometroContext';
import api               from '../services/api';

const MENU = [
  { to:'/dashboard',       icon:'📊', label:'Dashboard'       },
  { to:'/ciclo',           icon:'📅', label:'Ciclo Semanal'   },
  { to:'/registro-diario', icon:'✏️',  label:'Registro Diário' },
  { to:'/cronometro',      icon:'⏱️', label:'Cronômetro'      },
  { to:'/questoes',        icon:'📝', label:'Questões'        },
  { to:'/simulados',       icon:'📋', label:'Simulados'       },
  { to:'/notificacoes',    icon:'🔔', label:'Notificações'    }
];

export default function Layout() {
  const { usuario, logout }              = useAuth();
  const { tema, alternarTema }           = useTema();
  const { rodando, sessao, segundos, formatarTempo } = useCronometro();
  const navigate   = useNavigate();
  const [naoLidas, setNaoLidas]   = useState(0);
  const [showWidget, setShowWidget] = useState(true);

  useEffect(() => {
    function buscar() {
      api.get('/notificacoes?limite=1')
        .then(({ data }) => setNaoLidas(data.naoLidas))
        .catch(() => {});
    }
    buscar();
    const t = setInterval(buscar, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const iniciais = usuario?.nome
    ?.split(' ').slice(0,2).map(p => p[0].toUpperCase()).join('') || '?';

  return (
    <div style={{ display:'flex', minHeight:'100vh',
      background:'var(--bg-primary)', flexDirection:'column' }}>

      {/* HEADER */}
      <header style={{
        position:'sticky', top:0, zIndex:100,
        background:'var(--bg-secondary)',
        borderBottom:'1px solid var(--border)',
        boxShadow:'var(--shadow)',
        display:'flex', alignItems:'center',
        justifyContent:'space-between',
        padding:'0 1.5rem', height:60
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem' }}>
          <span style={{ fontSize:'1.5rem' }}>📚</span>
          <span style={{ fontWeight:700, fontSize:'1rem', color:'var(--accent)',
            letterSpacing:'-0.02em' }}>Estudo Concursos</span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'0.875rem' }}>
          {rodando && (
            <div onClick={() => navigate('/cronometro')} style={{
              display:'flex', alignItems:'center', gap:'0.4rem',
              background:'rgba(99,102,241,0.1)', border:'1px solid var(--accent)',
              borderRadius:'0.5rem', padding:'0.3rem 0.75rem', cursor:'pointer'
            }}>
              <span style={{ fontSize:'0.8rem' }}>🔴</span>
              <span style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--accent)',
                fontVariantNumeric:'tabular-nums' }}>
                {formatarTempo(segundos)}
              </span>
              <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)',
                maxWidth:80, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {sessao?.materia_nome}
              </span>
            </div>
          )}

          <button onClick={alternarTema} style={{ background:'var(--bg-primary)',
            border:'1px solid var(--border)', borderRadius:'0.5rem',
            padding:'0.4rem 0.7rem', cursor:'pointer', fontSize:'1rem',
            display:'flex', alignItems:'center', gap:'0.4rem', color:'var(--text-primary)' }}>
            {tema === 'dark' ? '☀️' : '🌙'}
            <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)' }}>
              {tema === 'dark' ? 'Claro' : 'Escuro'}
            </span>
          </button>

          <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
            <div style={{ width:34, height:34, borderRadius:'50%',
              background:'var(--accent)', color:'white',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:700, fontSize:'0.8rem' }}>{iniciais}</div>
            <div style={{ lineHeight:1.2 }}>
              <div style={{ fontWeight:600, fontSize:'0.875rem',
                color:'var(--text-primary)' }}>{usuario?.nome}</div>
              <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)' }}>
                {usuario?.email}
              </div>
            </div>
          </div>

          <button onClick={() => { logout(); navigate('/login'); }}
            className="btn-danger">🚪 Sair</button>
        </div>
      </header>

      {/* CORPO */}
      <div style={{ display:'flex', flex:1 }}>
        <aside style={{ width:220, background:'var(--sidebar-bg)',
          borderRight:'1px solid var(--border)', padding:'1.25rem 0',
          flexShrink:0, transition:'background 0.3s' }}>
          <nav>
            {MENU.map(item => (
              <NavLink key={item.to} to={item.to}
                style={({ isActive }) => ({
                  display:'flex', alignItems:'center', gap:'0.65rem',
                  padding:'0.7rem 1.25rem',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  background: isActive ? 'rgba(99,102,241,0.08)' : 'transparent',
                  borderLeft: isActive ? '3px solid var(--accent)' : '3px solid transparent',
                  textDecoration:'none', fontSize:'0.875rem', fontWeight:500,
                  transition:'all 0.15s', borderRadius:'0 0.375rem 0.375rem 0',
                  marginBottom:2
                })}>
                <span>{item.icon}</span>
                <span style={{ flex:1 }}>{item.label}</span>
                {item.to === '/notificacoes' && naoLidas > 0 && (
                  <span className="badge-nao-lida">{naoLidas}</span>
                )}
                {item.to === '/cronometro' && rodando && (
                  <span style={{ width:8, height:8, borderRadius:'50%',
                    background:'#22c55e', flexShrink:0 }} />
                )}
              </NavLink>
            ))}
          </nav>
        </aside>

        <main style={{ flex:1, padding:'2rem', overflowY:'auto',
          background:'var(--bg-primary)', paddingBottom:'5rem' }}>
          <div className="fade-in"><Outlet /></div>
        </main>
      </div>

      {/* WIDGET FLUTUANTE */}
      {rodando && showWidget && (
        <div style={{ position:'fixed', bottom:'1.5rem', right:'1.5rem', zIndex:200,
          background:'var(--bg-secondary)', border:'2px solid var(--accent)',
          borderRadius:'1rem', boxShadow:'0 8px 32px rgba(99,102,241,0.25)',
          overflow:'hidden', minWidth:200 }}>
          <div style={{ height:4, background: sessao?.materia_cor || 'var(--accent)' }} />
          <div style={{ padding:'0.875rem 1rem' }}>
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', marginBottom:6 }}>
              <span style={{ fontSize:'0.7rem', color:'var(--text-secondary)',
                fontWeight:600, textTransform:'uppercase' }}>⏱️ Estudando</span>
              <button onClick={() => setShowWidget(false)} style={{ background:'none',
                border:'none', cursor:'pointer', color:'var(--text-secondary)',
                fontSize:'0.8rem', padding:0 }}>✕</button>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:8 }}>
              <span style={{ width:10, height:10, borderRadius:'50%',
                background: sessao?.materia_cor || 'var(--accent)', flexShrink:0 }} />
              <span style={{ fontWeight:700, fontSize:'0.875rem',
                maxWidth:130, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {sessao?.materia_nome}
              </span>
            </div>
            <div style={{ fontVariantNumeric:'tabular-nums', fontSize:'1.75rem',
              fontWeight:800, color:'var(--accent)', textAlign:'center',
              marginBottom:8 }}>{formatarTempo(segundos)}</div>
            <button onClick={() => navigate('/cronometro')} style={{ width:'100%',
              background:'rgba(99,102,241,0.1)', border:'1px solid var(--accent)',
              color:'var(--accent)', borderRadius:'0.5rem', padding:'0.35rem',
              cursor:'pointer', fontSize:'0.75rem', fontWeight:600 }}>
              Ver detalhes
            </button>
          </div>
        </div>
      )}

      {rodando && !showWidget && (
        <button onClick={() => setShowWidget(true)}
          title={`${formatarTempo(segundos)} — ${sessao?.materia_nome}`}
          style={{ position:'fixed', bottom:'1.5rem', right:'1.5rem', zIndex:200,
            width:56, height:56, borderRadius:'50%', background:'var(--accent)',
            color:'white', border:'none', cursor:'pointer', fontSize:'1.5rem',
            boxShadow:'0 4px 16px rgba(99,102,241,0.4)',
            display:'flex', alignItems:'center', justifyContent:'center' }}>
          ⏱️
        </button>
      )}

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.6} }`}</style>
    </div>
  );
}
