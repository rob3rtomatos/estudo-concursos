import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import api            from '../services/api';
import toast          from 'react-hot-toast';
import BarraProgresso from '../components/BarraProgresso';

const COR_DIFIC = { facil:'#22c55e', media:'#f59e0b', dificil:'#ef4444' };
const TOOLTIP   = { background:'var(--bg-card)', border:'1px solid var(--border)', color:'var(--text-primary)' };

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
    <div style={{ display:'flex', justifyContent:'center', padding:'3rem' }}>
      <span style={{ color:'var(--text-secondary)' }}>Carregando...</span>
    </div>
  );

  const {
    porDia, porMateria, metaSemanal, totalHoje,
    totalQuestoes, totalSimulados,
    ultimasQuestoes, ultimosSimulados
  } = dados || {};

  const pct = metaSemanal?.horas_planejadas > 0
    ? Math.min(100, Math.round((metaSemanal.horas_estudadas / metaSemanal.horas_planejadas) * 100))
    : 0;

  const dadosDia = (porDia || []).map(d => ({
    ...d,
    data: new Date(d.data + 'T12:00:00').toLocaleDateString('pt-BR',
      { weekday:'short', day:'numeric' }),
    total_horas: parseFloat(d.total_horas)
  }));

  return (
    <div className="fade-in">
      <h2 style={{ fontSize:'1.4rem', fontWeight:700, marginBottom:'1rem',
        color:'var(--text-primary)' }}>📊 Dashboard</h2>

      <BarraProgresso />

      {/* Cards de resumo */}
      <div style={{ display:'grid',
        gridTemplateColumns:'repeat(auto-fit,minmax(160px,1fr))',
        gap:'1rem', marginBottom:'1.5rem' }}>
        {[
          { icon:'⏱️', label:'Horas Hoje',      valor:`${totalHoje}h`,                           cor:'#6366f1', link:'/registro-diario' },
          { icon:'📅', label:'Horas Semana',    valor:`${metaSemanal?.horas_estudadas || 0}h`,   cor:'#3b82f6', link:'/registro-diario' },
          { icon:'🎯', label:'Meta Semanal',    valor:`${metaSemanal?.horas_planejadas || 0}h`,  cor:'#f59e0b', link:'/ciclo' },
          { icon:'📈', label:'Concluído',       valor:`${pct}%`,
            cor: pct>=100?'#22c55e':pct>=60?'#f59e0b':'#6366f1', link:'/ciclo' },
          { icon:'📝', label:'Questões',        valor: totalQuestoes ?? 0,                       cor:'#8b5cf6', link:'/questoes' },
          { icon:'📋', label:'Simulados',       valor: totalSimulados ?? 0,                      cor:'#06b6d4', link:'/simulados' }
        ].map(c => (
          <div key={c.label} className="card"
            onClick={() => navigate(c.link)}
            style={{ textAlign:'center', padding:'1.25rem', cursor:'pointer',
              transition:'transform 0.15s, box-shadow 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)';
              e.currentTarget.style.boxShadow='0 8px 24px rgba(0,0,0,0.12)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='';
              e.currentTarget.style.boxShadow=''; }}>
            <div style={{ fontSize:'1.75rem', marginBottom:6 }}>{c.icon}</div>
            <div style={{ fontSize:'1.4rem', fontWeight:700, color:c.cor }}>{c.valor}</div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-secondary)', marginTop:4 }}>
              {c.label}
            </div>
          </div>
        ))}
      </div>

      {/* Barra meta semanal */}
      <div className="card" style={{ marginBottom:'1.5rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ fontWeight:600, fontSize:'0.9rem' }}>🎯 Meta Semanal</span>
          <span style={{ fontSize:'0.85rem', color:'var(--text-secondary)' }}>
            {metaSemanal?.horas_estudadas}h / {metaSemanal?.horas_planejadas}h
          </span>
        </div>
        <div style={{ background:'var(--border)', borderRadius:999, height:10, overflow:'hidden' }}>
          <div style={{ height:'100%', borderRadius:999,
            background: pct>=100?'#22c55e':'#6366f1',
            width:`${pct}%`, transition:'width 0.8s ease' }} />
        </div>
      </div>

      {/* Gráficos + recentes */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>

        <div className="card">
          <h3 style={{ marginBottom:'1rem', fontWeight:600, fontSize:'0.95rem' }}>
            📈 Evolução Diária (7 dias)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dadosDia}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="data" stroke="var(--text-secondary)" tick={{ fontSize:11 }} />
              <YAxis stroke="var(--text-secondary)" tick={{ fontSize:11 }} />
              <Tooltip contentStyle={TOOLTIP} />
              <Line type="monotone" dataKey="total_horas" stroke="#6366f1"
                strokeWidth={2} dot={{ fill:'#6366f1', r:4 }} name="Horas" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ marginBottom:'1rem', fontWeight:600, fontSize:'0.95rem' }}>
            🥧 Horas por Matéria (30 dias)
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={porMateria || []} dataKey="total_horas" nameKey="materia"
                cx="50%" cy="50%" outerRadius={75}
                label={({ materia, percent }) =>
                  `${materia.substring(0,8)} ${(percent*100).toFixed(0)}%`}>
                {(porMateria || []).map((e, i) => (
                  <Cell key={i} fill={e.cor || `hsl(${i*60},70%,55%)`} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Últimas questões */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between',
            alignItems:'center', marginBottom:'1rem' }}>
            <h3 style={{ fontWeight:600, fontSize:'0.95rem' }}>📝 Últimas Questões</h3>
            <button onClick={() => navigate('/questoes')}
              style={{ background:'none', border:'none', color:'var(--accent)',
                cursor:'pointer', fontSize:'0.8rem', fontWeight:600 }}>
              Ver todas →
            </button>
          </div>
          {(ultimasQuestoes || []).length === 0 ? (
            <p style={{ color:'var(--text-secondary)', fontSize:'0.85rem',
              textAlign:'center', padding:'1rem' }}>Nenhuma questão ainda</p>
          ) : (ultimasQuestoes || []).map(q => (
            <div key={q.id} style={{ padding:'0.5rem 0',
              borderBottom:'1px solid var(--border)',
              display:'flex', gap:'0.6rem', alignItems:'flex-start' }}>
              <span style={{ width:8, height:8, borderRadius:'50%', flexShrink:0,
                background: COR_DIFIC[q.dificuldade], marginTop:5 }} />
              <div style={{ minWidth:0 }}>
                {q.materia_nome && (
                  <span style={{ fontSize:'0.68rem', color: q.materia_cor,
                    fontWeight:600 }}>{q.materia_nome} · </span>
                )}
                <span style={{ fontSize:'0.68rem', color:'var(--text-secondary)' }}>
                  {q.banca}
                </span>
                <p style={{ fontSize:'0.8rem', color:'var(--text-primary)',
                  marginTop:2, overflow:'hidden', textOverflow:'ellipsis',
                  whiteSpace:'nowrap' }}>
                  {q.enunciado_curto}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Últimos simulados */}
        <div className="card">
          <div style={{ display:'flex', justifyContent:'space-between',
            alignItems:'center', marginBottom:'1rem' }}>
            <h3 style={{ fontWeight:600, fontSize:'0.95rem' }}>📋 Últimos Simulados</h3>
            <button onClick={() => navigate('/simulados')}
              style={{ background:'none', border:'none', color:'var(--accent)',
                cursor:'pointer', fontSize:'0.8rem', fontWeight:600 }}>
              Ver todos →
            </button>
          </div>
          {(ultimosSimulados || []).length === 0 ? (
            <p style={{ color:'var(--text-secondary)', fontSize:'0.85rem',
              textAlign:'center', padding:'1rem' }}>Nenhum simulado ainda</p>
          ) : (ultimosSimulados || []).map(s => (
            <div key={s.id} style={{ padding:'0.6rem 0',
              borderBottom:'1px solid var(--border)',
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <p style={{ fontSize:'0.875rem', fontWeight:600,
                  color:'var(--text-primary)' }}>{s.titulo}</p>
                <p style={{ fontSize:'0.72rem', color:'var(--text-secondary)' }}>
                  {s.total_questoes} questões · {s.tempo_min}min
                </p>
              </div>
              <button onClick={() => navigate('/simulados')}
                style={{ background:'var(--accent)', color:'white', border:'none',
                  borderRadius:'0.375rem', padding:'0.3rem 0.7rem',
                  cursor:'pointer', fontSize:'0.75rem', fontWeight:600 }}>
                ▶️
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
