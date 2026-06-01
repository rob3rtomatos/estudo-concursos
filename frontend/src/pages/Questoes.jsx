/**
 * Questoes.jsx — CRUD completo de questões com filtros e paginação
 */
import { useEffect, useState, useCallback } from 'react';
import api   from '../services/api';
import toast from 'react-hot-toast';
import BarraProgresso from '../components/BarraProgresso';

const DIFICULDADES = ['facil','media','dificil'];
const LETRAS       = ['A','B','C','D','E'];
const COR_DIFIC    = { facil:'#22c55e', media:'#f59e0b', dificil:'#ef4444' };

const FORM_VAZIO = {
  materia_id:'', banca:'', ano:'', enunciado:'',
  alternativa_a:'', alternativa_b:'', alternativa_c:'',
  alternativa_d:'', alternativa_e:'',
  gabarito:'', comentario:'', dificuldade:'media'
};

/* ── Modal de criação/edição ── */
function ModalQuestao({ questao, materias, bancas, onSalvar, onFechar }) {
  const [form, setForm]     = useState(questao || FORM_VAZIO);
  const [salvando, setSalv] = useState(false);
  const editando = !!questao;

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.enunciado.trim()) return toast.error('Enunciado é obrigatório');
    setSalv(true);
    try {
      let data;
      if (editando) {
        ({ data } = await api.put(`/questoes/${questao.id}`, form));
        toast.success('Questão atualizada!');
      } else {
        ({ data } = await api.post('/questoes', form));
        toast.success('Questão criada!');
      }
      onSalvar(data.questao, editando);
    } catch {} finally { setSalv(false); }
  }

  const overlay = {
    position:'fixed', inset:0, background:'rgba(0,0,0,0.5)',
    zIndex:300, display:'flex', alignItems:'flex-start',
    justifyContent:'center', overflowY:'auto', padding:'2rem 1rem'
  };
  const modal = {
    background:'var(--bg-secondary)', borderRadius:'1rem',
    border:'1px solid var(--border)', width:'100%', maxWidth:700,
    padding:'2rem', boxShadow:'0 20px 60px rgba(0,0,0,0.3)'
  };

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onFechar()}>
      <div style={modal}>
        <div style={{ display:'flex', justifyContent:'space-between',
          alignItems:'center', marginBottom:'1.5rem' }}>
          <h3 style={{ fontWeight:700, fontSize:'1.1rem' }}>
            {editando ? '✏️ Editar Questão' : '➕ Nova Questão'}
          </h3>
          <button onClick={onFechar} style={{ background:'none', border:'none',
            cursor:'pointer', fontSize:'1.2rem', color:'var(--text-secondary)' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Linha 1: Matéria + Banca + Ano + Dificuldade */}
          <div style={{ display:'grid', gridTemplateColumns:'2fr 1.5fr 1fr 1fr',
            gap:'0.75rem', marginBottom:'0.875rem' }}>
            <div>
              <label style={lbl}>Matéria</label>
              <select className="input-field" value={form.materia_id}
                onChange={e => set('materia_id', e.target.value)}>
                <option value="">— Sem matéria —</option>
                {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Banca</label>
              <input list="bancas-list" className="input-field"
                placeholder="CESPE, FCC..." value={form.banca}
                onChange={e => set('banca', e.target.value)} />
              <datalist id="bancas-list">
                {bancas.map(b => <option key={b} value={b} />)}
              </datalist>
            </div>
            <div>
              <label style={lbl}>Ano</label>
              <input type="number" className="input-field"
                placeholder="2023" min="1990" max="2030"
                value={form.ano} onChange={e => set('ano', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Dificuldade</label>
              <select className="input-field" value={form.dificuldade}
                onChange={e => set('dificuldade', e.target.value)}>
                {DIFICULDADES.map(d => <option key={d} value={d}>
                  {d.charAt(0).toUpperCase()+d.slice(1)}
                </option>)}
              </select>
            </div>
          </div>

          {/* Enunciado */}
          <div style={{ marginBottom:'0.875rem' }}>
            <label style={lbl}>Enunciado *</label>
            <textarea className="input-field" rows={4} required
              placeholder="Digite o enunciado da questão..."
              value={form.enunciado} onChange={e => set('enunciado', e.target.value)}
              style={{ resize:'vertical' }} />
          </div>

          {/* Alternativas */}
          <div style={{ marginBottom:'0.875rem' }}>
            <label style={lbl}>Alternativas</label>
            {LETRAS.map(l => (
              <div key={l} style={{ display:'flex', gap:'0.5rem',
                alignItems:'center', marginBottom:'0.4rem' }}>
                <div style={{
                  width:28, height:28, borderRadius:'50%', flexShrink:0,
                  background: form.gabarito === l ? 'var(--accent)' : 'var(--border)',
                  color: form.gabarito === l ? 'white' : 'var(--text-secondary)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontWeight:700, fontSize:'0.8rem', cursor:'pointer',
                  transition:'all 0.15s'
                }} onClick={() => set('gabarito', form.gabarito === l ? '' : l)}>
                  {l}
                </div>
                <input className="input-field"
                  placeholder={`Alternativa ${l}`}
                  value={form[`alternativa_${l.toLowerCase()}`]}
                  onChange={e => set(`alternativa_${l.toLowerCase()}`, e.target.value)} />
              </div>
            ))}
            <p style={{ fontSize:'0.72rem', color:'var(--text-secondary)', marginTop:4 }}>
              Clique na letra para marcar o gabarito
            </p>
          </div>

          {/* Comentário */}
          <div style={{ marginBottom:'1.25rem' }}>
            <label style={lbl}>💬 Comentário / Explicação</label>
            <textarea className="input-field" rows={3}
              placeholder="Comentário sobre a questão, dicas, macetes..."
              value={form.comentario} onChange={e => set('comentario', e.target.value)}
              style={{ resize:'vertical' }} />
          </div>

          <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
            <button type="button" onClick={onFechar}
              style={{ background:'var(--border)', color:'var(--text-primary)',
                border:'none', borderRadius:'0.5rem', padding:'0.6rem 1.25rem',
                cursor:'pointer', fontWeight:600 }}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={salvando}>
              {salvando ? 'Salvando...' : editando ? '💾 Atualizar' : '✅ Criar Questão'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const lbl = { fontSize:'0.78rem', color:'var(--text-secondary)', display:'block', marginBottom:4 };

/* ── Página principal ── */
export default function Questoes() {
  const [questoes,  setQuestoes]  = useState([]);
  const [materias,  setMaterias]  = useState([]);
  const [bancas,    setBancas]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [modal,     setModal]     = useState(null);  // null | 'novo' | questao
  const [detalhe,   setDetalhe]   = useState(null);  // questão expandida
  const [filtros,   setFiltros]   = useState({ banca:'', materia_id:'', dificuldade:'', busca:'' });
  const [pag,       setPag]       = useState({ page:1, pages:1, total:0 });

  const carregar = useCallback(async (pg = 1) => {
    setLoading(true);
    try {
      const params = { page: pg, limit: 15, ...filtros };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const { data } = await api.get('/questoes', { params });
      setQuestoes(data.questoes);
      setPag({ page: data.page, pages: data.pages, total: data.total });
    } catch {
      toast.error('Erro ao carregar questões');
    } finally { setLoading(false); }
  }, [filtros]);

  useEffect(() => {
    Promise.all([api.get('/materias'), api.get('/questoes/bancas')])
      .then(([m, b]) => { setMaterias(m.data.materias); setBancas(b.data.bancas); });
  }, []);

  useEffect(() => { carregar(1); }, [filtros]);

  function onSalvar(q, editando) {
    if (editando) {
      setQuestoes(p => p.map(x => x.id === q.id ? { ...x, ...q } : x));
    } else {
      setQuestoes(p => [q, ...p]);
      setPag(p => ({ ...p, total: p.total + 1 }));
    }
    setModal(null);
  }

  async function remover(id) {
    if (!window.confirm('Remover esta questão? Ela será removida dos simulados também.')) return;
    try {
      await api.delete(`/questoes/${id}`);
      setQuestoes(p => p.filter(q => q.id !== id));
      setPag(p => ({ ...p, total: p.total - 1 }));
      toast.success('Questão removida');
    } catch {}
  }

  const COR = { facil:'#22c55e', media:'#f59e0b', dificil:'#ef4444' };

  return (
    <div className="fade-in">
      {modal && (
        <ModalQuestao
          questao={modal === 'novo' ? null : modal}
          materias={materias} bancas={bancas}
          onSalvar={onSalvar}
          onFechar={() => setModal(null)} />
      )}

      <div style={{ display:'flex', justifyContent:'space-between',
        alignItems:'center', marginBottom:'1rem' }}>
        <h2 style={{ fontSize:'1.4rem', fontWeight:700, color:'var(--text-primary)' }}>
          📝 Questões
          <span style={{ marginLeft:8, fontSize:'0.85rem', fontWeight:400,
            color:'var(--text-secondary)' }}>
            ({pag.total} no total)
          </span>
        </h2>
        <button onClick={() => setModal('novo')} className="btn-primary">
          + Nova Questão
        </button>
      </div>

      <BarraProgresso />

      {/* Filtros */}
      <div className="card" style={{ marginBottom:'1rem',
        display:'grid', gridTemplateColumns:'2fr 1.5fr 1fr 2fr', gap:'0.75rem',
        padding:'1rem' }}>
        <div>
          <label style={lbl}>Banca</label>
          <select className="input-field" value={filtros.banca}
            onChange={e => setFiltros(p => ({ ...p, banca: e.target.value }))}>
            <option value="">Todas as bancas</option>
            {bancas.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Matéria</label>
          <select className="input-field" value={filtros.materia_id}
            onChange={e => setFiltros(p => ({ ...p, materia_id: e.target.value }))}>
            <option value="">Todas</option>
            {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Dificuldade</label>
          <select className="input-field" value={filtros.dificuldade}
            onChange={e => setFiltros(p => ({ ...p, dificuldade: e.target.value }))}>
            <option value="">Todas</option>
            {DIFICULDADES.map(d => <option key={d} value={d}>
              {d.charAt(0).toUpperCase()+d.slice(1)}
            </option>)}
          </select>
        </div>
        <div>
          <label style={lbl}>Buscar no enunciado</label>
          <input type="text" className="input-field"
            placeholder="🔍 Pesquisar..."
            value={filtros.busca}
            onChange={e => setFiltros(p => ({ ...p, busca: e.target.value }))} />
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-secondary)' }}>
          Carregando...
        </div>
      ) : questoes.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'3rem' }}>
          <p style={{ fontSize:'3rem' }}>📭</p>
          <p style={{ color:'var(--text-secondary)', marginTop:8 }}>
            Nenhuma questão encontrada
          </p>
          <button onClick={() => setModal('novo')} className="btn-primary"
            style={{ marginTop:'1rem' }}>+ Criar primeira questão</button>
        </div>
      ) : (
        <>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            {questoes.map(q => (
              <div key={q.id} className="card" style={{ padding:'1rem 1.25rem' }}>
                <div style={{ display:'flex', justifyContent:'space-between',
                  alignItems:'flex-start', gap:'1rem' }}>
                  {/* Info principal */}
                  <div style={{ flex:1, minWidth:0 }}>
                    {/* Tags */}
                    <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem', marginBottom:8 }}>
                      {q.materia_nome && (
                        <span style={{ background:`${q.materia_cor}20`,
                          color: q.materia_cor, borderRadius:999,
                          padding:'0.15rem 0.6rem', fontSize:'0.7rem', fontWeight:600,
                          border:`1px solid ${q.materia_cor}40` }}>
                          {q.materia_nome}
                        </span>
                      )}
                      {q.banca && (
                        <span style={{ background:'var(--bg-primary)',
                          border:'1px solid var(--border)', borderRadius:999,
                          padding:'0.15rem 0.6rem', fontSize:'0.7rem',
                          color:'var(--text-secondary)' }}>
                          {q.banca}{q.ano ? ` · ${q.ano}` : ''}
                        </span>
                      )}
                      <span style={{ background:`${COR[q.dificuldade]}20`,
                        color: COR[q.dificuldade], borderRadius:999,
                        padding:'0.15rem 0.6rem', fontSize:'0.7rem', fontWeight:600 }}>
                        {q.dificuldade}
                      </span>
                    </div>

                    {/* Enunciado */}
                    <p style={{ fontSize:'0.875rem', lineHeight:1.6,
                      color:'var(--text-primary)',
                      display:'-webkit-box', WebkitLineClamp: detalhe === q.id ? undefined : 2,
                      WebkitBoxOrient:'vertical',
                      overflow: detalhe === q.id ? 'visible' : 'hidden' }}>
                      {q.enunciado}
                    </p>

                    {/* Expandido: alternativas + comentário */}
                    {detalhe === q.id && (
                      <div style={{ marginTop:'0.875rem' }}>
                        {LETRAS.filter(l => q[`alternativa_${l.toLowerCase()}`]).map(l => (
                          <div key={l} style={{
                            display:'flex', gap:'0.6rem', alignItems:'flex-start',
                            padding:'0.3rem 0', borderBottom:'1px solid var(--border)'
                          }}>
                            <span style={{
                              width:22, height:22, borderRadius:'50%', flexShrink:0,
                              background: q.gabarito === l ? '#22c55e' : 'var(--border)',
                              color: q.gabarito === l ? 'white' : 'var(--text-secondary)',
                              display:'flex', alignItems:'center', justifyContent:'center',
                              fontSize:'0.72rem', fontWeight:700
                            }}>{l}</span>
                            <span style={{ fontSize:'0.82rem',
                              color:'var(--text-primary)', lineHeight:1.5 }}>
                              {q[`alternativa_${l.toLowerCase()}`]}
                            </span>
                          </div>
                        ))}
                        {q.gabarito && (
                          <div style={{ marginTop:8, padding:'0.5rem 0.75rem',
                            background:'rgba(34,197,94,0.1)', borderRadius:'0.375rem',
                            fontSize:'0.8rem', color:'#22c55e', fontWeight:600 }}>
                            ✓ Gabarito: {q.gabarito}
                          </div>
                        )}
                        {q.comentario && (
                          <div style={{ marginTop:'0.75rem', padding:'0.75rem',
                            background:'var(--bg-primary)', borderRadius:'0.5rem',
                            border:'1px solid var(--border)' }}>
                            <div style={{ fontSize:'0.72rem', fontWeight:700,
                              color:'var(--text-secondary)', marginBottom:4 }}>
                              💬 COMENTÁRIO
                            </div>
                            <p style={{ fontSize:'0.82rem', lineHeight:1.6,
                              color:'var(--text-primary)' }}>{q.comentario}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <button onClick={() => setDetalhe(detalhe === q.id ? null : q.id)}
                      style={{ background:'none', border:'none', cursor:'pointer',
                        color:'var(--accent)', fontSize:'0.75rem', marginTop:4,
                        padding:0, fontWeight:600 }}>
                      {detalhe === q.id ? '▲ Recolher' : '▼ Ver detalhes'}
                    </button>
                  </div>

                  {/* Ações */}
                  <div style={{ display:'flex', gap:'0.4rem', flexShrink:0 }}>
                    <button onClick={() => setModal(q)}
                      style={{ background:'none', border:'1px solid var(--border)',
                        color:'var(--text-secondary)', borderRadius:'0.375rem',
                        padding:'0.35rem 0.6rem', cursor:'pointer', fontSize:'0.8rem' }}>
                      ✏️
                    </button>
                    <button onClick={() => remover(q.id)}
                      style={{ background:'none', border:'1px solid var(--danger)',
                        color:'var(--danger)', borderRadius:'0.375rem',
                        padding:'0.35rem 0.6rem', cursor:'pointer', fontSize:'0.8rem' }}>
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginação */}
          {pag.pages > 1 && (
            <div style={{ display:'flex', justifyContent:'center', gap:'0.5rem',
              marginTop:'1.5rem' }}>
              {Array.from({ length: pag.pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => carregar(p)}
                  style={{ width:36, height:36, borderRadius:'0.375rem', border:'none',
                    cursor:'pointer', fontWeight:600, fontSize:'0.875rem',
                    background: p === pag.page ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: p === pag.page ? 'white' : 'var(--text-primary)',
                    border:'1px solid var(--border)' }}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
