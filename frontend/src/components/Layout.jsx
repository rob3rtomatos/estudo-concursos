import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef }  from 'react';
import { useAuth }       from '../context/AuthContext';
import { useTema }       from '../context/ThemeContext';
import { useCronometro } from '../context/CronometroContext';
import { useIsMobile }   from '../hooks/useIsMobile';
import api               from '../services/api';

const MENU = [
  { to:'/dashboard',       icon:'📊', label:'Dashboard'       },
  { to:'/ciclo',           icon:'📅', label:'Ciclo Semanal'   },
  { to:'/registro-diario', icon:'✏️',  label:'Registro Diário' },
  { to:'/cronometro',      icon:'⏱️', label:'Cronômetro'      },
  { to:'/questoes',        icon:'📝', label:'Questões'        },
  { to:'/simulados',       icon:'📋', label:'Simulados'       },
  { to:'/meus-cursos',     icon:'🎓', label:'Meus Cursos'     },
  { to:'/relatorios',      icon:'📊', label:'Relatórios'      },
  { to:'/notificacoes',    icon:'🔔', label:'Notificações'    },
];

export default function Layout() {
  const { usuario, logout }                          = useAuth();
  const { tema, alternarTema }                       = useTema();
  const { rodando, sessao, segundos, formatarTempo } = useCronometro();
  const { mobile, tablet }                           = useIsMobile();
  const navigate = useNavigate();

  const [sidebarAberta, setSidebar] = useState(false);
  const [showWidget,    setWidget]  = useState(true);
  const [naoLidas,      setNaoLidas]= useState(0);
  const sidebarRef = useRef(null);
  const isMobileOrTablet = mobile || tablet;

  useEffect(() => {
    function handle(e) {
      if (sidebarAberta && sidebarRef.current && !sidebarRef.current.contains(e.target))
        setSidebar(false);
    }
    document.addEventListener('mousedown',  handle);
    document.addEventListener('touchstart', handle);
    return () => {
      document.removeEventListener('mousedown',  handle);
      document.removeEventListener('touchstart', handle);
    };
  }, [sidebarAberta]);

  useEffect(() => { if (!isMobileOrTablet) setSidebar(false); }, [isMobileOrTablet]);

  useEffect(() => {
    function buscar() {
      api.get('/notificacoes?limite=1')
        .then(({ data }) => setNaoLidas(data.naoLidas || 0))
        .catch(() => {});
    }
    buscar();
    const t = setInterval(buscar, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  const iniciais = usuario?.nome
    ?.split(' ').slice(0,2).map(p => p[0]?.toUpperCase()).join('') || '?';

  function ir(rota) {
    navigate(rota);
    if (isMobileOrTablet) setSidebar(false);
  }

  /* ── tokens reutilizados ── */
  const ICON_BTN = {
    background: 'var(--bg-elevated)',
    border:     '1px solid var(--border)',
    borderRadius:'var(--radius)',
    cursor:     'pointer',
    color:      'var(--text-primary)',
    display:    'flex',
    alignItems: 'center',
    justifyContent:'center',
    gap:        'var(--sp-1)',
    height:     36,
    padding:    '0 var(--sp-3)',
    fontSize:   '0.875rem',
    fontWeight: 500,
    transition: 'all var(--transition)',
    whiteSpace: 'nowrap',
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', minHeight:'100vh',
      background:'var(--bg-primary)', color:'var(--text-primary)' }}>

      {/* ═══════════════════ HEADER ═══════════════════ */}
      <header style={{
        position:       'sticky',
        top:            0,
        zIndex:         200,
        height:         'var(--header-h)',
        background:     'var(--bg-secondary)',
        borderBottom:   '1px solid var(--border)',
        boxShadow:      'var(--shadow-sm)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter:'blur(12px)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'space-between',
        padding:        mobile ? '0 var(--sp-3)' : '0 var(--sp-6)',
        gap:            'var(--sp-3)',
        overflow:       'hidden',
      }}>

        {/* ── Esquerda: hambúrguer + logo ── */}
        <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)', flexShrink:0 }}>
          {isMobileOrTablet && (
            <button onClick={() => setSidebar(p => !p)} aria-label="Menu"
              style={{ ...ICON_BTN, width:36, padding:0 }}>
              {sidebarAberta
                ? <span style={{ fontSize:'1.1rem', lineHeight:1 }}>✕</span>
                : <span style={{ display:'flex', flexDirection:'column',
                    gap:4, padding:'var(--sp-1)' }}>
                    {[0,1,2].map(i => (
                      <span key={i} style={{ width:18, height:2,
                        background:'currentColor', borderRadius:1, display:'block' }} />
                    ))}
                  </span>
              }
            </button>
          )}

          <div onClick={() => ir('/dashboard')}
            style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)',
              cursor:'pointer', userSelect:'none' }}>
            <span style={{ fontSize: mobile ? '1.3rem' : '1.4rem', lineHeight:1 }}>📚</span>
            {!mobile && (
              <span style={{ fontWeight:800, fontSize:'0.9rem',
                color:'var(--accent)', letterSpacing:'-0.02em', whiteSpace:'nowrap' }}>
                Estudo Concursos
              </span>
            )}
          </div>
        </div>

        {/* ── Centro: cronômetro compacto (mobile) ── */}
        {mobile && rodando && (
          <div onClick={() => ir('/cronometro')} style={{
            flex:1, display:'flex', alignItems:'center', justifyContent:'center',
            gap:'var(--sp-1)',
            background:'rgba(99,102,241,0.1)',
            border:'1px solid var(--accent)',
            borderRadius:'var(--radius)',
            padding:'var(--sp-1) var(--sp-2)',
            cursor:'pointer',
          }}>
            <span style={{ fontSize:'0.65rem', color:'var(--danger)' }}>🔴</span>
            <span style={{ fontSize:'0.875rem', fontWeight:800, color:'var(--accent)',
              fontVariantNumeric:'tabular-nums' }}>
              {formatarTempo(segundos)}
            </span>
          </div>
        )}

        {/* ── Direita ── */}
        <div style={{ display:'flex', alignItems:'center',
          gap: mobile ? 'var(--sp-2)' : 'var(--sp-3)', flexShrink:0 }}>

          {/* Cronômetro desktop/tablet */}
          {!mobile && rodando && (
            <button onClick={() => ir('/cronometro')} style={{
              ...ICON_BTN,
              background: 'rgba(99,102,241,0.08)',
              border:     '1px solid var(--accent)',
              color:      'var(--accent)',
              padding:    '0 var(--sp-3)',
            }}>
              <span style={{ fontSize:'0.65rem', color:'var(--danger)' }}>🔴</span>
              <span style={{ fontVariantNumeric:'tabular-nums', fontWeight:800 }}>
                {formatarTempo(segundos)}
              </span>
              {!tablet && sessao?.materia_nome && (
                <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)',
                  maxWidth:90, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  · {sessao.materia_nome}
                </span>
              )}
            </button>
          )}

          {/* Tema */}
          <button onClick={alternarTema} aria-label="Alternar tema" style={ICON_BTN}
            onMouseEnter={e => e.currentTarget.style.borderColor='var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
            <span style={{ fontSize:'1rem', lineHeight:1 }}>
              {tema === 'dark' ? '☀️' : '🌙'}
            </span>
            {!mobile && (
              <span style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}>
                {tema === 'dark' ? 'Claro' : 'Escuro'}
              </span>
            )}
          </button>

          {/* Avatar + info */}
          <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-2)' }}>
            <div style={{
              width:32, height:32, borderRadius:'50%', flexShrink:0,
              background:'var(--accent)', color:'#fff',
              display:'flex', alignItems:'center', justifyContent:'center',
              fontWeight:800, fontSize:'0.75rem',
              boxShadow:'0 0 0 2px var(--bg-secondary), 0 0 0 3px var(--accent)',
            }}>
              {iniciais}
            </div>
            {!mobile && (
              <div style={{ lineHeight:1.25, maxWidth:130 }}>
                <div style={{ fontWeight:700, fontSize:'0.8rem',
                  color:'var(--text-primary)',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {usuario?.nome}
                </div>
                <div style={{ fontSize:'0.67rem', color:'var(--text-secondary)',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {usuario?.email}
                </div>
              </div>
            )}
          </div>

          {/* Sair */}
          <button onClick={() => { logout(); navigate('/login'); }}
            style={{
              ...ICON_BTN,
              border:  '1px solid var(--border)',
              color:   'var(--danger)',
              padding: mobile ? '0 var(--sp-2)' : '0 var(--sp-3)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background    = 'var(--danger-soft, rgba(239,68,68,0.08))';
              e.currentTarget.style.borderColor   = 'var(--danger)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background    = 'var(--bg-elevated)';
              e.currentTarget.style.borderColor   = 'var(--border)';
            }}>
            <span style={{ fontSize:'0.95rem', lineHeight:1 }}>🚪</span>
            {!mobile && (
              <span style={{ fontSize:'0.8rem', fontWeight:600 }}>Sair</span>
            )}
          </button>
        </div>
      </header>

      {/* ═══════════════════ CORPO ═══════════════════ */}
      <div style={{ display:'flex', flex:1, overflow:'hidden', position:'relative' }}>

        {/* Overlay mobile */}
        {isMobileOrTablet && sidebarAberta && (
          <div onClick={() => setSidebar(false)} style={{
            position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
            zIndex:150, backdropFilter:'blur(2px)',
          }} />
        )}

        {/* ═══════════════════ SIDEBAR ═══════════════════ */}
        <aside ref={sidebarRef} style={{
          width:      'var(--sidebar-w)',
          background: 'var(--sidebar-bg)',
          borderRight:'1px solid var(--border)',
          overflowY:  'auto',
          overflowX:  'hidden',
          padding:    'var(--sp-2) 0',
          flexShrink: 0,
          ...(isMobileOrTablet ? {
            position:  'fixed',
            top:       'var(--header-h)',
            left:      0,
            bottom:    0,
            zIndex:    180,
            transform: sidebarAberta ? 'translateX(0)' : 'translateX(-100%)',
            transition:'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
            boxShadow: sidebarAberta ? '4px 0 24px rgba(0,0,0,0.3)' : 'none',
          } : {
            position:  'sticky',
            top:       0,
            height:    '100vh',
          })
        }}>

          {/* Info usuário sidebar (mobile) */}
          {mobile && (
            <div style={{
              padding:      'var(--sp-4)',
              borderBottom: '1px solid var(--border)',
              marginBottom: 'var(--sp-2)',
              display:      'flex',
              alignItems:   'center',
              gap:          'var(--sp-3)',
            }}>
              <div style={{
                width:32, height:32, borderRadius:'50%', flexShrink:0,
                background:'var(--accent)', color:'#fff',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontWeight:800, fontSize:'0.75rem',
              }}>{iniciais}</div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:'0.875rem',
                  color:'var(--text-primary)',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {usuario?.nome}
                </div>
                <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {usuario?.email}
                </div>
              </div>
            </div>
          )}

          <nav>
            {MENU.map(item => (
              <NavLink key={item.to} to={item.to}
                onClick={() => isMobileOrTablet && setSidebar(false)}
                style={({ isActive }) => ({
                  display:        'flex',
                  alignItems:     'center',
                  gap:            'var(--sp-3)',
                  padding:        'var(--sp-2) var(--sp-4)',
                  color:          isActive ? 'var(--accent)'        : 'var(--text-secondary)',
                  background:     isActive ? 'var(--accent-soft)'   : 'transparent',
                  borderLeft:     isActive ? '3px solid var(--accent)' : '3px solid transparent',
                  textDecoration: 'none',
                  fontSize:       '0.875rem',
                  fontWeight:     isActive ? 700 : 400,
                  transition:     'all 0.15s ease',
                  borderRadius:   '0 var(--radius) var(--radius) 0',
                  marginBottom:   1,
                  minHeight:      40,
                })}>
                <span style={{ fontSize:'1.05rem', flexShrink:0, lineHeight:1 }}>{item.icon}</span>
                <span style={{ flex:1 }}>{item.label}</span>
                {item.to === '/notificacoes' && naoLidas > 0 && (
                  <span style={{ background:'var(--danger)', color:'#fff',
                    borderRadius:99, padding:'1px var(--sp-2)',
                    fontSize:'0.65rem', fontWeight:800 }}>{naoLidas}</span>
                )}
                {item.to === '/cronometro' && rodando && (
                  <span style={{ width:7, height:7, borderRadius:'50%',
                    background:'var(--success)', flexShrink:0 }} />
                )}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* ═══════════════════ MAIN ═══════════════════ */}
        <main style={{
          flex:       1,
          overflowY:  'auto',
          overflowX:  'hidden',
          minWidth:   0,
          background: 'var(--bg-primary)',
          padding:    mobile ? 'var(--sp-4) var(--sp-3) calc(var(--sp-12) + env(safe-area-inset-bottom))'
                    : tablet ? 'var(--sp-5) var(--sp-5) var(--sp-12)'
                    :          'var(--sp-5) var(--sp-7) var(--sp-12)',
        }}>
          <div className="fade-in"><Outlet /></div>
        </main>
      </div>

      {/* ═══════════════════ WIDGET FLUTUANTE ═══════════════════ */}
      {!mobile && rodando && showWidget && (
        <div style={{
          position:   'fixed',
          bottom:     'var(--sp-6)',
          right:      'var(--sp-6)',
          zIndex:     250,
          background: 'var(--bg-secondary)',
          border:     '1px solid var(--border)',
          borderTop:  '3px solid var(--accent)',
          borderRadius:'var(--radius-lg)',
          boxShadow:  'var(--shadow-lg)',
          minWidth:   200,
          overflow:   'hidden',
        }}>
          {/* Barra cor matéria */}
          <div style={{ height:3, background: sessao?.materia_cor || 'var(--accent)' }} />

          <div style={{ padding:'var(--sp-4) var(--sp-4) var(--sp-3)' }}>
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', marginBottom:'var(--sp-2)' }}>
              <span style={{ fontSize:'0.68rem', fontWeight:700,
                color:'var(--text-secondary)',
                textTransform:'uppercase', letterSpacing:'0.06em' }}>
                ⏱️ Estudando
              </span>
              <button onClick={() => setWidget(false)}
                style={{ background:'none', border:'none', cursor:'pointer',
                  color:'var(--text-secondary)', fontSize:'0.85rem',
                  width:24, height:24, display:'flex',
                  alignItems:'center', justifyContent:'center',
                  borderRadius:'var(--radius-sm)',
                  transition:'all var(--transition)' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--border)'}
                onMouseLeave={e => e.currentTarget.style.background='none'}>
                ✕
              </button>
            </div>

            {sessao?.materia_nome && (
              <div style={{ display:'flex', alignItems:'center',
                gap:'var(--sp-2)', marginBottom:'var(--sp-3)' }}>
                <span style={{ width:9, height:9, borderRadius:'50%', flexShrink:0,
                  background: sessao.materia_cor || 'var(--accent)' }} />
                <span style={{ fontWeight:700, fontSize:'0.8rem',
                  color:'var(--text-primary)',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {sessao.materia_nome}
                </span>
              </div>
            )}

            <div style={{ fontSize:'1.75rem', fontWeight:800, color:'var(--accent)',
              textAlign:'center', marginBottom:'var(--sp-3)',
              fontVariantNumeric:'tabular-nums', letterSpacing:'-0.03em' }}>
              {formatarTempo(segundos)}
            </div>

            <button onClick={() => ir('/cronometro')} style={{
              width:      '100%',
              background: 'var(--accent-soft)',
              border:     '1px solid var(--accent)',
              color:      'var(--accent)',
              borderRadius:'var(--radius)',
              padding:    'var(--sp-2)',
              cursor:     'pointer',
              fontSize:   '0.75rem',
              fontWeight: 700,
              transition: 'all var(--transition)',
            }}
            onMouseEnter={e => e.currentTarget.style.background='var(--accent)' || (e.currentTarget.style.color='#fff')}
            onMouseLeave={e => { e.currentTarget.style.background='var(--accent-soft)'; e.currentTarget.style.color='var(--accent)'; }}>
              Ver detalhes →
            </button>
          </div>
        </div>
      )}

      {/* Bolinha minimizada */}
      {!mobile && rodando && !showWidget && (
        <button onClick={() => setWidget(true)}
          title={`${formatarTempo(segundos)} — ${sessao?.materia_nome || ''}`}
          style={{
            position:  'fixed',
            bottom:    'var(--sp-6)',
            right:     'var(--sp-6)',
            zIndex:    250,
            width:     50, height:50,
            borderRadius:'50%',
            background:'var(--accent)',
            color:     '#fff',
            border:    'none',
            cursor:    'pointer',
            fontSize:  '1.2rem',
            boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
            display:   'flex',
            alignItems:'center',
            justifyContent:'center',
            transition:'transform var(--transition)',
          }}
          onMouseEnter={e => e.currentTarget.style.transform='scale(1.1)'}
          onMouseLeave={e => e.currentTarget.style.transform='scale(1)'}>
          ⏱️
        </button>
      )}
    </div>
  );
}
