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
  const [editando,  setEditando]  = useState(false);
  const [nome,      setNome]      = useState(materia.nome);
  const [cor,       setCor]       = useState(materia.cor);
  const [salvando,  setSalvando]  = useState(false);

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
      display: 'flex', alignItems: 'center', gap: '0.75rem',
      padding: '0.6rem 0.75rem',
      background: 'var(--bg-primary)',
      borderRadius: '0.5rem',
      border: '1px solid var(--border)',
      marginBottom: '0.5rem'
    }}>
      {/* Bolinha colorida */}
      <input type="color" value={editando ? cor : materia.cor}
        disabled={!editando}
        onChange={e => setCor(e.target.value)}
        style={{ width: 28, height: 28, borderRadius: '50%', border: 'none',
          cursor: editando ? 'pointer' : 'default', padding: 0, background: 'none' }} />

      {/* Nome editável */}
      {editando ? (
        <input className="input-field" value={nome}
          onChange={e => setNome(e.target.value)}
          style={{ flex: 1, padding: '0.3rem 0.6rem', fontSize: '0.85rem' }}
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') salvar(); if (e.key === 'Escape') setEditando(false); }}
        />
      ) : (
        <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 500 }}>{materia.nome}</span>
      )}

      {/* Botões de ação */}
      {editando ? (
        <>
          <button onClick={salvar} disabled={salvando}
            style={{ background: 'var(--success)', color: 'white', border: 'none',
              borderRadius: '0.375rem', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>
            {salvando ? '...' : '✓'}
          </button>
          <button onClick={() => { setEditando(false); setNome(materia.nome); setCor(materia.cor); }}
            style={{ background: 'var(--border)', color: 'var(--text-primary)', border: 'none',
              borderRadius: '0.375rem', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>
            ✕
          </button>
        </>
      ) : (
        <>
          <button onClick={() => setEditando(true)}
            style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-secondary)',
              borderRadius: '0.375rem', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>
            ✏️
          </button>
          <button onClick={confirmarRemocao}
            style={{ background: 'none', border: '1px solid var(--danger)', color: 'var(--danger)',
              borderRadius: '0.375rem', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.8rem' }}>
            🗑️
          </button>
        </>
      )}
    </div>
  );
}

/* ── Página principal ── */
export default function CicloEstudos() {
  const [ciclo,    setCiclo]    = useState({});
  const [materias, setMaterias] = useState([]);
  const [loading,  setLoading]  = useState(true);

  // Formulário novo ciclo
  const [formCiclo, setFormCiclo] = useState({
    dia_semana: 1, materia_id: '', horas_planejadas: 1
  });
  // Formulário nova matéria
  const [novaMateria, setNovaMateria] = useState({ nome: '', cor: '#6366f1' });
  const [criandoMat,  setCriandoMat]  = useState(false);

  /* Carregar ciclo e matérias */
  async function carregar() {
    try {
      const [c, m] = await Promise.all([
        api.get('/ciclos'),
        api.get('/materias')
      ]);
      setCiclo(c.data.ciclo);
      setMaterias(m.data.materias);
      if (m.data.materias.length > 0 && !formCiclo.materia_id) {
        setFormCiclo(p => ({ ...p, materia_id: m.data.materias[0].id }));
      }
    } catch {
      toast.error('Erro ao carregar dados');
    } finally { setLoading(false); }
  }

  useEffect(() => { carregar(); }, []);

  /* Criar matéria */
  async function criarMateria(e) {
    e.preventDefault();
    if (!novaMateria.nome.trim()) return toast.error('Informe o nome da matéria');
    setCriandoMat(true);
    try {
      const { data } = await api.post('/materias', novaMateria);
      const novas = [...materias, data.materia].sort((a, b) => a.nome.localeCompare(b.nome));
      setMaterias(novas);
      setFormCiclo(p => ({ ...p, materia_id: data.materia.id }));
      setNovaMateria({ nome: '', cor: '#6366f1' });
      toast.success(`Matéria "${data.materia.nome}" criada!`);
    } catch {
    } finally { setCriandoMat(false); }
  }

  /* Callbacks de atualização e remoção de matéria */
  function onAtualizarMateria(mat) {
    setMaterias(p => p.map(m => m.id === mat.id ? mat : m));
    // Re-carregar ciclo pois o nome pode ter mudado
    api.get('/ciclos').then(({ data }) => setCiclo(data.ciclo)).catch(() => {});
  }
  function onRemoverMateria(id) {
    setMaterias(p => p.filter(m => m.id !== id));
    // Recarregar ciclo pois entradas foram removidas em cascata
    api.get('/ciclos').then(({ data }) => setCiclo(data.ciclo)).catch(() => {});
  }

  /* Adicionar entrada ao ciclo */
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

  /* Remover entrada do ciclo */
  async function removerDoCiclo(id) {
    try {
      await api.delete(`/ciclos/${id}`);
      const { data } = await api.get('/ciclos');
      setCiclo(data.ciclo);
      toast.success('Removido do ciclo');
    } catch {}
  }

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <span style={{ color: 'var(--text-secondary)' }}>Carregando...</span>
    </div>
  );

  return (
    <div className="fade-in">
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.5rem',
        color: 'var(--text-primary)' }}>
        📅 Ciclo de Estudos
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>

        {/* ── Painel de Matérias ── */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem',
            color: 'var(--text-primary)' }}>
            📚 Minhas Matérias
          </h3>

          {/* Formulário nova matéria */}
          <form onSubmit={criarMateria} style={{
            display: 'flex', gap: '0.5rem', marginBottom: '1rem', alignItems: 'center'
          }}>
            <input type="color" value={novaMateria.cor}
              onChange={e => setNovaMateria(p => ({ ...p, cor: e.target.value }))}
              style={{ width: 36, height: 36, border: '1px solid var(--border)',
                borderRadius: '0.375rem', cursor: 'pointer', padding: 2, background: 'none' }} />
            <input type="text" className="input-field"
              placeholder="Nome da matéria (ex: Redes)"
              value={novaMateria.nome}
              onChange={e => setNovaMateria(p => ({ ...p, nome: e.target.value }))}
              style={{ flex: 1 }} />
            <button type="submit" className="btn-primary"
              disabled={criandoMat} style={{ whiteSpace: 'nowrap', padding: '0.5rem 0.875rem' }}>
              {criandoMat ? '...' : '+ Add'}
            </button>
          </form>

          {/* Lista de matérias com edição/exclusão */}
          <div style={{ maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
            {materias.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem',
                textAlign: 'center', padding: '1rem' }}>
                Nenhuma matéria cadastrada ainda
              </p>
            ) : materias.map(m => (
              <CardMateria key={m.id} materia={m}
                onAtualizar={onAtualizarMateria}
                onRemover={onRemoverMateria} />
            ))}
          </div>
        </div>

        {/* ── Formulário: Adicionar ao ciclo ── */}
        <div className="card">
          <h3 style={{ fontWeight: 700, marginBottom: '1rem', fontSize: '1rem',
            color: 'var(--text-primary)' }}>
            ➕ Adicionar ao Ciclo
          </h3>

          {materias.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center',
              color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              ⬅️ Crie uma matéria primeiro
            </div>
          ) : (
            <form onSubmit={adicionarCiclo}
              style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)',
                  display: 'block', marginBottom: 4 }}>Dia da Semana</label>
                <select className="input-field" value={formCiclo.dia_semana}
                  onChange={e => setFormCiclo(p => ({ ...p, dia_semana: +e.target.value }))}>
                  {DIAS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)',
                  display: 'block', marginBottom: 4 }}>Matéria</label>
                <select className="input-field" value={formCiclo.materia_id}
                  onChange={e => setFormCiclo(p => ({ ...p, materia_id: +e.target.value }))}>
                  {materias.map(m => (
                    <option key={m.id} value={m.id}>{m.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)',
                  display: 'block', marginBottom: 4 }}>Horas Planejadas</label>
                <input type="number" className="input-field"
                  min="0.5" max="12" step="0.5"
                  value={formCiclo.horas_planejadas}
                  onChange={e => setFormCiclo(p => ({ ...p, horas_planejadas: +e.target.value }))} />
              </div>
              <button type="submit" className="btn-primary">
                📌 Adicionar ao Ciclo
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ── Grade semanal ── */}
      <div className="card">
        <h3 style={{ fontWeight: 700, marginBottom: '1.25rem', fontSize: '1rem',
          color: 'var(--text-primary)' }}>
          🗓️ Grade Semanal
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '0.625rem'
        }}>
          {DIAS.map((dia, idx) => {
            const entradas = ciclo[idx] || [];
            const totalH   = entradas.reduce((s, e) => s + e.horasPlanejadas, 0);
            return (
              <div key={idx} style={{
                background: 'var(--bg-primary)',
                borderRadius: '0.625rem',
                border: '1px solid var(--border)',
                padding: '0.75rem',
                minHeight: 100
              }}>
                {/* Cabeçalho do dia */}
                <div style={{ display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.75rem',
                    color: 'var(--accent)' }}>{dia.substring(0,3)}</span>
                  {totalH > 0 && (
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)',
                      background: 'rgba(99,102,241,0.1)', borderRadius: 999,
                      padding: '0.1rem 0.4rem' }}>
                      {totalH}h
                    </span>
                  )}
                </div>

                {/* Entradas do dia */}
                {entradas.length === 0 ? (
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)',
                    fontStyle: 'italic' }}>—</span>
                ) : entradas.map(e => (
                  <div key={e.id} style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.2rem 0',
                    borderBottom: '1px solid var(--border)',
                    gap: 4
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: e.cor, flexShrink: 0
                      }} />
                      <span style={{
                        fontSize: '0.7rem', whiteSpace: 'nowrap',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        maxWidth: 70, color: 'var(--text-primary)'
                      }} title={e.materiaNome}>
                        {e.materiaNome}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
                        {e.horasPlanejadas}h
                      </span>
                      <button onClick={() => removerDoCiclo(e.id)}
                        title="Remover"
                        style={{ background: 'none', border: 'none',
                          color: 'var(--danger)', cursor: 'pointer',
                          fontSize: '0.7rem', padding: '0 2px', lineHeight: 1 }}>
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
