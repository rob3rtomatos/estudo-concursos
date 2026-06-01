/**
 * Simulados.jsx — Criar, editar, excluir e realizar simulados
 */
import { useEffect, useState, useCallback } from 'react';
import api   from '../services/api';
import toast from 'react-hot-toast';
import BarraProgresso from '../components/BarraProgresso';

const LETRAS = ['A','B','C','D','E'];

/* ── Modal criar/editar simulado ── */
function ModalSimulado({ simulado, questoesDisponiveis, onSalvar, onFechar }) {
  const [form,       setForm]   = useState({
    titulo:     simulado?.titulo     || '',
    descricao:  simulado?.descricao  || '',
    tempo_min:  simulado?.tempo_min  || 60,
    questao_ids: simulado?.questoes?.map(q => q.id) || []
  });
  const [busca,    setBusca]   = useState('');
  const [salvando, setSalv]    = useState(false);
  const editando = !!simulado;

  const questoesFiltradas = questoesDisponiveis.filter(q =>
    !busca || q.enunciado.toLowerCase().includes(busca.toLowerCase()) ||
    (q.materia_nome || '').toLowerCase().includes(busca.toLowerCase()) ||
    (q.banca || '').toLowerCase().includes(busca.toLowerCase())
  );

  function toggleQuestao(id) {
    setForm(p => ({
      ...p,
      questao_ids: p.questao_ids.includes(id)
        ? p.questao_ids.filter(x => x !== id)
        : [...p.questao_ids, id]
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.titulo.trim()) return toast.error('Título é obrigatório');
    if (form.questao_ids.length === 0) return toast.error('Adicione pelo menos 1 questão');
    setSalv(true);
    try {
      let data;
      if (editando) {
        ({ data } = await api.put(`/simulados/${simulado.id}`, form));
        toast.success('Simulado atualizado!');
      } else {
        ({ data } = await api.post('/simulados', form));
        toast.success('Simulado criado!');
      }
      onSalvar(data.simulado, editando);
    } catch {} finally { setSalv(false); }
  }

  const overlay = 'modal-overlay';
  const modal   = { maxWidth:750 };
  const lbl = { fontSize:'0.75rem', color:'var(--text-secondary)', display:'block', marginBottom:'var(--sp-1)' };

  return (
    <div className={overlay} onClick={e => e.target === e.currentTarget && onFechar()}>
      <div className="modal-box" style={modal}>
        <div className="modal-header">
          <h3 style={{ fontWeight:700, fontSize:'0.95rem' }}>
            {editando ? '✏️ Editar Simulado' : '➕ Novo Simulado'}
          </h3>
          <button onClick={onFechar} className="modal-close">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:'var(--sp-3)',
            marginBottom:'var(--sp-3)' }}>
            <div>
              <label className='form-label'>Título do Simulado *</label>
              <input type="text" className="input-field" required
                placeholder="Ex: Simulado CESPE - Banco de Dados"
                value={form.titulo}
                onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} />
            </div>
            <div>
              <label className='form-label'>Tempo (min)</label>
              <input type="number" className="input-field"
                min="10" max="360" value={form.tempo_min}
                onChange={e => setForm(p => ({ ...p, tempo_min: +e.target.value }))} />
            </div>
          </div>

          <div style={{ marginBottom:'var(--sp-4)' }}>
            <label className='form-label'>Descrição</label>
            <textarea className="input-field" rows={2}
              placeholder="Descrição opcional do simulado..."
              value={form.descricao}
              onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
              style={{ resize:'none' }} />
          </div>

          {/* Seleção de questões */}
          <div>
            <div style={{ display:'flex', justifyContent:'space-between',
              alignItems:'center', marginBottom:'var(--sp-2)' }}>
              <label className='form-label' style={{ marginBottom:0 }}>
                Questões ({form.questao_ids.length} selecionadas)
              </label>
              <input type="text" className="input-field" placeholder="🔍 Filtrar questões..."
                value={busca} onChange={e => setBusca(e.target.value)}
                style={{ width:220 }} />
            </div>

            <div style={{ maxHeight:280, overflowY:'auto',
              border:'1px solid var(--border)', borderRadius:'var(--radius)' }}>
              {questoesFiltradas.length === 0 ? (
                <div style={{ padding:'1.5rem', textAlign:'center',
                  color:'var(--text-secondary)', fontSize:'0.875rem' }}>
                  Nenhuma questão encontrada. Crie questões primeiro.
                </div>
              ) : questoesFiltradas.map(q => {
                const sel = form.questao_ids.includes(q.id);
                return (
                  <div key={q.id} onClick={() => toggleQuestao(q.id)} style={{
                    display:'flex', gap:'var(--sp-3)', alignItems:'flex-start',
                    padding:'var(--sp-2) var(--sp-4)', cursor:'pointer',
                    background: sel ? 'rgba(99,102,241,0.08)' : 'transparent',
                    borderBottom:'1px solid var(--border)',
                    borderLeft: sel ? '3px solid var(--accent)' : '3px solid transparent',
                    transition:'all var(--transition)'
                  }}>
                    <div style={{
                      width:20, height:20, borderRadius:'0.25rem', flexShrink:0,
                      border: sel ? 'none' : '2px solid var(--border)',
                      background: sel ? 'var(--accent)' : 'transparent',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      color:'white', fontSize:'0.75rem', marginTop:'var(--sp-1)'
                    }}>
                      {sel && '✓'}
                    </div>
                    <div style={{ minWidth:0 }}>
                      {q.materia_nome && (
                        <span style={{ fontSize:'0.68rem', color: q.materia_cor,
                          fontWeight:600, marginRight:6 }}>{q.materia_nome}</span>
                      )}
                      {q.banca && (
                        <span style={{ fontSize:'0.68rem',
                          color:'var(--text-secondary)' }}>{q.banca}</span>
                      )}
                      <p style={{ fontSize:'0.875rem', color:'var(--text-primary)',
                        marginTop:'var(--sp-1)', overflow:'hidden', textOverflow:'ellipsis',
                        display:'-webkit-box', WebkitLineClamp:1,
                        WebkitBoxOrient:'vertical' }}>
                        {q.enunciado}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display:'flex', gap:'var(--sp-3)', justifyContent:'flex-end',
            marginTop:'1.5rem' }}>
            <button type="button" onClick={onFechar}
              style={{ background:'var(--border)', color:'var(--text-primary)',
                border:'none', borderRadius:'var(--radius)', padding:'0.6rem 1.25rem',
                cursor:'pointer', fontWeight:600 }}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={salvando}>
              {salvando ? 'Salvando...' : editando ? '💾 Atualizar' : '✅ Criar Simulado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Modal para realizar o simulado ── */
function ModalRealizar({ simulado, onFechar }) {
  const [respostas, setRespostas] = useState({});
  const [resultado, setResultado] = useState(null);
  const [enviando,  setEnviando]  = useState(false);
  const [gabaritos, setGabaritos] = useState({});

  function marcar(questaoId, letra) {
    setRespostas(p => ({ ...p, [questaoId]: letra }));
  }

  async function finalizar() {
    const faltando = simulado.questoes.filter(q => !respostas[q.id]);
    if (faltando.length > 0 &&
      !window.confirm(`${faltando.length} questão(ões) sem resposta. Finalizar assim mesmo?`))
      return;

    setEnviando(true);
    try {
      const payload = simulado.questoes.map(q => ({
        questao_id: q.id,
        resposta: respostas[q.id] || null
      }));
      const { data } = await api.post(`/simulados/${simulado.id}/responder`, {
        respostas: payload, tentativa: 1
      });
      setResultado(data);
      // Montar mapa gabarito
      const gab = {};
      data.detalhes.forEach(d => { gab[d.questao_id] = d.gabarito; });
      setGabaritos(gab);
    } catch {} finally { setEnviando(false); }
  }

  const overlay = {
    position:'fixed', inset:0, background:'rgba(0,0,0,0.65)',
    zIndex:300, display:'flex', alignItems:'center',
    justifyContent:'center', overflowY:'auto', padding:'var(--sp-4)'
  };
  const modal = {
    background:'var(--bg-secondary)', borderRadius:'1rem',
    border:'1px solid var(--border)', width:'100%', maxWidth:760,
    padding:'var(--sp-6)', boxShadow:'var(--shadow-lg)'
  };

  return (
    <div className={overlay} onClick={e => e.target === e.currentTarget && onFechar()}>
      <div className="modal-box" style={modal}>
        <div style={{ display:'flex', justifyContent:'space-between',
          alignItems:'center', marginBottom:'var(--sp-4)' }}>
          <div>
            <h3 style={{ fontWeight:700, fontSize:'0.95rem' }}>{simulado.titulo}</h3>
            <p style={{ fontSize:'0.75rem', color:'var(--text-secondary)', marginTop:'var(--sp-1)' }}>
              {simulado.questoes.length} questões · {simulado.tempo_min} minutos
            </p>
          </div>
          <button onClick={onFechar} style={{ background:'none', border:'none',
            cursor:'pointer', fontSize:'0.95rem', color:'var(--text-secondary)' }}>✕</button>
        </div>

        {/* Resultado */}
        {resultado && (
          <div style={{
            background: resultado.percentual >= 60 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${resultado.percentual >= 60 ? '#22c55e' : '#ef4444'}`,
            borderRadius:'var(--radius-lg)', padding:'1rem', marginBottom:'var(--sp-5)', textAlign:'center'
          }}>
            <div style={{ fontSize:'2.5rem', fontWeight:800,
              color: resultado.percentual >= 60 ? '#22c55e' : '#ef4444' }}>
              {resultado.percentual}%
            </div>
            <div style={{ color:'var(--text-primary)', fontWeight:600 }}>
              {resultado.acertos} de {resultado.total} questões corretas
            </div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)', marginTop:'var(--sp-1)' }}>
              {resultado.percentual >= 70 ? '🎉 Excelente!' :
               resultado.percentual >= 50 ? '👍 Bom resultado!' : '📚 Continue estudando!'}
            </div>
          </div>
        )}

        {/* Questões */}
        <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-5)' }}>
          {simulado.questoes.map((q, idx) => {
            const resp    = respostas[q.id];
            const gabSel  = gabaritos[q.id];
            return (
              <div key={q.id} style={{
                background:'var(--bg-primary)', borderRadius:'var(--radius-lg)',
                border:'1px solid var(--border)', padding:'1rem'
              }}>
                {/* Cabeçalho */}
                <div style={{ display:'flex', gap:'var(--sp-2)', marginBottom:'var(--sp-2)',
                  flexWrap:'wrap', alignItems:'center' }}>
                  <span style={{ fontWeight:700, fontSize:'0.875rem',
                    color:'var(--text-secondary)' }}>Q{idx + 1}</span>
                  {q.materia_nome && (
                    <span style={{ background:`${q.materia_cor}20`,
                      color: q.materia_cor, borderRadius:999,
                      padding:'0.25rem 0.6rem', fontSize:'0.7rem', fontWeight:600 }}>
                      {q.materia_nome}
                    </span>
                  )}
                  {q.banca && (
                    <span style={{ fontSize:'0.7rem', color:'var(--text-secondary)' }}>
                      {q.banca}{q.ano ? ` · ${q.ano}` : ''}
                    </span>
                  )}
                </div>

                <p style={{ fontSize:'0.875rem', lineHeight:1.6,
                  color:'var(--text-primary)', marginBottom:'var(--sp-3)' }}>
                  {q.enunciado}
                </p>

                {/* Alternativas */}
                <div style={{ display:'flex', flexDirection:'column', gap:'var(--sp-2)' }}>
                  {LETRAS.filter(l => q[`alternativa_${l.toLowerCase()}`]).map(l => {
                    const marcada = resp === l;
                    const certa   = resultado && gabSel === l;
                    const errada  = resultado && marcada && !certa;
                    return (
                      <div key={l} onClick={() => !resultado && marcar(q.id, l)} style={{
                        display:'flex', gap:'var(--sp-3)', alignItems:'flex-start',
                        padding:'var(--sp-2) var(--sp-3)', borderRadius:'var(--radius)', cursor: resultado ? 'default' : 'pointer',
                        border: certa ? '2px solid #22c55e' :
                                errada ? '2px solid #ef4444' :
                                marcada ? '2px solid var(--accent)' : '1px solid var(--border)',
                        background: certa ? 'rgba(34,197,94,0.08)' :
                                    errada ? 'rgba(239,68,68,0.08)' :
                                    marcada ? 'rgba(99,102,241,0.08)' : 'transparent',
                        transition:'all var(--transition)'
                      }}>
                        <span style={{
                          width:24, height:24, borderRadius:'50%', flexShrink:0,
                          background: certa ? '#22c55e' :
                                      errada ? '#ef4444' :
                                      marcada ? 'var(--accent)' : 'var(--border)',
                          color:'white', display:'flex', alignItems:'center',
                          justifyContent:'center', fontSize:'0.75rem', fontWeight:700
                        }}>{l}</span>
                        <span style={{ fontSize:'0.875rem', lineHeight:1.5,
                          color:'var(--text-primary)' }}>
                          {q[`alternativa_${l.toLowerCase()}`]}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Comentário após resultado */}
                {resultado && q.comentario && (
                  <div style={{ marginTop:'0.75rem', padding:'0.75rem',
                    background:'rgba(99,102,241,0.06)', borderRadius:'var(--radius)',
                    border:'1px solid rgba(99,102,241,0.2)' }}>
                    <span style={{ fontSize:'0.72rem', fontWeight:700,
                      color:'var(--accent)' }}>💬 COMENTÁRIO</span>
                    <p style={{ fontSize:'0.875rem', lineHeight:1.6,
                      color:'var(--text-primary)', marginTop:'var(--sp-1)' }}>
                      {q.comentario}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Botão finalizar */}
        {!resultado && (
          <button onClick={finalizar} className="btn-primary"
            disabled={enviando}
            style={{ width:'100%', marginTop:'1.5rem', padding:'0.875rem', fontSize:'0.875rem' }}>
            {enviando ? 'Corrigindo...' : '✅ Finalizar e Corrigir'}
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Página principal ── */
export default function Simulados() {
  const [simulados,  setSimulados]  = useState([]);
  const [questoes,   setQuestoes]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [modal,      setModal]      = useState(null);   // null | 'novo' | simulado (editar)
  const [realizando, setRealizando] = useState(null);  // simulado com questoes

  useEffect(() => {
    Promise.all([api.get('/simulados'), api.get('/questoes?limit=500')])
      .then(([s, q]) => {
        setSimulados(s.data.simulados);
        setQuestoes(q.data.questoes);
      })
      .catch(() => toast.error('Erro ao carregar dados'))
      .finally(() => setLoading(false));
  }, []);

  function onSalvar(sim, editando) {
    if (editando) {
      setSimulados(p => p.map(s => s.id === sim.id ? { ...s, ...sim } : s));
    } else {
      setSimulados(p => [sim, ...p]);
    }
    setModal(null);
  }

  async function remover(id) {
    if (!window.confirm('Remover este simulado?')) return;
    try {
      await api.delete(`/simulados/${id}`);
      setSimulados(p => p.filter(s => s.id !== id));
      toast.success('Simulado removido');
    } catch {}
  }

  async function abrirSimulado(sim) {
    try {
      const { data } = await api.get(`/simulados/${sim.id}`);
      setRealizando(data.simulado);
    } catch { toast.error('Erro ao carregar simulado'); }
  }

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:'3rem' }}>
      <span className="spinner" />
    </div>
  );

  return (
    <div className="page-wrapper">
      {modal && (
        <ModalSimulado
          simulado={modal === 'novo' ? null : modal}
          questoesDisponiveis={questoes}
          onSalvar={onSalvar}
          onFechar={() => setModal(null)} />
      )}
      {realizando && (
        <ModalRealizar
          simulado={realizando}
          onFechar={() => setRealizando(null)} />
      )}

      <div className="page-header">
        <h2 className="page-title">
          📋 Simulados
          <span style={{ marginLeft:'var(--sp-2)', fontSize:'0.875rem', fontWeight:400,
            color:'var(--text-secondary)' }}>({simulados.length} criados)</span>
        </h2>
        <button onClick={() => setModal('novo')} className="btn-primary">
          + Novo Simulado
        </button>
      </div>

      <BarraProgresso />

      {simulados.length === 0 ? (
        <div className="card">
          <div className="empty-state" style={{ padding:'3rem' }}>
            <span className="empty-icon">📋</span>
            <p>Nenhum simulado criado ainda{questoes.length===0 ? ' — crie questões primeiro' : ''}</p>
            <button onClick={() => setModal('novo')} className="btn-primary"
              style={{ marginTop:'var(--sp-4)' }}>+ Criar Simulado</button>
          </div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))',
          gap:'var(--sp-3)' }}>
          {simulados.map(s => (
            <div key={s.id} className="card" style={{ padding:'var(--sp-5)' }}>
              {/* Header */}
              <div style={{ marginBottom:'var(--sp-3)' }}>
                <h3 style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text-primary)',
                  marginBottom:'var(--sp-1)' }}>{s.titulo}</h3>
                {s.descricao && (
                  <p style={{ fontSize:'0.875rem', color:'var(--text-secondary)',
                    lineHeight:1.5 }}>{s.descricao}</p>
                )}
              </div>

              {/* Stats */}
              <div style={{ display:'flex', gap:'var(--sp-3)', marginBottom:'var(--sp-4)' }}>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontWeight:700, fontSize:'0.95rem', color:'var(--accent)' }}>
                    {s.total_questoes}
                  </div>
                  <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)' }}>Questões</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontWeight:700, fontSize:'0.95rem', color:'var(--text-primary)' }}>
                    {s.tempo_min}
                  </div>
                  <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)' }}>Minutos</div>
                </div>
                <div style={{ textAlign:'center' }}>
                  <div style={{ fontWeight:700, fontSize:'0.95rem', color:'var(--text-primary)' }}>
                    {new Date(s.criado_em).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit' })}
                  </div>
                  <div style={{ fontSize:'0.7rem', color:'var(--text-secondary)' }}>Criado</div>
                </div>
              </div>

              {/* Ações */}
              <div style={{ display:'flex', gap:'var(--sp-2)' }}>
                <button onClick={() => abrirSimulado(s)} className="btn-primary"
                  style={{ flex:1, fontSize:'0.875rem', padding:'var(--sp-2) var(--sp-3)' }}>
                  ▶️ Realizar
                </button>
                <button onClick={() => {
                  api.get(`/simulados/${s.id}`)
                    .then(({ data }) => setModal(data.simulado))
                    .catch(() => toast.error('Erro ao carregar'));
                  }}
                  className="btn-secondary"
                  style={{ padding:'var(--sp-2) var(--sp-3)' }}>
                  ✏️
                </button>
                <button onClick={() => remover(s.id)}
                  style={{ background:'none', border:'1px solid var(--border)',
                    color:'var(--danger)', borderRadius:'var(--radius)',
                    padding:'var(--sp-2) var(--sp-3)', cursor:'pointer', fontSize:'0.875rem',
                    transition:'all var(--transition)' }}
                  onMouseEnter={e=>{e.currentTarget.style.background='var(--danger-soft)';e.currentTarget.style.borderColor='var(--danger)'}}
                  onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.borderColor='var(--border)'}}>
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
