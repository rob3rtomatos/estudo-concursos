/**
 * Cronometro.jsx
 * Página principal do cronômetro Pomodoro
 * - Selecionar matéria do ciclo semanal
 * - Visualizar tempo atual
 * - Histórico de sessões
 * - Encerrar cronômetro
 */

import { useEffect, useState } from 'react';
import { useCronometro }  from '../context/CronometroContext';
import BarraProgresso     from '../components/BarraProgresso';
import api   from '../services/api';
import toast from 'react-hot-toast';

/** Converte segundos para exibição HH:MM:SS ou MM:SS */
function fmtDuracao(seg) {
  if (!seg) return '00:00';
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}h ${mm}m` : `${mm}m ${ss}s`;
}

/** Anel SVG de progresso (estilo pomodoro 25 min) */
function AnelTempo({ segundos, cor }) {
  const POMODORO    = 25 * 60;  // 25 minutos em segundos
  const progresso   = Math.min(1, segundos / POMODORO);
  const RAIO        = 80;
  const CIRCUNF     = 2 * Math.PI * RAIO;
  const dashOffset  = CIRCUNF * (1 - progresso);
  const ciclos      = Math.floor(segundos / POMODORO);

  return (
    <div style={{ position:'relative', display:'inline-flex',
      alignItems:'center', justifyContent:'center' }}>
      <svg width={200} height={200}>
        {/* Trilha do anel */}
        <circle cx={100} cy={100} r={RAIO}
          fill="none" stroke="var(--border)" strokeWidth={10} />
        {/* Progresso */}
        <circle cx={100} cy={100} r={RAIO}
          fill="none"
          stroke={cor || 'var(--accent)'}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={CIRCUNF}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 100 100)"
          style={{ transition:'stroke-dashoffset 1s linear' }}
        />
      </svg>
      {/* Texto central */}
      <div style={{ position:'absolute', textAlign:'center' }}>
        {ciclos > 0 && (
          <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)',
            marginBottom:2 }}>
            {'🍅'.repeat(Math.min(ciclos, 5))}
          </div>
        )}
        <div style={{ fontSize:'2.25rem', fontWeight:800, color:'var(--text-primary)',
          fontVariantNumeric:'tabular-nums', letterSpacing:'-0.03em',
          lineHeight:1 }}>
          {/* Mostrar tempo restante no pomodoro atual */}
          {(() => {
            const restante = POMODORO - (segundos % POMODORO);
            const m = Math.floor(restante / 60);
            const s = restante % 60;
            return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
          })()}
        </div>
        <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)', marginTop:2 }}>
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

  // Carregar matérias e histórico
  useEffect(() => {
    Promise.all([
      api.get('/materias'),
      api.get('/cronometro/historico')
    ]).then(([m, h]) => {
      setMaterias(m.data.materias);
      setHistorico(h.data.historico);
      if (m.data.materias.length > 0) setMatSel(String(m.data.materias[0].id));
    }).catch(() => toast.error('Erro ao carregar dados'));
  }, [rodando]); // Recarregar histórico ao encerrar

  const materiaSelecionada = materias.find(m => String(m.id) === String(matSel));

  async function handleIniciar() {
    if (!matSel) return toast.error('Selecione uma matéria');
    setCarregando(true);
    await iniciar(
      parseInt(matSel),
      materiaSelecionada?.nome,
      materiaSelecionada?.cor
    );
    setCarregando(false);
  }

  async function handleEncerrar() {
    if (!window.confirm('Encerrar o cronômetro? As horas serão registradas automaticamente.')) return;
    await encerrar();
    // Recarregar histórico
    api.get('/cronometro/historico')
      .then(({ data }) => setHistorico(data.historico))
      .catch(() => {});
  }

  const fmt = iso => new Date(iso).toLocaleString('pt-BR', {
    day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'
  });

  return (
    <div className="fade-in">
      <h2 style={{ fontSize:'1.4rem', fontWeight:700, marginBottom:'1rem',
        color:'var(--text-primary)' }}>
        ⏱️ Cronômetro de Estudos
      </h2>

      <BarraProgresso />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>

        {/* ── Painel principal do cronômetro ── */}
        <div className="card" style={{ display:'flex', flexDirection:'column',
          alignItems:'center', gap:'1.25rem' }}>

          {rodando ? (
            /* Estado: RODANDO */
            <>
              {/* Matéria atual */}
              <div style={{ display:'flex', alignItems:'center', gap:'0.6rem',
                background:'var(--bg-primary)', borderRadius:'0.625rem',
                padding:'0.6rem 1rem', width:'100%',
                border:'1px solid var(--border)' }}>
                <span style={{ width:14, height:14, borderRadius:'50%',
                  background: sessao?.materia_cor || 'var(--accent)', flexShrink:0 }} />
                <div>
                  <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)' }}>
                    Estudando agora
                  </div>
                  <div style={{ fontWeight:700, fontSize:'1rem',
                    color:'var(--text-primary)' }}>
                    {sessao?.materia_nome}
                  </div>
                </div>
              </div>

              {/* Anel de progresso do pomodoro */}
              <AnelTempo segundos={segundos} cor={sessao?.materia_cor} />

              {/* Tempo total */}
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)',
                  marginBottom:2 }}>Tempo total da sessão</div>
                <div style={{ fontSize:'1.5rem', fontWeight:700,
                  color:'var(--accent)', fontVariantNumeric:'tabular-nums' }}>
                  {formatarTempo(segundos)}
                </div>
              </div>

              {/* Info pomodoro */}
              <div style={{ display:'flex', gap:'1rem', fontSize:'0.75rem',
                color:'var(--text-secondary)', textAlign:'center' }}>
                <div>
                  <div style={{ fontWeight:700, color:'var(--text-primary)', fontSize:'1rem' }}>
                    {Math.floor(segundos / (25 * 60))}
                  </div>
                  <div>🍅 Pomodoros</div>
                </div>
                <div>
                  <div style={{ fontWeight:700, color:'var(--text-primary)', fontSize:'1rem' }}>
                    {Math.round(segundos / 60)}
                  </div>
                  <div>⏱️ Minutos</div>
                </div>
                <div>
                  <div style={{ fontWeight:700, color:'var(--text-primary)', fontSize:'1rem' }}>
                    {(segundos / 3600).toFixed(1)}
                  </div>
                  <div>📚 Horas</div>
                </div>
              </div>

              {/* Botão encerrar */}
              <button onClick={handleEncerrar}
                className="btn-danger"
                style={{ width:'100%', padding:'0.75rem', fontSize:'0.9rem' }}>
                ⏹️ Encerrar Cronômetro
              </button>
              <p style={{ fontSize:'0.72rem', color:'var(--text-secondary)',
                textAlign:'center', lineHeight:1.5 }}>
                As horas serão registradas automaticamente ao encerrar
              </p>
            </>
          ) : (
            /* Estado: PARADO */
            <>
              {/* Anel estático */}
              <AnelTempo segundos={0} cor="#6366f1" />

              <div style={{ width:'100%' }}>
                <label style={{ fontSize:'0.8rem', color:'var(--text-secondary)',
                  display:'block', marginBottom:6 }}>
                  Selecione a matéria para estudar
                </label>
                {materias.length === 0 ? (
                  <p style={{ color:'var(--text-secondary)', fontSize:'0.85rem',
                    textAlign:'center', padding:'1rem' }}>
                    Crie matérias no <strong>Ciclo Semanal</strong> primeiro
                  </p>
                ) : (
                  <>
                    {/* Cards de matérias para seleção visual */}
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr',
                      gap:'0.5rem', marginBottom:'1rem' }}>
                      {materias.map(m => (
                        <div key={m.id}
                          onClick={() => setMatSel(String(m.id))}
                          style={{
                            display:'flex', alignItems:'center', gap:'0.5rem',
                            padding:'0.6rem 0.75rem',
                            borderRadius:'0.5rem', cursor:'pointer',
                            border: String(m.id) === String(matSel)
                              ? `2px solid ${m.cor}`
                              : '2px solid var(--border)',
                            background: String(m.id) === String(matSel)
                              ? `${m.cor}15`
                              : 'var(--bg-primary)',
                            transition:'all 0.15s'
                          }}>
                          <span style={{ width:10, height:10, borderRadius:'50%',
                            background: m.cor, flexShrink:0 }} />
                          <span style={{ fontSize:'0.8rem', fontWeight:500,
                            color:'var(--text-primary)',
                            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {m.nome}
                          </span>
                        </div>
                      ))}
                    </div>

                    <button onClick={handleIniciar}
                      className="btn-primary"
                      disabled={carregando || !matSel}
                      style={{ width:'100%', padding:'0.75rem', fontSize:'0.95rem' }}>
                      {carregando ? 'Iniciando...' : '▶️ Iniciar Cronômetro'}
                    </button>
                  </>
                )}
              </div>
              <p style={{ fontSize:'0.72rem', color:'var(--text-secondary)',
                textAlign:'center', lineHeight:1.5 }}>
                Cada 25 min = 1 🍅 Pomodoro. As horas são registradas automaticamente ao encerrar.
              </p>
            </>
          )}
        </div>

        {/* ── Histórico de sessões ── */}
        <div className="card">
          <h3 style={{ fontWeight:700, marginBottom:'1rem', fontSize:'1rem',
            color:'var(--text-primary)' }}>
            📋 Histórico de Sessões
          </h3>

          {historico.length === 0 ? (
            <div style={{ textAlign:'center', padding:'2rem',
              color:'var(--text-secondary)' }}>
              <p style={{ fontSize:'2.5rem' }}>📭</p>
              <p style={{ marginTop:8, fontSize:'0.875rem' }}>
                Nenhuma sessão encerrada ainda
              </p>
            </div>
          ) : (
            <div style={{ maxHeight:480, overflowY:'auto', paddingRight:4 }}>
              {historico.map(h => (
                <div key={h.id} style={{
                  display:'flex', justifyContent:'space-between',
                  alignItems:'center', padding:'0.65rem 0',
                  borderBottom:'1px solid var(--border)'
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
                    <span style={{ width:10, height:10, borderRadius:'50%',
                      background: h.materia_cor, flexShrink:0 }} />
                    <div>
                      <div style={{ fontSize:'0.85rem', fontWeight:600,
                        color:'var(--text-primary)' }}>
                        {h.materia_nome}
                      </div>
                      <div style={{ fontSize:'0.72rem', color:'var(--text-secondary)' }}>
                        {fmt(h.iniciado_em)}
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign:'right' }}>
                    <div style={{ fontWeight:700, color:'var(--accent)',
                      fontSize:'0.9rem' }}>
                      {fmtDuracao(h.duracao_seg)}
                    </div>
                    <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)' }}>
                      {Math.floor((h.duracao_seg || 0) / (25 * 60))} 🍅
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
