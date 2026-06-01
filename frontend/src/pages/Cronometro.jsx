import { useEffect, useState } from 'react';
import { useCronometro } from '../context/CronometroContext';
import api   from '../services/api';
import toast from 'react-hot-toast';

function fmtDuracao(seg) {
  if (!seg) return '00:00';
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  return h > 0
    ? `${h}h ${String(m).padStart(2,'0')}m`
    : `${String(m).padStart(2,'0')}m ${String(s).padStart(2,'0')}s`;
}

/* ── Anel SVG Pomodoro ── */
function AnelTempo({ segundos, cor, pausado }) {
  const POMODORO   = 25 * 60;
  const progresso  = Math.min(1, (segundos % POMODORO) / POMODORO);
  const RAIO       = 80;
  const CIRCUNF    = 2 * Math.PI * RAIO;
  const dashOffset = CIRCUNF * (1 - progresso);
  const ciclos     = Math.floor(segundos / POMODORO);
  const restante   = POMODORO - (segundos % POMODORO);
  const rm = Math.floor(restante / 60);
  const rs = restante % 60;

  return (
    <div style={{ position:'relative', display:'inline-flex',
      alignItems:'center', justifyContent:'center' }}>
      <svg width={200} height={200}>
        <circle cx={100} cy={100} r={RAIO} fill="none"
          stroke="var(--border)" strokeWidth={10} />
        <circle cx={100} cy={100} r={RAIO} fill="none"
          stroke={pausado ? 'var(--warning, #f59e0b)' : (cor || 'var(--accent)')}
          strokeWidth={10} strokeLinecap="round"
          strokeDasharray={CIRCUNF} strokeDashoffset={dashOffset}
          transform="rotate(-90 100 100)"
          style={{ transition: pausado ? 'none' : 'stroke-dashoffset 1s linear' }} />
      </svg>
      <div style={{ position:'absolute', textAlign:'center' }}>
        {ciclos > 0 && (
          <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)',
            marginBottom:'var(--sp-1)' }}>
            {'🍅'.repeat(Math.min(ciclos, 5))}
          </div>
        )}
        {pausado && (
          <div style={{ fontSize:'0.8rem', marginBottom:'var(--sp-1)' }}>⏸️</div>
        )}
        <div style={{
          fontSize:'2.25rem', fontWeight:800, lineHeight:1,
          fontVariantNumeric:'tabular-nums', letterSpacing:'-0.03em',
          color: pausado ? 'var(--warning, #f59e0b)' : 'var(--text-primary)',
        }}>
          {`${String(rm).padStart(2,'0')}:${String(rs).padStart(2,'0')}`}
        </div>
        <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)',
          marginTop:'var(--sp-1)' }}>
          {pausado ? 'pausado' : 'restam no pomodoro'}
        </div>
      </div>
    </div>
  );
}

/* ── Botão de ação compacto para o histórico ── */
function BtnAcao({ onClick, title, danger, children }) {
  const [hover, setHover] = useState(false);
  return (
    <button onClick={onClick} title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? (danger ? 'rgba(239,68,68,0.1)' : 'var(--bg-primary)') : 'none',
        border: `1px solid ${hover ? (danger ? 'var(--danger)' : 'var(--accent)') : 'var(--border)'}`,
        color: danger
          ? (hover ? 'var(--danger)' : 'var(--text-secondary)')
          : (hover ? 'var(--accent)' : 'var(--text-secondary)'),
        borderRadius: 'var(--radius-sm)',
        padding: 'var(--sp-1) var(--sp-2)',
        cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: 'var(--sp-1)',
        transition: 'all var(--transition)', whiteSpace: 'nowrap', flexShrink: 0,
      }}>
      {children}
    </button>
  );
}

export default function Cronometro() {
  const {
    sessao, segundos, rodando, pausado,
    iniciar, pausar, retomar, encerrar, formatarTempo
  } = useCronometro();

  const [materias,   setMaterias]   = useState([]);
  const [historico,  setHistorico]  = useState([]);
  const [matSel,     setMatSel]     = useState('');
  const [carregando, setCarregando] = useState(false);

  function recarregarHistorico() {
    api.get('/cronometro/historico')
      .then(({ data }) => setHistorico(data.historico))
      .catch(() => {});
  }

  useEffect(() => {
    Promise.all([api.get('/materias'), api.get('/cronometro/historico')])
      .then(([m, h]) => {
        setMaterias(m.data.materias);
        setHistorico(h.data.historico);
        if (m.data.materias.length > 0) setMatSel(String(m.data.materias[0].id));
      })
      .catch(() => toast.error('Erro ao carregar dados'));
  }, [rodando]);

  const materiaSelecionada = materias.find(m => String(m.id) === String(matSel));

  async function handleIniciar() {
    if (!matSel) return toast.error('Selecione uma matéria');
    setCarregando(true);
    await iniciar(parseInt(matSel), materiaSelecionada?.nome, materiaSelecionada?.cor);
    setCarregando(false);
  }

  async function handleEncerrar() {
    if (!window.confirm('Encerrar o cronômetro? As horas serão registradas automaticamente.')) return;
    await encerrar();
    recarregarHistorico();
  }

  async function handleRemover(id) {
    if (!window.confirm('Remover esta sessão do histórico?')) return;
    try {
      await api.delete(`/cronometro/${id}`);
      setHistorico(p => p.filter(h => h.id !== id));
      toast.success('Sessão removida');
    } catch { toast.error('Erro ao remover sessão'); }
  }

  const fmt = iso => new Date(iso).toLocaleString('pt-BR', {
    day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'
  });

  return (
    <div className="page-wrapper">

      <div className="page-header">
        <h2 className="page-title">⏱️ Cronômetro de Estudos</h2>
      </div>

      <div className="grid-2col">

        {/* ── Painel principal ── */}
        <div className="card content-card" style={{ alignItems:'center' }}>

          {rodando ? (
            <>
              {/* Matéria em andamento */}
              <div style={{
                display:'flex', alignItems:'center', gap:'var(--sp-3)',
                background: pausado ? 'rgba(245,158,11,0.08)' : 'var(--bg-elevated)',
                borderRadius:'var(--radius)', padding:'var(--sp-3) var(--sp-4)',
                width:'100%',
                border: `1px solid ${pausado ? 'rgba(245,158,11,0.4)' : 'var(--border)'}`,
                transition:'all var(--transition)',
              }}>
                <span style={{ width:14, height:14, borderRadius:'50%', flexShrink:0,
                  background: sessao?.materia_cor || 'var(--accent)' }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:'0.7rem', fontWeight:600,
                    textTransform:'uppercase', letterSpacing:'0.05em',
                    color: pausado ? '#f59e0b' : 'var(--text-secondary)' }}>
                    {pausado ? '⏸️ Pausado' : 'Estudando agora'}
                  </div>
                  <div style={{ fontWeight:700, fontSize:'0.9rem',
                    color:'var(--text-primary)' }}>
                    {sessao?.materia_nome}
                  </div>
                </div>
              </div>

              {/* Anel */}
              <AnelTempo segundos={segundos} cor={sessao?.materia_cor} pausado={pausado} />

              {/* Tempo total */}
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'0.72rem', color:'var(--text-secondary)',
                  marginBottom:'var(--sp-1)', textTransform:'uppercase',
                  letterSpacing:'0.05em', fontWeight:600 }}>
                  Tempo total da sessão
                </div>
                <div style={{
                  fontSize:'1.75rem', fontWeight:800,
                  fontVariantNumeric:'tabular-nums', letterSpacing:'-0.03em',
                  color: pausado ? '#f59e0b' : 'var(--accent)',
                  transition:'color var(--transition)',
                }}>
                  {formatarTempo(segundos)}
                </div>
              </div>

              {/* Stats */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)',
                gap:'var(--sp-3)', width:'100%' }}>
                {[
                  { valor:Math.floor(segundos/(25*60)), label:'🍅 Pomodoros' },
                  { valor:Math.round(segundos/60),      label:'⏱️ Minutos'   },
                  { valor:(segundos/3600).toFixed(1),   label:'📚 Horas'     },
                ].map(s => (
                  <div key={s.label} style={{ textAlign:'center',
                    padding:'var(--sp-3)', background:'var(--bg-elevated)',
                    borderRadius:'var(--radius)', border:'1px solid var(--border)' }}>
                    <div style={{ fontWeight:800, fontSize:'1rem',
                      color:'var(--text-primary)' }}>{s.valor}</div>
                    <div style={{ fontSize:'0.68rem', color:'var(--text-secondary)',
                      marginTop:'var(--sp-1)' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Botões pausa / encerrar */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr',
                gap:'var(--sp-3)', width:'100%' }}>

                {/* Pausar / Retomar */}
                <button
                  onClick={pausado ? retomar : pausar}
                  style={{
                    padding:'var(--sp-3)', fontSize:'0.875rem', fontWeight:700,
                    border:'none', borderRadius:'var(--radius)', cursor:'pointer',
                    transition:'all var(--transition)',
                    background: pausado
                      ? 'var(--accent)'
                      : 'var(--bg-elevated)',
                    color: pausado ? '#fff' : 'var(--text-primary)',
                    border: pausado
                      ? 'none'
                      : '1px solid var(--border)',
                    boxShadow: pausado
                      ? '0 2px 8px rgba(99,102,241,0.3)'
                      : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!pausado) e.currentTarget.style.borderColor = 'var(--accent)';
                  }}
                  onMouseLeave={e => {
                    if (!pausado) e.currentTarget.style.borderColor = 'var(--border)';
                  }}>
                  {pausado ? '▶️ Retomar' : '⏸️ Pausar'}
                </button>

                {/* Encerrar */}
                <button onClick={handleEncerrar} style={{
                  padding:'var(--sp-3)', fontSize:'0.875rem', fontWeight:700,
                  background:'var(--danger)', color:'#fff', border:'none',
                  borderRadius:'var(--radius)', cursor:'pointer',
                  transition:'all var(--transition)',
                  boxShadow:'0 2px 8px rgba(239,68,68,0.3)',
                }}
                onMouseEnter={e => e.currentTarget.style.background='#dc2626'}
                onMouseLeave={e => e.currentTarget.style.background='var(--danger)'}>
                  ⏹️ Encerrar
                </button>
              </div>

              <p style={{ fontSize:'0.72rem', color:'var(--text-muted)',
                textAlign:'center', lineHeight:1.5 }}>
                {pausado
                  ? 'Timer pausado — retome quando quiser continuar'
                  : 'As horas serão registradas automaticamente ao encerrar'}
              </p>
            </>
          ) : (
            <>
              <AnelTempo segundos={0} cor="var(--accent)" pausado={false} />

              <div style={{ width:'100%', display:'flex',
                flexDirection:'column', gap:'var(--sp-3)' }}>
                <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)',
                  fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                  Selecione a matéria para estudar
                </p>

                {materias.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">📚</span>
                    <p>Crie matérias no <strong>Ciclo Semanal</strong> primeiro</p>
                  </div>
                ) : (
                  <>
                    <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-2)' }}>
                      {materias.map(m => (
                        <div key={m.id} onClick={() => setMatSel(String(m.id))} style={{
                          display:'flex', alignItems:'center', gap:'var(--sp-3)',
                          padding:'var(--sp-2) var(--sp-3)', borderRadius:'var(--radius)',
                          cursor:'pointer',
                          border: String(m.id)===String(matSel)
                            ? `2px solid ${m.cor}` : '2px solid var(--border)',
                          background: String(m.id)===String(matSel)
                            ? `${m.cor}18` : 'var(--bg-elevated)',
                          transition:'all var(--transition)',
                        }}>
                          <span style={{ width:10, height:10, borderRadius:'50%',
                            background:m.cor, flexShrink:0 }} />
                          <span style={{ fontSize:'0.875rem', fontWeight:500,
                            color:'var(--text-primary)', overflow:'hidden',
                            textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {m.nome}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button onClick={handleIniciar} className="btn-primary"
                      disabled={carregando || !matSel}
                      style={{ width:'100%', justifyContent:'center', padding:'var(--sp-3)' }}>
                      {carregando
                        ? <><span className="spinner" style={{ width:14, height:14, borderWidth:2 }} /> Iniciando...</>
                        : '▶️ Iniciar Cronômetro'}
                    </button>
                  </>
                )}
              </div>
              <p style={{ fontSize:'0.72rem', color:'var(--text-muted)',
                textAlign:'center', lineHeight:1.6 }}>
                Cada 25 min = 1 🍅 Pomodoro. As horas são registradas automaticamente ao encerrar.
              </p>
            </>
          )}
        </div>

        {/* ── Histórico ── */}
        <div className="card content-card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text-primary)' }}>
              📋 Histórico de Sessões
            </h3>
            {historico.length > 0 && (
              <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)', fontWeight:600 }}>
                {historico.length} sessão{historico.length !== 1 ? 'ões' : ''}
              </span>
            )}
          </div>

          <div className="divider" style={{ margin:0 }} />

          {historico.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <p>Nenhuma sessão encerrada ainda</p>
            </div>
          ) : (
            <div style={{ maxHeight:520, overflowY:'auto', paddingRight:2,
              display:'flex', flexDirection:'column', gap:'var(--sp-2)' }}>
              {historico.map(h => (
                <div key={h.id} style={{
                  display:'flex', alignItems:'center', gap:'var(--sp-3)',
                  padding:'var(--sp-3)', background:'var(--bg-elevated)',
                  borderRadius:'var(--radius)', border:'1px solid var(--border)',
                }}>
                  <span style={{ width:10, height:10, borderRadius:'50%',
                    background:h.materia_cor, flexShrink:0 }} />

                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'0.875rem', fontWeight:600,
                      color:'var(--text-primary)', overflow:'hidden',
                      textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {h.materia_nome}
                    </div>
                    <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)',
                      marginTop:'var(--sp-1)' }}>
                      {fmt(h.iniciado_em)}
                    </div>
                  </div>

                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontWeight:700, color:'var(--accent)', fontSize:'0.875rem' }}>
                      {fmtDuracao(h.duracao_seg)}
                    </div>
                    <div style={{ fontSize:'0.68rem', color:'var(--text-secondary)',
                      marginTop:'var(--sp-1)' }}>
                      {Math.floor((h.duracao_seg || 0) / (25*60))} 🍅
                    </div>
                  </div>

                  {/* Só excluir no histórico — pausa é apenas no timer ativo */}
                  <BtnAcao onClick={() => handleRemover(h.id)}
                    title="Remover sessão do histórico" danger>
                    🗑️
                  </BtnAcao>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
