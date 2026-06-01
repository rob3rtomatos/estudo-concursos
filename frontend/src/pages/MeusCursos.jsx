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

  const lbl = { fontSize:'0.78rem', color:'var(--text-secondary)', display:'block', marginBottom:4 };

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)',
        zIndex:300, display:'flex', alignItems:'flex-start',
        justifyContent:'center', overflowY:'auto', padding:'2rem 1rem' }}
      onClick={e => e.target === e.currentTarget && onFechar()}
    >
      <div style={{ background:'var(--bg-secondary)', borderRadius:'1rem',
        border:'1px solid var(--border)', width:'100%', maxWidth:640,
        padding:'2rem', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>

        <div style={{ display:'flex', justifyContent:'space-between',
          alignItems:'center', marginBottom:'1.5rem' }}>
          <h3 style={{ fontWeight:700, fontSize:'1.1rem' }}>
            {editando ? '✏️ Editar Curso' : '➕ Novo Curso'}
          </h3>
          <button onClick={onFechar} style={{ background:'none', border:'none',
            cursor:'pointer', fontSize:'1.2rem', color:'var(--text-secondary)' }}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr auto',
            gap:'0.75rem', marginBottom:'0.875rem', alignItems:'end' }}>
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
                  borderRadius:'0.5rem', cursor:'pointer', padding:2 }} />
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr',
            gap:'0.75rem', marginBottom:'0.875rem' }}>
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

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr',
            gap:'0.75rem', marginBottom:'0.875rem' }}>
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
                style={{ width:'100%', accentColor: form.cor, marginTop:6 }} />
            </div>
          </div>

          <div style={{ marginBottom:'0.875rem' }}>
            <label style={lbl}>Descrição</label>
            <textarea className="input-field" rows={2}
              placeholder="Objetivos, conteúdo do curso..."
              value={form.descricao} onChange={e => set('descricao', e.target.value)}
              style={{ resize:'vertical' }} />
          </div>

          {materias.length > 0 && (
            <div style={{ marginBottom:'1.25rem' }}>
              <label style={lbl}>Matérias Relacionadas</label>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem' }}>
                {materias.map(m => {
                  const sel = form.materia_ids.includes(m.id);
                  return (
                    <div key={m.id} onClick={() => toggleMateria(m.id)} style={{
                      display:'flex', alignItems:'center', gap:'0.3rem',
                      padding:'0.3rem 0.7rem', borderRadius:999, cursor:'pointer',
                      border: sel ? `2px solid ${m.cor}` : '2px solid var(--border)',
                      background: sel ? `${m.cor}20` : 'var(--bg-primary)',
                      fontSize:'0.78rem', fontWeight: sel ? 700 : 400,
                      color: sel ? m.cor : 'var(--text-secondary)',
                      transition:'all 0.15s'
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

          <div style={{ display:'flex', gap:'0.75rem', justifyContent:'flex-end' }}>
            <button type="button" onClick={onFechar}
              style={{ background:'var(--border)', color:'var(--text-primary)',
                border:'none', borderRadius:'0.5rem', padding:'0.6rem 1.25rem',
                cursor:'pointer', fontWeight:600 }}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={salvando}>
              {salvando ? 'Salvando...' : editando ? '💾 Atualizar' : '✅ Criar Curso'}
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
    <div className="card" style={{ padding:'1.25rem', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0,
        height:4, background: curso.cor || '#6366f1' }} />

      <div style={{ display:'flex', justifyContent:'space-between',
        alignItems:'flex-start', marginBottom:'0.75rem', marginTop:6 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <h3 style={{ fontWeight:700, fontSize:'1rem', color:'var(--text-primary)',
            marginBottom:2, overflow:'hidden', textOverflow:'ellipsis',
            whiteSpace:'nowrap' }}>{curso.nome}</h3>
          {curso.plataforma && (
            <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)' }}>
              🏫 {curso.plataforma}
            </span>
          )}
        </div>
        <span style={{
          background:`${st.cor}20`, color: st.cor, borderRadius:999,
          padding:'0.2rem 0.7rem', fontSize:'0.72rem', fontWeight:700,
          flexShrink:0, marginLeft:8
        }}>{st.label}</span>
      </div>

      <div style={{ marginBottom:'0.875rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
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

      <div style={{ display:'flex', gap:'1rem', marginBottom:'0.875rem',
        fontSize:'0.78rem' }}>
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

      <div style={{ display:'flex', gap:'0.5rem' }}>
        <button onClick={() => onEditar(curso)}
          style={{ flex:1, background:'none', border:'1px solid var(--border)',
            color:'var(--text-secondary)', borderRadius:'0.5rem',
            padding:'0.45rem', cursor:'pointer', fontSize:'0.82rem', fontWeight:600 }}>
          ✏️ Editar
        </button>
        <button onClick={() => onRemover(curso.id)}
          style={{ background:'none', border:'1px solid var(--danger)',
            color:'var(--danger)', borderRadius:'0.5rem',
            padding:'0.45rem 0.7rem', cursor:'pointer', fontSize:'0.82rem' }}>
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
    <div style={{ display:'flex', justifyContent:'center', padding:'3rem' }}>
      <span style={{ color:'var(--text-secondary)' }}>Carregando cursos...</span>
    </div>
  );

  return (
    <div className="fade-in">
      {modal && (
        <ModalCurso
          curso={modal === 'novo' ? null : modal}
          materias={materias}
          onSalvar={onSalvar}
          onFechar={() => setModal(null)} />
      )}

      <div style={{ display:'flex', justifyContent:'space-between',
        alignItems:'center', marginBottom:'1rem' }}>
        <h2 style={{ fontSize:'1.4rem', fontWeight:700, color:'var(--text-primary)' }}>
          🎓 Meus Cursos
          <span style={{ marginLeft:8, fontSize:'0.85rem', fontWeight:400,
            color:'var(--text-secondary)' }}>({cursos.length} cursos)</span>
        </h2>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <button onClick={() => navigate('/relatorios')}
            style={{ background:'var(--bg-secondary)', border:'1px solid var(--border)',
              color:'var(--text-primary)', borderRadius:'0.5rem',
              padding:'0.5rem 0.875rem', cursor:'pointer', fontSize:'0.85rem', fontWeight:600 }}>
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
          gap:'1rem', marginBottom:'1.5rem' }}>
          {[
            { icon:'📚', label:'Total',           valor: resumo.total,            cor:'#6366f1' },
            { icon:'▶️', label:'Em Andamento',    valor: resumo.em_andamento,     cor:'#f59e0b' },
            { icon:'✅', label:'Concluídos',      valor: resumo.concluidos,       cor:'#22c55e' },
            { icon:'⏱️', label:'Carga Total (h)', valor: resumo.carga_total,      cor:'#3b82f6' },
            { icon:'📈', label:'Progresso Médio', valor:`${resumo.progresso_medio || 0}%`, cor:'#8b5cf6' }
          ].map(c => (
            <div key={c.label} className="card" style={{ textAlign:'center', padding:'1rem' }}>
              <div style={{ fontSize:'1.5rem', marginBottom:4 }}>{c.icon}</div>
              <div style={{ fontSize:'1.3rem', fontWeight:700, color:c.cor }}>{c.valor}</div>
              <div style={{ fontSize:'0.72rem', color:'var(--text-secondary)', marginTop:2 }}>
                {c.label}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display:'flex', gap:'0.5rem', marginBottom:'1.25rem', flexWrap:'wrap' }}>
        {[['todos','Todos'], ...Object.entries(STATUS_LABEL).map(([k,v])=>[k,v.label])].map(([k,label]) => (
          <button key={k} onClick={() => setFiltro(k)} style={{
            padding:'0.4rem 0.875rem', borderRadius:999, cursor:'pointer',
            fontSize:'0.82rem', fontWeight:600, border:'none',
            background: filtro===k ? 'var(--accent)' : 'var(--bg-secondary)',
            color: filtro===k ? 'white' : 'var(--text-secondary)',
            outline: filtro!==k ? '1px solid var(--border)' : 'none'
          }}>{label}</button>
        ))}
      </div>

      {cursosFiltrados.length === 0 ? (
        <div className="card" style={{ textAlign:'center', padding:'3rem' }}>
          <p style={{ fontSize:'3rem' }}>🎓</p>
          <p style={{ color:'var(--text-secondary)', marginTop:8 }}>
            {filtro === 'todos' ? 'Nenhum curso cadastrado ainda' : `Sem cursos com status "${STATUS_LABEL[filtro]?.label}"`}
          </p>
          <button onClick={() => setModal('novo')} className="btn-primary"
            style={{ marginTop:'1rem' }}>+ Criar Primeiro Curso</button>
        </div>
      ) : (
        <div style={{ display:'grid',
          gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:'1rem' }}>
          {cursosFiltrados.map(c => (
            <CardCurso key={c.id} curso={c} onEditar={setModal} onRemover={onRemover} />
          ))}
        </div>
      )}
    </div>
  );
}
