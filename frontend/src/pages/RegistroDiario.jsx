import { useEffect, useState } from 'react';
import api            from '../services/api';
import toast          from 'react-hot-toast';
import BarraProgresso from '../components/BarraProgresso';

export default function RegistroDiario() {
  const [materias,      setMaterias]      = useState([]);
  const [registrosHoje, setRegistrosHoje] = useState([]);
  const [form, setForm] = useState({
    materia_id: '',
    data_estudo: new Date().toISOString().slice(0, 10),
    horas_estudadas: 1,
    observacoes: ''
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
    <div className="fade-in">
      <h2 style={{ fontSize:'1.4rem', fontWeight:700, marginBottom:'1rem',
        color:'var(--text-primary)' }}>
        ✏️ Registro Diário
      </h2>

      <BarraProgresso />

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
        {/* Formulário */}
        <div className="card">
          <h3 style={{ fontWeight:700, marginBottom:'1rem', fontSize:'1rem' }}>
            Registrar Horas Estudadas
          </h3>
          {materias.length === 0 ? (
            <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem' }}>
              Crie matérias em <strong>Ciclo Semanal</strong> primeiro.
            </p>
          ) : (
            <form onSubmit={handleSubmit}
              style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
              <div>
                <label style={{ fontSize:'0.8rem', color:'var(--text-secondary)',
                  display:'block', marginBottom:4 }}>Data</label>
                <input type="date" className="input-field"
                  value={form.data_estudo}
                  onChange={e => setForm(p => ({ ...p, data_estudo: e.target.value }))} required />
              </div>
              <div>
                <label style={{ fontSize:'0.8rem', color:'var(--text-secondary)',
                  display:'block', marginBottom:4 }}>Matéria</label>
                <select className="input-field" value={form.materia_id}
                  onChange={e => setForm(p => ({ ...p, materia_id: +e.target.value }))}>
                  {materias.map(m => (
                    <option key={m.id} value={m.id}>{m.nome}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ fontSize:'0.8rem', color:'var(--text-secondary)',
                  display:'block', marginBottom:4 }}>Horas Estudadas</label>
                <input type="number" className="input-field"
                  min="0.5" max="24" step="0.5"
                  value={form.horas_estudadas}
                  onChange={e => setForm(p => ({ ...p, horas_estudadas: +e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize:'0.8rem', color:'var(--text-secondary)',
                  display:'block', marginBottom:4 }}>Observações (opcional)</label>
                <textarea className="input-field" rows={3}
                  placeholder="Ex: Revisei capítulos 1-3, fiz exercícios..."
                  value={form.observacoes}
                  onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))}
                  style={{ resize:'none' }} />
              </div>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Salvando...' : '💾 Salvar Registro'}
              </button>
            </form>
          )}
        </div>

        {/* Registros de hoje */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between',
            alignItems:'center', marginBottom:'1rem' }}>
            <h3 style={{ fontWeight:700, fontSize:'1rem' }}>📋 Hoje</h3>
            <span style={{ background:'var(--accent)', color:'white',
              borderRadius:999, padding:'0.2rem 0.75rem',
              fontSize:'0.8rem', fontWeight:700 }}>
              {totalHoje.toFixed(1)}h
            </span>
          </div>

          {registrosHoje.length === 0 ? (
            <div style={{ textAlign:'center', padding:'2rem',
              color:'var(--text-secondary)' }}>
              <p style={{ fontSize:'2.5rem' }}>📝</p>
              <p style={{ marginTop:8 }}>Nenhum registro ainda hoje</p>
            </div>
          ) : registrosHoje.map(r => (
            <div key={r.id} style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'0.65rem 0', borderBottom:'1px solid var(--border)'
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:12, height:12, borderRadius:'50%',
                  background: r.cor, flexShrink:0 }} />
                <div>
                  <div style={{ fontSize:'0.875rem', fontWeight:500 }}>{r.materia_nome}</div>
                  {r.observacoes && (
                    <div style={{ fontSize:'0.72rem', color:'var(--text-secondary)' }}>
                      {r.observacoes.substring(0, 45)}{r.observacoes.length > 45 ? '...' : ''}
                    </div>
                  )}
                </div>
              </div>
              <span style={{ fontWeight:700, color:'var(--accent)', fontSize:'1rem' }}>
                {parseFloat(r.horas_estudadas).toFixed(1)}h
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
