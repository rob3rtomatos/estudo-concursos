import { useEffect, useState } from 'react';
import api            from '../services/api';
import toast          from 'react-hot-toast';
import BarraProgresso from '../components/BarraProgresso';

export default function RegistroDiario() {
  const [materias,      setMaterias]      = useState([]);
  const [registrosHoje, setRegistrosHoje] = useState([]);
  const [form, setForm] = useState({
    materia_id: '', data_estudo: new Date().toISOString().slice(0,10),
    horas_estudadas: 1, observacoes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([api.get('/materias'), api.get('/registros/hoje')])
      .then(([m, r]) => {
        setMaterias(m.data.materias);
        setRegistrosHoje(r.data.registros);
        if (m.data.materias.length > 0)
          setForm(p => ({ ...p, materia_id: m.data.materias[0].id }));
      })
      .catch(() => toast.error('Erro ao carregar dados'));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.materia_id) return toast.error('Selecione uma matéria');
    setLoading(true);
    try {
      await api.post('/registros', form);
      const { data } = await api.get('/registros/hoje');
      setRegistrosHoje(data.registros);
      toast.success('Horas registradas com sucesso!');
    } catch {
    } finally { setLoading(false); }
  }

  const totalHoje = registrosHoje.reduce((a, r) => a + parseFloat(r.horas_estudadas), 0);

  return (
    <div className="page-wrapper">

      <div className="page-header">
        <h2 className="page-title">✏️ Registro Diário</h2>
      </div>

      <BarraProgresso />

      <div className="grid-2col">

        {/* ── Formulário ── */}
        <div className="card content-card">
          <h3 style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text-primary)' }}>
            Registrar Horas Estudadas
          </h3>

          {materias.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📚</span>
              <p>Crie matérias em <strong>Ciclo Semanal</strong> primeiro.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:'var(--sp-4)' }}>

              <div className="form-group">
                <label className="form-label">Data</label>
                <input type="date" className="input-field"
                  value={form.data_estudo}
                  onChange={e => setForm(p => ({ ...p, data_estudo:e.target.value }))} required />
              </div>

              <div className="form-group">
                <label className="form-label">Matéria</label>
                <select className="input-field" value={form.materia_id}
                  onChange={e => setForm(p => ({ ...p, materia_id:+e.target.value }))}>
                  {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Horas Estudadas</label>
                <input type="number" className="input-field"
                  min="0.5" max="24" step="0.5"
                  value={form.horas_estudadas}
                  onChange={e => setForm(p => ({ ...p, horas_estudadas:+e.target.value }))} />
              </div>

              <div className="form-group">
                <label className="form-label">Observações <span style={{ fontWeight:400, color:'var(--text-muted)' }}>(opcional)</span></label>
                <textarea className="input-field" rows={3}
                  placeholder="Ex: Revisei capítulos 1-3, fiz exercícios..."
                  value={form.observacoes}
                  onChange={e => setForm(p => ({ ...p, observacoes:e.target.value }))}
                  style={{ resize:'none' }} />
              </div>

              <button type="submit" className="btn-primary" disabled={loading}
                style={{ width:'100%', justifyContent:'center' }}>
                {loading
                  ? <><span className="spinner" style={{ width:14, height:14, borderWidth:2 }} /> Salvando...</>
                  : '💾 Salvar Registro'}
              </button>
            </form>
          )}
        </div>

        {/* ── Registros de hoje ── */}
        <div className="card content-card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text-primary)' }}>📋 Registros de Hoje</h3>
            <span style={{
              background:'var(--accent)', color:'#fff',
              borderRadius:99, padding:'var(--sp-1) var(--sp-3)',
              fontSize:'0.8rem', fontWeight:800,
            }}>
              {totalHoje.toFixed(1)}h
            </span>
          </div>

          <div className="divider" style={{ margin:0 }} />

          {registrosHoje.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">📝</span>
              <p>Nenhum registro ainda hoje</p>
            </div>
          ) : registrosHoje.map(r => (
            <div key={r.id} style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'var(--sp-3)', background:'var(--bg-elevated)',
              borderRadius:'var(--radius)', border:'1px solid var(--border)',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:'var(--sp-3)', minWidth:0 }}>
                <span style={{ width:12, height:12, borderRadius:'50%', background:r.cor, flexShrink:0 }} />
                <div style={{ minWidth:0 }}>
                  <div style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--text-primary)',
                    overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {r.materia_nome}
                  </div>
                  {r.observacoes && (
                    <div style={{ fontSize:'0.72rem', color:'var(--text-secondary)', marginTop:'var(--sp-1)' }}>
                      {r.observacoes.substring(0,50)}{r.observacoes.length > 50 ? '…' : ''}
                    </div>
                  )}
                </div>
              </div>
              <span style={{ fontWeight:800, color:'var(--accent)', fontSize:'0.875rem', flexShrink:0, marginLeft:'var(--sp-3)' }}>
                {parseFloat(r.horas_estudadas).toFixed(1)}h
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
