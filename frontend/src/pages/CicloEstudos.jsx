/**
 * CicloEstudos.jsx
 * - Gerenciar matérias (criar, editar inline, excluir)
 * - Montar ciclo semanal por dia
 * - Tudo persistido no backend/banco, isolado por usuário
 */

import { useEffect, useState } from 'react';
import api   from '../services/api';
import toast from 'react-hot-toast';

const DIAS = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];

/* ── Componente de card de matéria com edição inline ── */
function CardMateria({ materia, onAtualizar, onRemover }) {
  const [editando, setEditando] = useState(false);
  const [nome,     setNome]     = useState(materia.nome);
  const [cor,      setCor]      = useState(materia.cor);
  const [salvando, setSalvando] = useState(false);

  async function salvar() {
    if (!nome.trim()) return toast.error('Nome não pode ser vazio');
    setSalvando(true);
    try {
      const { data } = await api.put(`/materias/${materia.id}`, { nome, cor });
      onAtualizar(data.materia);
      setEditando(false);
      toast.success('Matéria atualizada!');
    } catch {
    } finally { setSalvando(false); }
  }

  async function confirmarRemocao() {
    if (!window.confirm(`Remover "${materia.nome}"? Isso também remove do ciclo e registros.`)) return;
    try {
      await api.delete(`/materias/${materia.id}`);
      onRemover(materia.id);
      toast.success('Matéria removida');
    } catch {}
  }

  return (
    <div style={{
      display:'flex', alignItems:'center', gap:'var(--sp-3)',
      padding:'var(--sp-2) var(--sp-3)',
      background:'var(--bg-elevated)',
      borderRadius:'var(--radius)',
      border:'1px solid var(--border)',
      marginBottom:'var(--sp-2)',
      transition:'border-color var(--transition)',
    }}>
      {/* Cor da matéria */}
      <input
        type="color"
        value={editando ? cor : materia.cor}
        disabled={!editando}
        onChange={e => setCor(e.target.value)}
        style={{
          width:28, height:28, borderRadius:'50%',
          border:'2px solid var(--border)',
          cursor: editando ? 'pointer' : 'default',
          padding:0, background:'none', flexShrink:0,
        }}
      />

      {/* Nome editável */}
      {editando ? (
        <input
          className="input-field"
          value={nome}
          onChange={e => setNome(e.target.value)}
          style={{ flex:1, padding:'var(--sp-1) var(--sp-2)', fontSize:'0.875rem', height:34 }}
          autoFocus
          onKeyDown={e => { if (e.key==='Enter') salvar(); if (e.key==='Escape') setEditando(false); }}
        />
      ) : (
        <span style={{
          flex:1, fontSize:'0.875rem', fontWeight:500,
          color:'var(--text-primary)', overflow:'hidden',
          textOverflow:'ellipsis', whiteSpace:'nowrap',
        }}>
          {materia.nome}
        </span>
      )}

      {/* Botões de ação */}
      <div style={{ display:'flex', gap:'var(--sp-1)', flexShrink:0 }}>
        {editando ? (
          <>
            <button onClick={salvar} disabled={salvando}
              title="Salvar"
              style={{
                background:'var(--success)', color:'#fff', border:'none',
                borderRadius:'var(--radius-sm)', width:30, height:30,
                cursor:'pointer', fontSize:'0.8rem', fontWeight:700,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
              {salvando ? '…' : '✓'}
            </button>
            <button
              onClick={() => { setEditando(false); setNome(materia.nome); setCor(materia.cor); }}
              title="Cancelar"
              style={{
                background:'var(--bg-primary)', color:'var(--text-secondary)',
                border:'1px solid var(--border)', borderRadius:'var(--radius-sm)',
                width:30, height:30, cursor:'pointer', fontSize:'0.8rem',
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>
              ✕
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setEditando(true)}
              title="Editar"
              style={{
                background:'none', color:'var(--text-secondary)',
                border:'1px solid var(--border)', borderRadius:'var(--radius-sm)',
                width:30, height:30, cursor:'pointer', fontSize:'0.8rem',
                display:'flex', alignItems:'center', justifyContent:'center',
                transition:'all var(--transition)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-secondary)'; }}>
              ✏️
            </button>
            <button onClick={confirmarRemocao}
              title="Remover"
              style={{
                background:'none', color:'var(--danger)',
                border:'1px solid var(--border)', borderRadius:'var(--radius-sm)',
                width:30, height:30, cursor:'pointer', fontSize:'0.8rem',
                display:'flex', alignItems:'center', justifyContent:'center',
                transition:'all var(--transition)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background='var(--danger-soft)'; e.currentTarget.style.borderColor='var(--danger)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.borderColor='var(--border)'; }}>
              🗑️
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Página principal ── */
export default function CicloEstudos() {
  const [ciclo,    setCiclo]    = useState({});
  const [materias, setMaterias] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const [formCiclo, setFormCiclo] = useState({ dia_semana:1, materia_id:'', horas_planejadas:1 });
  const [novaMateria, setNovaMateria] = useState({ nome:'', cor:'#6366f1' });
  const [criandoMat,  setCriandoMat]  = useState(false);

  async function carregar() {
    try {
      const [c, m] = await Promise.all([api.get('/ciclos'), api.get('/materias')]);
      setCiclo(c.data.ciclo);
      setMaterias(m.data.materias);
      if (m.data.materias.length > 0 && !formCiclo.materia_id)
        setFormCiclo(p => ({ ...p, materia_id: m.data.materias[0].id }));
    } catch { toast.error('Erro ao carregar dados'); }
    finally  { setLoading(false); }
  }
  useEffect(() => { carregar(); }, []);

  async function criarMateria(e) {
    e.preventDefault();
    if (!novaMateria.nome.trim()) return toast.error('Informe o nome da matéria');
    setCriandoMat(true);
    try {
      const { data } = await api.post('/materias', novaMateria);
      const novas = [...materias, data.materia].sort((a,b) => a.nome.localeCompare(b.nome));
      setMaterias(novas);
      setFormCiclo(p => ({ ...p, materia_id: data.materia.id }));
      setNovaMateria({ nome:'', cor:'#6366f1' });
      toast.success(`Matéria "${data.materia.nome}" criada!`);
    } catch {} finally { setCriandoMat(false); }
  }

  function onAtualizarMateria(mat) {
    setMaterias(p => p.map(m => m.id === mat.id ? mat : m));
    api.get('/ciclos').then(({ data }) => setCiclo(data.ciclo)).catch(() => {});
  }
  function onRemoverMateria(id) {
    setMaterias(p => p.filter(m => m.id !== id));
    api.get('/ciclos').then(({ data }) => setCiclo(data.ciclo)).catch(() => {});
  }

  async function adicionarCiclo(e) {
    e.preventDefault();
    if (!formCiclo.materia_id) return toast.error('Selecione uma matéria');
    try {
      await api.post('/ciclos', formCiclo);
      const { data } = await api.get('/ciclos');
      setCiclo(data.ciclo);
      toast.success('Adicionado ao ciclo!');
    } catch {}
  }

  async function removerDoCiclo(id) {
    try {
      await api.delete(`/ciclos/${id}`);
      const { data } = await api.get('/ciclos');
      setCiclo(data.ciclo);
      toast.success('Removido do ciclo');
    } catch {}
  }

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:'3rem' }}>
      <span className="spinner" />
    </div>
  );

  return (
    <div className="page-wrapper">

      {/* ── Título ── */}
      <div className="page-header">
        <h2 className="page-title">📅 Ciclo de Estudos</h2>
      </div>

      {/* ── Painéis superiores ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:'var(--sp-5)', alignItems:'start' }}>

        {/* Painel: Minhas Matérias */}
        <div className="card content-card">
          <h3 style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text-primary)',
            display:'flex', alignItems:'center', gap:'var(--sp-2)' }}>
            📚 Minhas Matérias
          </h3>

          {/* Form nova matéria */}
          <form onSubmit={criarMateria}>
            <div style={{ display:'flex', gap:'var(--sp-2)', alignItems:'center' }}>
              <input
                type="color"
                value={novaMateria.cor}
                onChange={e => setNovaMateria(p => ({ ...p, cor:e.target.value }))}
                title="Escolher cor"
                style={{
                  width:38, height:38, flexShrink:0,
                  border:'1px solid var(--border)',
                  borderRadius:'var(--radius)',
                  cursor:'pointer', padding:2,
                  background:'var(--bg-elevated)',
                }}
              />
              <input
                type="text"
                className="input-field"
                placeholder="Nome da matéria (ex: Redes)"
                value={novaMateria.nome}
                onChange={e => setNovaMateria(p => ({ ...p, nome:e.target.value }))}
                style={{ flex:1 }}
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={criandoMat}
                style={{ flexShrink:0, padding:'0 var(--sp-4)', height:38 }}>
                {criandoMat ? '…' : '+ Add'}
              </button>
            </div>
          </form>

          {/* Divisor */}
          <div className="divider" style={{ margin:'var(--sp-1) 0' }} />

          {/* Lista de matérias */}
          <div style={{ maxHeight:300, overflowY:'auto', paddingRight:2 }}>
            {materias.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📂</span>
                <p>Nenhuma matéria cadastrada ainda</p>
              </div>
            ) : materias.map(m => (
              <CardMateria key={m.id} materia={m}
                onAtualizar={onAtualizarMateria}
                onRemover={onRemoverMateria} />
            ))}
          </div>
        </div>

        {/* Painel: Adicionar ao Ciclo */}
        <div className="card content-card">
          <h3 style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text-primary)',
            display:'flex', alignItems:'center', gap:'var(--sp-2)' }}>
            ➕ Adicionar ao Ciclo
          </h3>

          {materias.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">⬅️</span>
              <p>Crie uma matéria primeiro no painel ao lado</p>
            </div>
          ) : (
            <form onSubmit={adicionarCiclo} style={{ display:'flex', flexDirection:'column', gap:'var(--sp-4)' }}>

              <div className="form-group">
                <label className="form-label">Dia da Semana</label>
                <select
                  className="input-field"
                  value={formCiclo.dia_semana}
                  onChange={e => setFormCiclo(p => ({ ...p, dia_semana:+e.target.value }))}>
                  {DIAS.map((d,i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Matéria</label>
                <select
                  className="input-field"
                  value={formCiclo.materia_id}
                  onChange={e => setFormCiclo(p => ({ ...p, materia_id:+e.target.value }))}>
                  {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Horas Planejadas</label>
                <input
                  type="number"
                  className="input-field"
                  min="0.5" max="12" step="0.5"
                  value={formCiclo.horas_planejadas}
                  onChange={e => setFormCiclo(p => ({ ...p, horas_planejadas:+e.target.value }))}
                />
              </div>

              <button type="submit" className="btn-primary"
                style={{ width:'100%', justifyContent:'center', marginTop:'var(--sp-1)' }}>
                📌 Adicionar ao Ciclo
              </button>

            </form>
          )}
        </div>
      </div>

      {/* ── Grade Semanal ── */}
      <div className="card content-card">
        <h3 style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text-primary)',
          display:'flex', alignItems:'center', gap:'var(--sp-2)' }}>
          🗓️ Grade Semanal
        </h3>

        <div style={{
          display:'grid',
          gridTemplateColumns:'repeat(7,minmax(90px,1fr))',
          gap:'var(--sp-3)',
          overflowX:'auto',
        }}>
          {DIAS.map((dia, idx) => {
            const entradas = ciclo[idx] || [];
            const totalH   = entradas.reduce((s,e) => s + e.horasPlanejadas, 0);
            return (
              <div key={idx} style={{
                background:'var(--bg-elevated)',
                borderRadius:'var(--radius)',
                border:'1px solid var(--border)',
                padding:'var(--sp-3)',
                minHeight:110,
                display:'flex', flexDirection:'column', gap:'var(--sp-1)',
              }}>
                {/* Cabeçalho do dia */}
                <div style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  marginBottom:'var(--sp-2)',
                  paddingBottom:'var(--sp-2)',
                  borderBottom:'1px solid var(--border)',
                }}>
                  <span style={{ fontWeight:700, fontSize:'0.75rem', color:'var(--accent)', letterSpacing:'0.03em' }}>
                    {dia.substring(0,3).toUpperCase()}
                  </span>
                  {totalH > 0 && (
                    <span style={{
                      fontSize:'0.65rem', fontWeight:700,
                      color:'var(--accent)', background:'var(--accent-soft)',
                      borderRadius:99, padding:'1px var(--sp-2)',
                    }}>
                      {totalH}h
                    </span>
                  )}
                </div>

                {/* Entradas */}
                {entradas.length === 0 ? (
                  <span style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontStyle:'italic' }}>—</span>
                ) : entradas.map(e => (
                  <div key={e.id} style={{
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                    gap:'var(--sp-1)',
                    padding:'var(--sp-1) var(--sp-2)',
                    background:'var(--bg-secondary)',
                    borderRadius:'var(--radius-sm)',
                    border:'1px solid var(--border)',
                  }}>
                    {/* Cor + Nome */}
                    <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-1)', minWidth:0, flex:1 }}>
                      <span style={{
                        width:7, height:7, borderRadius:'50%',
                        background:e.cor, flexShrink:0,
                      }} />
                      <span style={{
                        fontSize:'0.68rem', fontWeight:500,
                        color:'var(--text-primary)',
                        whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis',
                      }} title={e.materiaNome}>
                        {e.materiaNome}
                      </span>
                    </div>
                    {/* Horas + Remover */}
                    <div style={{ display:'flex', alignItems:'center', gap:2, flexShrink:0 }}>
                      <span style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:600 }}>
                        {e.horasPlanejadas}h
                      </span>
                      <button
                        onClick={() => removerDoCiclo(e.id)}
                        title="Remover"
                        style={{
                          background:'none', border:'none',
                          color:'var(--text-muted)', cursor:'pointer',
                          fontSize:'0.65rem', padding:'0 2px', lineHeight:1,
                          transition:'color var(--transition)',
                        }}
                        onMouseEnter={e => e.currentTarget.style.color='var(--danger)'}
                        onMouseLeave={e => e.currentTarget.style.color='var(--text-muted)'}>
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
