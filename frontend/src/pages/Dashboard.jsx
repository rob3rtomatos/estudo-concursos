import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api            from '../services/api';
import toast          from 'react-hot-toast';
import BarraProgresso from '../components/BarraProgresso';

const COR_DIFIC = { facil:'#22c55e', media:'#f59e0b', dificil:'#ef4444' };
const TOOLTIP   = { background:'var(--bg-secondary)', border:'1px solid var(--border)', color:'var(--text-primary)', borderRadius:'var(--radius)', fontSize:'0.8rem' };

export default function Dashboard() {
  const [dados,   setDados]   = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/dashboard/resumo')
      .then(({ data }) => setDados(data))
      .catch(() => toast.error('Erro ao carregar dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:'3rem' }}>
      <span className="spinner" />
    </div>
  );

  const { porDia, porMateria, metaSemanal, totalHoje, totalQuestoes, totalSimulados, ultimasQuestoes, ultimosSimulados } = dados || {};

  const pct = metaSemanal?.horas_planejadas > 0
    ? Math.min(100, Math.round((metaSemanal.horas_estudadas / metaSemanal.horas_planejadas) * 100))
    : 0;

  const dadosDia = (porDia || []).map(d => ({
    ...d,
    data: new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday:'short', day:'numeric' }),
    total_horas: parseFloat(d.total_horas)
  }));

  const METRICAS = [
    { icon:'⏱️', label:'Horas Hoje',   valor:`${totalHoje}h`,                          cor:'var(--accent)',   link:'/registro-diario' },
    { icon:'📅', label:'Horas Semana', valor:`${metaSemanal?.horas_estudadas || 0}h`,  cor:'#3b82f6',         link:'/registro-diario' },
    { icon:'🎯', label:'Meta Semanal', valor:`${metaSemanal?.horas_planejadas || 0}h`, cor:'var(--warning)',   link:'/ciclo' },
    { icon:'📈', label:'Concluído',    valor:`${pct}%`,
      cor: pct>=100?'var(--success)':pct>=60?'var(--warning)':'var(--accent)',         link:'/ciclo' },
    { icon:'📝', label:'Questões',     valor: totalQuestoes ?? 0,                      cor:'#8b5cf6',         link:'/questoes' },
    { icon:'📋', label:'Simulados',    valor: totalSimulados ?? 0,                     cor:'var(--info)',      link:'/simulados' },
  ];

  return (
    <div className="page-wrapper">

      <div className="page-header">
        <h2 className="page-title">📊 Dashboard</h2>
      </div>

      <BarraProgresso />

      {/* ── Cards de métricas ── */}
      <div className="grid-metrics">
        {METRICAS.map(c => (
          <div key={c.label} className="card card-interactive"
            onClick={() => navigate(c.link)}
            style={{ padding:'var(--sp-4)', textAlign:'center', display:'flex', flexDirection:'column', alignItems:'center', gap:'var(--sp-2)' }}>
            <span style={{ fontSize:'1.5rem', lineHeight:1 }}>{c.icon}</span>
            <span style={{ fontSize:'1.5rem', fontWeight:800, color:c.cor, letterSpacing:'-0.03em', lineHeight:1 }}>{c.valor}</span>
            <span style={{ fontSize:'0.72rem', color:'var(--text-secondary)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em' }}>{c.label}</span>
          </div>
        ))}
      </div>

      {/* ── Meta semanal ── */}
      <div className="card content-card" style={{ gap:'var(--sp-3)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text-primary)' }}>🎯 Meta Semanal</span>
          <span style={{ fontSize:'0.875rem', color:'var(--text-secondary)', fontWeight:600 }}>
            {metaSemanal?.horas_estudadas}h / {metaSemanal?.horas_planejadas}h
          </span>
        </div>
        <div className="progress-track" style={{ height:8 }}>
          <div className="progress-fill" style={{
            width:`${pct}%`,
            background: pct>=100?'var(--success)':'var(--accent)',
          }} />
        </div>
        <div style={{ display:'flex', justifyContent:'flex-end' }}>
          <span style={{
            fontSize:'0.72rem', fontWeight:700, padding:'2px var(--sp-2)',
            borderRadius:99, background: pct>=100?'var(--success-soft)':'var(--accent-soft)',
            color: pct>=100?'var(--success)':'var(--accent)',
          }}>{pct}% concluído</span>
        </div>
      </div>

      {/* ── Gráficos + Recentes ── */}
      <div className="grid-2col">

        <div className="card content-card">
          <h3 style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text-primary)' }}>📈 Evolução Diária (7 dias)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dadosDia}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="data" stroke="var(--text-secondary)" tick={{ fontSize:11 }} />
              <YAxis stroke="var(--text-secondary)" tick={{ fontSize:11 }} />
              <Tooltip contentStyle={TOOLTIP} />
              <Line type="monotone" dataKey="total_horas" stroke="var(--accent)"
                strokeWidth={2} dot={{ fill:'var(--accent)', r:4 }} name="Horas" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card content-card">
          <h3 style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text-primary)' }}>🥧 Horas por Matéria (30 dias)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={porMateria || []} dataKey="total_horas" nameKey="materia"
                cx="50%" cy="50%" outerRadius={75}
                label={({ materia, percent }) => `${materia.substring(0,8)} ${(percent*100).toFixed(0)}%`}>
                {(porMateria || []).map((e, i) => (
                  <Cell key={i} fill={e.cor || `hsl(${i*60},70%,55%)`} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Últimas questões */}
        <div className="card content-card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text-primary)' }}>📝 Últimas Questões</h3>
            <button onClick={() => navigate('/questoes')}
              style={{ background:'none', border:'none', color:'var(--accent)', cursor:'pointer', fontSize:'0.8rem', fontWeight:700 }}>
              Ver todas →
            </button>
          </div>
          {(ultimasQuestoes || []).length === 0 ? (
            <div className="empty-state"><span className="empty-icon">📝</span><p>Nenhuma questão ainda</p></div>
          ) : (ultimasQuestoes || []).map(q => (
            <div key={q.id} style={{
              padding:'var(--sp-2) var(--sp-3)', borderBottom:'1px solid var(--border)',
              display:'flex', gap:'var(--sp-3)', alignItems:'flex-start'
            }}>
              <span style={{ width:8, height:8, borderRadius:'50%', flexShrink:0,
                background:COR_DIFIC[q.dificuldade], marginTop:6 }} />
              <div style={{ minWidth:0 }}>
                {q.materia_nome && (
                  <span style={{ fontSize:'0.68rem', color:q.materia_cor, fontWeight:700 }}>{q.materia_nome} · </span>
                )}
                <span style={{ fontSize:'0.68rem', color:'var(--text-secondary)' }}>{q.banca}</span>
                <p style={{ fontSize:'0.875rem', color:'var(--text-primary)', marginTop:'var(--sp-1)',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {q.enunciado_curto}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Últimos simulados */}
        <div className="card content-card">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <h3 style={{ fontWeight:700, fontSize:'0.875rem', color:'var(--text-primary)' }}>📋 Últimos Simulados</h3>
            <button onClick={() => navigate('/simulados')}
              style={{ background:'none', border:'none', color:'var(--accent)', cursor:'pointer', fontSize:'0.8rem', fontWeight:700 }}>
              Ver todos →
            </button>
          </div>
          {(ultimosSimulados || []).length === 0 ? (
            <div className="empty-state"><span className="empty-icon">📋</span><p>Nenhum simulado ainda</p></div>
          ) : (ultimosSimulados || []).map(s => (
            <div key={s.id} style={{
              padding:'var(--sp-2) var(--sp-3)', borderBottom:'1px solid var(--border)',
              display:'flex', justifyContent:'space-between', alignItems:'center', gap:'var(--sp-3)'
            }}>
              <div style={{ minWidth:0 }}>
                <p style={{ fontSize:'0.875rem', fontWeight:600, color:'var(--text-primary)',
                  overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.titulo}</p>
                <p style={{ fontSize:'0.72rem', color:'var(--text-secondary)', marginTop:'var(--sp-1)' }}>
                  {s.total_questoes} questões · {s.tempo_min}min
                </p>
              </div>
              <button onClick={() => navigate('/simulados')}
                style={{ background:'var(--accent)', color:'#fff', border:'none',
                  borderRadius:'var(--radius-sm)', padding:'var(--sp-1) var(--sp-3)',
                  cursor:'pointer', fontSize:'0.75rem', fontWeight:700, flexShrink:0 }}>
                ▶️
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
