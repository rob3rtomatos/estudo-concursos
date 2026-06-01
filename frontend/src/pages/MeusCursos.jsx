import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api   from '../services/api';
import toast from 'react-hot-toast';
import BarraProgresso from '../components/BarraProgresso';

const STATUS_LABEL = {
  nao_iniciado: { label: 'Não Iniciado', cor: '#94a3b8' },
  em_andamento: { label: 'Em Andamento', cor: '#f59e0b' },
  concluido:    { label: 'Concluído',    cor: '#22c55e' },
  pausado:      { label: 'Pausado',      cor: '#ef4444' }
};

const FORM_VAZIO = {
  nome: '', descricao: '', plataforma: '',
  carga_horaria: 0, progresso: 0,
  status: 'em_andamento', cor: '#6366f1', materia_ids: []
};

function ModalCurso({ curso, materias, onSalvar, onFechar }) {
  const [form,    setForm]   = useState(
    curso ? { ...curso, materia_ids: (curso.materias || []).map(m => m.id) } : FORM_VAZIO
  );
  const [salvando, setSalv] = useState(false);
  const editando = !!curso;
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  function toggleMateria(id) {
    setForm(p => ({
      ...p,
      materia_ids: p.materia_ids.includes(id)
        ? p.materia_ids.filter(x => x !== id)
        : [...p.materia_ids, id]
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.nome.trim()) return toast.error('Nome é obrigatório');
    setSalv(true);
    try {
      let data;
      if (editando) {
        ({ data } = await api.put(`/cursos/${curso.id}`, form));
        toast.success('Curso atualizado!');
      } else {
        ({ data } = await api.post('/cursos', form));
        toast.success('Curso criado!');
      }
      onSalvar(data.curso, editando);
    } catch (err) {
      toast.error('Erro ao salvar curso');
    } finally { setSalv(false); }
  }

  const lbl = { fontSize:'0.75rem', color:'var(--text-secondary)', display:'block', marginBottom:'var(--sp-1)' };

  return (
    <div
      className="modal-overlay"
      style={{ alignItems:'flex-start' }}
      onClick={e => e.target === e.currentTarget && onFechar()}
    >
      <div className="modal-box" style={{ maxWidth:640 }}>

        <div className="modal-header">
          <span className="modal-title">
            {editando ? '✏️ Editar Curso' : '➕ Novo Curso'}
          </span>
          <button onClick={onFechar} className="modal-close">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto',
            gap:'var(--sp-3)', marginBottom:'var(--sp-3)', alignItems:'end' }}>
            <div>
              <label style={lbl}>Nome do Curso *</label>
              <input type="text" className="input-field" required
                placeholder="Ex: Redes de Computadores"
                value={form.nome} onChange={e => set('nome', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Cor</label>
              <input type="color" value={form.cor}
                onChange={e => set('cor', e.target.value)}
                style={{ width:44, height:42, border:'1px solid var(--border)',
                  borderRadius:'var(--radius)', cursor:'pointer', padding:2 }} />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',
            gap:'var(--sp-3)', marginBottom:'var(--sp-3)' }}>
            <div>
              <label style={lbl}>Plataforma</label>
              <input type="text" className="input-field"
                placeholder="Estratégia, Udemy, TecConcursos..."
                value={form.plataforma} onChange={e => set('plataforma', e.target.value)} />
            </div>
            <div>
              <label style={lbl}>Carga Horária (h)</label>
              <input type="number" className="input-field"
                min="0" max="2000"
                value={form.carga_horaria}
                onChange={e => set('carga_horaria', +e.target.value)} />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',
            gap:'var(--sp-3)', marginBottom:'var(--sp-3)' }}>
            <div>
              <label style={lbl}>Status</label>
              <select className="input-field" value={form.status}
                onChange={e => set('status', e.target.value)}>
                {Object.entries(STATUS_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={lbl}>Progresso: {form.progresso}%</label>
              <input type="range" min="0" max="100" step="5"
                value={form.progresso}
                onChange={e => set('progresso', +e.target.value)}
                style={{ width:'100%', accentColor: form.cor, marginTop:'var(--sp-1)' }} />
            </div>
          </div>

          <div style={{ marginBottom:'var(--sp-3)' }}>
            <label style={lbl}>Descrição</label>
            <textarea className="input-field" rows={2}
              placeholder="Objetivos, conteúdo do curso..."
              value={form.descricao} onChange={e => set('descricao', e.target.value)}
              style={{ resize:'vertical' }} />
          </div>

          {materias.length > 0 && (
            <div style={{ marginBottom:'var(--sp-5)' }}>
              <label style={lbl}>Matérias Relacionadas</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'var(--sp-2)' }}>
                {materias.map(m => {
                  const sel = form.materia_ids.includes(m.id);
                  return (
                    <div key={m.id} onClick={() => toggleMateria(m.id)} style={{
                      display:'flex', alignItems:'center', gap:'var(--sp-2)',
                      padding:'0.35rem 0.875rem', borderRadius:999, cursor:'pointer',
                      border: sel ? `2px solid ${m.cor}` : '2px solid var(--border)',
                      background: sel ? `${m.cor}20` : 'var(--bg-primary)',
                      fontSize:'0.75rem', fontWeight: sel ? 700 : 400,
                      color: sel ? m.cor : 'var(--text-secondary)',
                      transition:'all var(--transition)'
                    }}>
                      <span style={{ width:8, height:8, borderRadius:'50%',
                        background: m.cor, display:'inline-block' }} />
                      {m.nome}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="form-actions">
            <button type="button" onClick={onFechar} className="btn-secondary">
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={salvando}>
              {salvando
                ? <><span className="spinner" style={{width:14,height:14,borderWidth:2}}/> Salvando...</>
                : editando ? '💾 Atualizar' : '✅ Criar Curso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CardCurso({ curso, onEditar, onRemover }) {
  const st = STATUS_LABEL[curso.status] || STATUS_LABEL.em_andamento;
  return (
    <div className="card" style={{ padding:'var(--sp-5)', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0,
        height:4, background: curso.cor || '#6366f1' }} />

      <div style={{ display:'flex', justifyContent:'space-between',
        alignItems:'flex-start', marginBottom:'0.75rem', marginTop:'var(--sp-1)' }}>
        <div style={{ flex:1, minWidth:0 }}>
          <h3 style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text-primary)',
            marginBottom:'var(--sp-1)', overflow:'hidden', textOverflow:'ellipsis',
            whiteSpace:'nowrap' }}>{curso.nome}</h3>
          {curso.plataforma && (
            <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)' }}>
              🏫 {curso.plataforma}
            </span>
          )}
        </div>
        <span style={{
          background:`${st.cor}20`, color: st.cor, borderRadius:999,
          padding:'0.25rem 0.6rem', fontSize:'0.72rem', fontWeight:700,
          flexShrink:0, marginLeft:8
        }}>{st.label}</span>
      </div>

      <div style={{ marginBottom:'var(--sp-3)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'var(--sp-1)' }}>
          <span style={{ fontSize:'0.75rem', color:'var(--text-secondary)' }}>Progresso</span>
          <span style={{ fontSize:'0.75rem', fontWeight:700,
            color: curso.cor || '#6366f1' }}>{curso.progresso}%</span>
        </div>
        <div style={{ background:'var(--border)', borderRadius:999, height:6, overflow:'hidden' }}>
          <div style={{ height:'100%', borderRadius:999,
            background: curso.cor || '#6366f1',
            width:`${curso.progresso}%`, transition:'width 0.5s ease' }} />
        </div>
      </div>

      <div style={{ display:'flex', gap:'var(--sp-3)', marginBottom:'var(--sp-3)',
        fontSize:'0.75rem' }}>
        {curso.carga_horaria > 0 && (
          <span style={{ color:'var(--text-secondary)' }}>⏱️ {curso.carga_horaria}h</span>
        )}
        {(curso.materias || []).length > 0 && (
          <span style={{ display:'flex', alignItems:'center', gap:4,
            color:'var(--text-secondary)' }}>
            📚
            {(curso.materias || []).slice(0,4).map(m => (
              <span key={m.id} style={{ width:8, height:8, borderRadius:'50%',
                background: m.cor, display:'inline-block' }} title={m.nome} />
            ))}
            {(curso.materias || []).length > 4 && `+${(curso.materias||[]).length - 4}`}
          </span>
        )}
      </div>

      <div style={{ display:'flex', gap:'var(--sp-2)' }}>
        <button onClick={() => onEditar(curso)} className="btn-secondary"
          style={{ flex:1, justifyContent:'center' }}>
          ✏️ Editar
        </button>
        <button onClick={() => onRemover(curso.id)}
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
  );
}

export default function MeusCursos() {
  const [cursos,   setCursos]   = useState([]);
  const [materias, setMaterias] = useState([]);
  const [resumo,   setResumo]   = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);
  const [filtro,   setFiltro]   = useState('todos');
  const navigate = useNavigate();

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [c, m, r] = await Promise.all([
        api.get('/cursos'),
        api.get('/materias'),
        api.get('/cursos/resumo')
      ]);
      setCursos(c.data.cursos);
      setMaterias(m.data.materias);
      setResumo(r.data);
    } catch (err) {
      toast.error('Erro ao carregar cursos. Verifique o backend.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);

  function onSalvar(curso, editando) {
    setCursos(p => editando
      ? p.map(c => c.id === curso.id ? { ...c, ...curso, materias: c.materias } : c)
      : [{ ...curso, materias: [] }, ...p]
    );
    api.get('/cursos/resumo').then(({ data }) => setResumo(data)).catch(() => {});
    setModal(null);
    // Recarregar para pegar materias atualizadas
    carregar();
  }

  async function onRemover(id) {
    if (!window.confirm('Remover este curso?')) return;
    try {
      await api.delete(`/cursos/${id}`);
      setCursos(p => p.filter(c => c.id !== id));
      api.get('/cursos/resumo').then(({ data }) => setResumo(data)).catch(() => {});
      toast.success('Curso removido');
    } catch { toast.error('Erro ao remover curso'); }
  }

  const cursosFiltrados = filtro === 'todos'
    ? cursos
    : cursos.filter(c => c.status === filtro);

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:'3rem' }}>
      <span className="spinner" />
    </div>
  );

  return (
    <div className="page-wrapper">
      {modal && (
        <ModalCurso
          curso={modal === 'novo' ? null : modal}
          materias={materias}
          onSalvar={onSalvar}
          onFechar={() => setModal(null)} />
      )}

      <div className="page-header">
        <h2 className="page-title">
          🎓 Meus Cursos
          <span style={{ marginLeft:'var(--sp-2)', fontSize:'0.875rem', fontWeight:400,
            color:'var(--text-secondary)' }}>({cursos.length} cursos)</span>
        </h2>
        <div style={{ display:'flex', gap:'var(--sp-2)' }}>
          <button onClick={() => navigate('/relatorios')}
            style={{ background:'var(--bg-secondary)', border:'1px solid var(--border)',
              color:'var(--text-primary)', borderRadius:'var(--radius)',
              padding:'0.5rem 0.875rem', cursor:'pointer', fontSize:'0.875rem', fontWeight:600 }}>
            📊 Relatório
          </button>
          <button onClick={() => setModal('novo')} className="btn-primary">
            + Novo Curso
          </button>
        </div>
      </div>

      <BarraProgresso />

      {resumo && (
        <div style={{ display:'grid',
          gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',
          gap:'var(--sp-3)', marginBottom:'var(--sp-5)' }}>
          {[
            { icon:'📚', label:'Total',           valor: resumo.total,            cor:'#6366f1' },
            { icon:'▶️', label:'Em Andamento',    valor: resumo.em_andamento,     cor:'#f59e0b' },
            { icon:'✅', label:'Concluídos',      valor: resumo.concluidos,       cor:'#22c55e' },
            { icon:'⏱️', label:'Carga Total (h)', valor: resumo.carga_total,      cor:'#3b82f6' },
            { icon:'📈', label:'Progresso Médio', valor:`${resumo.progresso_medio || 0}%`, cor:'#8b5cf6' }
          ].map(c => (
            <div key={c.label} className="card"
            style={{ textAlign:'center', padding:'var(--sp-4)', display:'flex',
              flexDirection:'column', alignItems:'center', gap:'var(--sp-2)' }}>
              <span style={{ fontSize:'1.4rem', lineHeight:1 }}>{c.icon}</span>
              <span style={{ fontSize:'1.4rem', fontWeight:800, color:c.cor,
                letterSpacing:'-0.03em', lineHeight:1 }}>{c.valor}</span>
              <span style={{ fontSize:'0.7rem', color:'var(--text-secondary)',
                fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>
                {c.label}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="pill-group">
        {[['todos','Todos'], ...Object.entries(STATUS_LABEL).map(([k,v])=>[k,v.label])].map(([k,label]) => (
          <button key={k} onClick={() => setFiltro(k)}
            className={`pill${filtro===k ? ' ativo' : ''}`}>
            {label}</button>
        ))}
      </div>

      {cursosFiltrados.length === 0 ? (
        <div className="card">
          <div className="empty-state" style={{ padding:'3rem' }}>
            <span className="empty-icon">🎓</span>
            <p>{filtro === 'todos' ? 'Nenhum curso cadastrado ainda' : `Sem cursos com status "${STATUS_LABEL[filtro]?.label}"`}</p>
            <button onClick={() => setModal('novo')} className="btn-primary"
              style={{ marginTop:'var(--sp-4)' }}>+ Criar Primeiro Curso</button>
          </div>
        </div>
      ) : (
        <div style={{ display:'grid',
          gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'var(--sp-3)' }}>
          {cursosFiltrados.map(c => (
            <CardCurso key={c.id} curso={c} onEditar={setModal} onRemover={onRemover} />
          ))}
        </div>
      )}
    </div>
  );
}
