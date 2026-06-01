import { useEffect, useState } from 'react';
import { useCronometro } from '../context/CronometroContext';
import api   from '../services/api';
import toast from 'react-hot-toast';

function fmtDuracao(seg) {
  if (!seg) return '00:00';
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  const mm = String(m).padStart(2,'0');
  const ss = String(s).padStart(2,'0');
  return h > 0 ? `${h}h ${mm}m` : `${mm}m ${ss}s`;
}

function AnelTempo({ segundos, cor }) {
  const POMODORO   = 25 * 60;
  const progresso  = Math.min(1, segundos / POMODORO);
  const RAIO       = 80;
  const CIRCUNF    = 2 * Math.PI * RAIO;
  const dashOffset = CIRCUNF * (1 - progresso);
  const ciclos     = Math.floor(segundos / POMODORO);

  return (
    <div style={{ position:'relative', display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
      <svg width={200} height={200}>
        <circle cx={100} cy={100} r={RAIO} fill="none" stroke="var(--border)" strokeWidth={10} />
        <circle cx={100} cy={100} r={RAIO} fill="none"
          stroke={cor || 'var(--accent)'} strokeWidth={10} strokeLinecap="round"
          strokeDasharray={CIRCUNF} strokeDashoffset={dashOffset}
          transform="rotate(-90 100 100)"
          style={{ transition:'stroke-dashoffset 1s linear' }} />
      </svg>
      <div style={{ position:'absolute', textAlign:'center' }}>
        {ciclos > 0 && (
          <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)', marginBottom:'var(--sp-1)' }}>
            {'🍅'.repeat(Math.min(ciclos, 5))}
          </div>
        )}
        <div style={{ fontSize:'2.25rem', fontWeight:800, color:'var(--text-primary)',
          fontVariantNumeric:'tabular-nums', letterSpacing:'-0.03em', lineHeight:1 }}>
          {(() => {
            const restante = POMODORO - (segundos % POMODORO);
            const m = Math.floor(restante / 60);
            const s = restante % 60;
            return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
          })()}
        </div>
        <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)', marginTop:'var(--sp-1)' }}>
          restam no pomodoro
        </div>
      </div>
    </div>
  );
}

export default function Cronometro() {
  const { sessao, segundos, rodando, iniciar, encerrar, formatarTempo } = useCronometro();
  const [materias,   setMaterias]   = useState([]);
  const [historico,  setHistorico]  = useState([]);
  const [matSel,     setMatSel]     = useState('');
  const [carregando, setCarregando] = useState(false);

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
    api.get('/cronometro/historico').then(({ data }) => setHistorico(data.historico)).catch(() => {});
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
                background:'var(--bg-elevated)', borderRadius:'var(--radius)',
                padding:'var(--sp-3) var(--sp-4)', width:'100%',
                border:'1px solid var(--border)',
              }}>
                <span style={{ width:14, height:14, borderRadius:'50%',
                  background:sessao?.materia_cor || 'var(--accent)', flexShrink:0 }} />
                <div>
                  <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)', fontWeight:600,
                    textTransform:'uppercase', letterSpacing:'0.05em' }}>Estudando agora</div>
                  <div style={{ fontWeight:700, fontSize:'0.9rem', color:'var(--text-primary)' }}>
                    {sessao?.materia_nome}
                  </div>
                </div>
              </div>

              <AnelTempo segundos={segundos} cor={sessao?.materia_cor} />

              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'0.72rem', color:'var(--text-secondary)', marginBottom:'var(--sp-1)',
                  textTransform:'uppercase', letterSpacing:'0.05em', fontWeight:600 }}>
                  Tempo total da sessão
                </div>
                <div style={{ fontSize:'1.75rem', fontWeight:800, color:'var(--accent)',
                  fontVariantNumeric:'tabular-nums', letterSpacing:'-0.03em' }}>
                  {formatarTempo(segundos)}
                </div>
              </div>

              {/* Stats pomodoro */}
              <div style={{
                display:'grid', gridTemplateColumns:'repeat(3,1fr)',
                gap:'var(--sp-3)', width:'100%',
              }}>
                {[
                  { valor: Math.floor(segundos/(25*60)), label:'🍅 Pomodoros' },
                  { valor: Math.round(segundos/60),       label:'⏱️ Minutos' },
                  { valor: (segundos/3600).toFixed(1),    label:'📚 Horas' },
                ].map(s => (
                  <div key={s.label} style={{
                    textAlign:'center', padding:'var(--sp-3)',
                    background:'var(--bg-elevated)', borderRadius:'var(--radius)',
                    border:'1px solid var(--border)',
                  }}>
                    <div style={{ fontWeight:800, fontSize:'1rem', color:'var(--text-primary)' }}>{s.valor}</div>
                    <div style={{ fontSize:'0.68rem', color:'var(--text-secondary)', marginTop:'var(--sp-1)' }}>{s.label}</div>
                  </div>
                ))}
              </div>

              <button onClick={handleEncerrar}
                style={{
                  width:'100%', padding:'var(--sp-3)', fontSize:'0.875rem', fontWeight:700,
                  background:'var(--danger)', color:'#fff', border:'none',
                  borderRadius:'var(--radius)', cursor:'pointer',
                  transition:'all var(--transition)',
                  boxShadow:'0 2px 8px rgba(239,68,68,0.3)',
                }}
                onMouseEnter={e => e.currentTarget.style.background='#dc2626'}
                onMouseLeave={e => e.currentTarget.style.background='var(--danger)'}>
                ⏹️ Encerrar Cronômetro
              </button>
              <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', textAlign:'center', lineHeight:1.5 }}>
                As horas serão registradas automaticamente ao encerrar
              </p>
            </>
          ) : (
            <>
              <AnelTempo segundos={0} cor="var(--accent)" />

              <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:'var(--sp-3)' }}>
                <p className="section-title">Selecione a matéria para estudar</p>

                {materias.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">📚</span>
                    <p>Crie matérias no <strong>Ciclo Semanal</strong> primeiro</p>
                  </div>
                ) : (
                  <>
                    <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-2)' }}>
                      {materias.map(m => (
                        <div key={m.id} onClick={() => setMatSel(String(m.id))}
                          style={{
                            display:'flex', alignItems:'center', gap:'var(--sp-3)',
                            padding:'var(--sp-2) var(--sp-3)',
                            borderRadius:'var(--radius)', cursor:'pointer',
                            border: String(m.id)===String(matSel) ? `2px solid ${m.cor}` : '2px solid var(--border)',
                            background: String(m.id)===String(matSel) ? `${m.cor}18` : 'var(--bg-elevated)',
                            transition:'all var(--transition)',
                          }}>
                          <span style={{ width:10, height:10, borderRadius:'50%', background:m.cor, flexShrink:0 }} />
                          <span style={{ fontSize:'0.875rem', fontWeight:500, color:'var(--text-primary)',
                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {m.nome}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button onClick={handleIniciar} className="btn-primary"
                      disabled={carregando || !matSel}
                      style={{ width:'100%', justifyContent:'center', padding:'var(--sp-3)', fontSize:'0.95rem' }}>
                      {carregando
                        ? <><span className="spinner" style={{ width:14, height:14, borderWidth:2 }} /> Iniciando...</>
                        : '▶️ Iniciar Cronômetro'}
                    </button>
                  </>
                )}
              </div>
              <p style={{ fontSize:'0.72rem', color:'var(--text-muted)', textAlign:'center', lineHeight:1.6 }}>
                Cada 25 min = 1 🍅 Pomodoro. As horas são registradas automaticamente ao encerrar.
              </p>
            </>
          )}
        </div>

        {/* ── Histórico ── */}
        <div className="card content-card">
          <h3 style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text-primary)' }}>
            📋 Histórico de Sessões
          </h3>

          <div className="divider" style={{ margin:0 }} />

          {historico.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📭</span>
              <p>Nenhuma sessão encerrada ainda</p>
            </div>
          ) : (
            <div style={{ maxHeight:480, overflowY:'auto', paddingRight:2, display:'flex', flexDirection:'column', gap:'var(--sp-2)' }}>
              {historico.map(h => (
                <div key={h.id} style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'var(--sp-3)', background:'var(--bg-elevated)',
                  borderRadius:'var(--radius)', border:'1px solid var(--border)',
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)', minWidth:0 }}>
                    <span style={{ width:10, height:10, borderRadius:'50%', background:h.materia_cor, flexShrink:0 }} />
                    <div style={{ minWidth:0 }}>
                      <div style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--text-primary)',
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {h.materia_nome}
                      </div>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-secondary)', marginTop:'var(--sp-1)' }}>
                        {fmt(h.iniciado_em)}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right', flexShrink:0, marginLeft:'var(--sp-3)' }}>
                    <div style={{ fontWeight:700, color:'var(--accent)', fontSize:'0.875rem' }}>
                      {fmtDuracao(h.duracao_seg)}
                    </div>
                    <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)', marginTop:'var(--sp-1)' }}>
                      {Math.floor((h.duracao_seg||0)/(25*60))} 🍅
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
