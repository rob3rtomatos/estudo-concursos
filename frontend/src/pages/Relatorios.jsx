/**
 * Relatorios.jsx — Compatível com Vite (import estático do jsPDF)
 */
import { useState }  from 'react';
import { jsPDF }     from 'jspdf';
import autoTable     from 'jspdf-autotable';
import api           from '../services/api';
import toast         from 'react-hot-toast';
import BarraProgresso from '../components/BarraProgresso';

const DIAS  = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const S_LBL = { nao_iniciado:'Não Iniciado', em_andamento:'Em Andamento',
                concluido:'Concluído', pausado:'Pausado' };

const fmtD  = iso => !iso ? '—'
  : new Date(iso + (iso.length === 10 ? 'T12:00:00' : '')).toLocaleDateString('pt-BR');
const fmtSeg = s => { if (!s) return '0min'; const h=Math.floor(s/3600), m=Math.floor((s%3600)/60); return h>0?`${h}h ${m}min`:`${m}min`; };
const pctMeta = d => {
  const p = parseFloat(d?.metaSemanal?.planejado||0);
  const e = parseFloat(d?.metaSemanal?.estudado||0);
  return p > 0 ? Math.min(100, Math.round((e/p)*100)) : 0;
};

export default function Relatorios() {
  const [dados,   setDados]   = useState(null);
  const [loading, setLoading] = useState(false);

  /* ── Buscar dados do backend ── */
  async function buscarDados() {
    setLoading(true);
    try {
      const { data } = await api.get('/relatorios/gerar');
      setDados(data);
      toast.success('Dados carregados! Clique em "Baixar PDF" para exportar.');
    } catch {
      toast.error('Erro ao gerar relatório. Verifique o backend.');
    } finally { setLoading(false); }
  }

  /* ── Gerar PDF ── */
  function gerarPDF() {
    if (!dados) return;

    const doc = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
    const W   = doc.internal.pageSize.getWidth();
    const H   = doc.internal.pageSize.getHeight();
    const hoje = new Date().toLocaleDateString('pt-BR', {
      day:'2-digit', month:'long', year:'numeric'
    });

    const ACCENT = [99,102,241];
    const DARK   = [30,30,46];
    const GRAY   = [100,100,120];
    const LIGHT  = [240,240,250];

    let y = 24;

    /* Cabeçalho + rodapé aplicados depois em todas as páginas */
    function addCabecalhoRodape(n, total) {
      // Cabeçalho
      doc.setFillColor(...ACCENT);
      doc.rect(0, 0, W, 18, 'F');
      doc.setTextColor(255,255,255);
      doc.setFontSize(11); doc.setFont('helvetica','bold');
      doc.text('Estudo Diario Concursos', 14, 11);
      doc.setFontSize(8); doc.setFont('helvetica','normal');
      doc.text(`Relatorio de Desempenho — ${dados.usuario.nome}`, W-14, 11, { align:'right' });
      // Linha
      doc.setDrawColor(...ACCENT); doc.setLineWidth(0.4);
      doc.line(0,18,W,18);
      // Rodapé
      doc.setFillColor(245,245,250);
      doc.rect(0, H-13, W, 13, 'F');
      doc.setDrawColor(200,200,220); doc.setLineWidth(0.25);
      doc.line(0, H-13, W, H-13);
      doc.setFontSize(7.5); doc.setTextColor(...GRAY); doc.setFont('helvetica','normal');
      doc.text(`Gerado em: ${hoje}`,         14,    H-5);
      doc.text(dados.usuario.email,          W/2,   H-5, { align:'center' });
      doc.text(`Pagina ${n} de ${total}`,    W-14,  H-5, { align:'right' });
    }

    /* Título de seção */
    function secao(titulo) {
      if (y > H - 35) { doc.addPage(); y = 24; }
      doc.setFillColor(...LIGHT);
      doc.roundedRect(10, y, W-20, 9, 2, 2, 'F');
      doc.setFontSize(10); doc.setFont('helvetica','bold');
      doc.setTextColor(...DARK);
      doc.text(titulo, 15, y+6.2);
      y += 13;
    }

    /* Linha chave/valor */
    function linha(label, valor) {
      if (y > H-28) { doc.addPage(); y=24; }
      doc.setFontSize(9); doc.setFont('helvetica','bold');
      doc.setTextColor(...GRAY); doc.text(label+':', 14, y);
      doc.setFont('helvetica','normal'); doc.setTextColor(...DARK);
      doc.text(String(valor ?? '—'), 68, y);
      y += 6;
    }

    /* Tabela genérica */
    function tabela(head, body) {
      autoTable(doc, {
        startY: y, head: [head], body,
        styles: { fontSize:8.5, cellPadding:3, textColor:DARK,
          lineColor:[220,220,235], lineWidth:0.2 },
        headStyles: { fillColor:ACCENT, textColor:[255,255,255],
          fontStyle:'bold', fontSize:9 },
        alternateRowStyles: { fillColor:[248,248,252] },
        margin: { left:14, right:14 }, theme:'grid'
      });
      y = doc.lastAutoTable.finalY + 8;
    }

    /* ── Conteúdo ── */
    secao('Identificacao do Aluno');
    linha('Nome',         dados.usuario.nome);
    linha('E-mail',       dados.usuario.email);
    linha('Membro desde', fmtD(dados.usuario.criado_em));
    y += 2;

    secao('Resumo Geral de Estudos');
    linha('Total de horas',        `${dados.resumoEstudo.total_horas}h`);
    linha('Dias com registro',     dados.resumoEstudo.dias_estudados);
    linha('Materias estudadas',    dados.resumoEstudo.materias_estudadas);
    linha('Primeiro registro',     fmtD(dados.resumoEstudo.primeiro_registro));
    linha('Ultimo registro',       fmtD(dados.resumoEstudo.ultimo_registro));
    linha('Meta semanal (plan.)',  `${dados.metaSemanal.planejado}h`);
    linha('Meta semanal (real.)',  `${dados.metaSemanal.estudado}h`);
    linha('Cumprimento da meta',   `${pctMeta(dados)}%`);
    y += 2;

    secao('Cronometro de Estudos');
    linha('Total de sessoes',       dados.sessoesCronometro.total_sessoes);
    linha('Tempo total',            fmtSeg(dados.sessoesCronometro.total_segundos));
    linha('Duracao media/sessao',   `${dados.sessoesCronometro.media_min_sessao||0} min`);
    y += 2;

    if (dados.porMateria.length > 0) {
      secao('Horas Estudadas por Materia');
      tabela(
        ['Materia','Total de Horas','Dias Estudados'],
        dados.porMateria.map(m => [m.nome, `${m.total_horas}h`, m.dias])
      );
    }

    if (dados.porDia30.length > 0) {
      secao('Historico dos Ultimos 30 Dias');
      tabela(
        ['Data','Horas'],
        dados.porDia30.map(d => [fmtD(d.data), `${d.horas}h`])
      );
    }

    if (dados.ciclo.length > 0) {
      secao('Ciclo Semanal Configurado');
      tabela(
        ['Dia','Materia','Horas Planejadas'],
        dados.ciclo.map(c => [DIAS[c.dia_semana], c.materia_nome, `${c.horas_planejadas}h`])
      );
    }

    if (dados.cursos.length > 0) {
      secao('Meus Cursos');
      tabela(
        ['Curso','Plataforma','Carga (h)','Progresso','Status'],
        dados.cursos.map(c => [
          c.nome, c.plataforma||'—', c.carga_horaria,
          `${c.progresso}%`, S_LBL[c.status]||c.status
        ])
      );
    }

    secao('Banco de Questoes');
    linha('Total de questoes', dados.questoes.total);
    linha('Bancas diferentes', dados.questoes.bancas);
    linha('Faceis',            dados.questoes.faceis);
    linha('Medias',            dados.questoes.medias);
    linha('Dificeis',          dados.questoes.dificeis);
    y += 2;

    if (dados.simulados.length > 0) {
      secao('Simulados');
      tabela(
        ['Titulo','Questoes','Tempo (min)','Desempenho','Criado em'],
        dados.simulados.map(s => [
          s.titulo, s.total_questoes, s.tempo_min,
          s.percentual_medio != null ? `${s.percentual_medio}%` : 'N/A',
          fmtD(s.criado_em)
        ])
      );
    }

    /* Aplicar cabeçalho/rodapé em todas as páginas */
    const totalPag = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPag; i++) {
      doc.setPage(i); addCabecalhoRodape(i, totalPag);
    }

    const nome = `relatorio_${(dados.usuario.nome||'aluno').replace(/\s+/g,'-').toLowerCase()}_${new Date().toISOString().slice(0,10)}.pdf`;
    doc.save(nome);
    toast.success(`PDF "${nome}" baixado!`);
  }

  return (
    <div className="fade-in">
      <div style={{ display:'flex', justifyContent:'space-between',
        alignItems:'center', marginBottom:'1rem' }}>
        <h2 style={{ fontSize:'1.4rem', fontWeight:700, color:'var(--text-primary)' }}>
          📊 Relatórios
        </h2>
        <div style={{ display:'flex', gap:'0.75rem' }}>
          <button onClick={buscarDados} disabled={loading}
            style={{ background:'var(--bg-secondary)', border:'1px solid var(--border)',
              color:'var(--text-primary)', borderRadius:'0.5rem',
              padding:'0.5rem 1rem', cursor: loading ? 'not-allowed' : 'pointer',
              fontSize:'0.875rem', fontWeight:600, opacity: loading ? 0.7 : 1 }}>
            {loading ? '⏳ Carregando...' : '🔄 Gerar Relatório'}
          </button>
          {dados && (
            <button onClick={gerarPDF} className="btn-primary"
              style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
              ⬇️ Baixar PDF
            </button>
          )}
        </div>
      </div>

      <BarraProgresso />

      {!dados ? (
        <div className="card" style={{ textAlign:'center', padding:'4rem 2rem' }}>
          <p style={{ fontSize:'4rem', marginBottom:'1rem' }}>📄</p>
          <h3 style={{ fontWeight:700, fontSize:'1.2rem', marginBottom:'0.5rem',
            color:'var(--text-primary)' }}>Gere seu Relatório Completo</h3>
          <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem',
            maxWidth:480, margin:'0 auto 1.5rem', lineHeight:1.7 }}>
            Consolida horas de estudo, ciclo semanal, cursos, questões,
            simulados e cronômetro. Exportado em PDF com cabeçalho, rodapé
            (data + e-mail) e paginação automática.
          </p>
          <button onClick={buscarDados} className="btn-primary"
            disabled={loading} style={{ fontSize:'1rem', padding:'0.75rem 2rem' }}>
            {loading ? '⏳ Gerando...' : '🚀 Gerar Agora'}
          </button>
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
          {/* Identificação */}
          <div className="card">
            <h3 style={{ fontWeight:700, marginBottom:'1rem', fontSize:'1rem' }}>👤 Identificação</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'1rem' }}>
              {[['Nome',dados.usuario.nome],['E-mail',dados.usuario.email],
                ['Membro desde',fmtD(dados.usuario.criado_em)]].map(([l,v]) => (
                <div key={l}>
                  <div style={{ fontSize:'0.72rem', color:'var(--text-secondary)',
                    fontWeight:600, textTransform:'uppercase',
                    letterSpacing:'0.05em', marginBottom:2 }}>{l}</div>
                  <div style={{ fontWeight:600, color:'var(--text-primary)' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Métricas */}
          <div style={{ display:'grid',
            gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:'1rem' }}>
            {[
              ['⏱️','Total Horas',    `${dados.resumoEstudo.total_horas}h`, '#6366f1'],
              ['📅','Dias Estudados', dados.resumoEstudo.dias_estudados,    '#3b82f6'],
              ['🎓','Cursos',         dados.cursos.length,                  '#8b5cf6'],
              ['📝','Questões',       dados.questoes.total,                 '#f59e0b'],
              ['📋','Simulados',      dados.simulados.length,               '#06b6d4'],
              ['🍅','Sessões',        dados.sessoesCronometro.total_sessoes,'#ef4444'],
              ['📈','Meta Semana',    `${pctMeta(dados)}%`,
                pctMeta(dados)>=70?'#22c55e':'#f59e0b'],
              ['🏫','Bancas',         dados.questoes.bancas,                '#10b981']
            ].map(([icon,label,valor,cor]) => (
              <div key={label} className="card" style={{ textAlign:'center', padding:'1rem' }}>
                <div style={{ fontSize:'1.5rem', marginBottom:4 }}>{icon}</div>
                <div style={{ fontSize:'1.3rem', fontWeight:700, color:cor }}>{valor}</div>
                <div style={{ fontSize:'0.72rem', color:'var(--text-secondary)', marginTop:2 }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Tabela: Horas por matéria */}
          {dados.porMateria.length > 0 && (
            <div className="card">
              <h3 style={{ fontWeight:700, marginBottom:'1rem', fontSize:'1rem' }}>
                📚 Horas por Matéria
              </h3>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom:'2px solid var(--border)' }}>
                    {['Matéria','Horas','Dias'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'0.5rem',
                        color:'var(--text-secondary)', fontWeight:600, fontSize:'0.78rem' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dados.porMateria.map((m,i) => (
                    <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                      <td style={{ padding:'0.5rem', display:'flex',
                        alignItems:'center', gap:'0.5rem' }}>
                        <span style={{ width:10, height:10, borderRadius:'50%',
                          background:m.cor, flexShrink:0, display:'inline-block' }} />
                        {m.nome}
                      </td>
                      <td style={{ padding:'0.5rem', fontWeight:700,
                        color:'var(--accent)' }}>{m.total_horas}h</td>
                      <td style={{ padding:'0.5rem',
                        color:'var(--text-secondary)' }}>{m.dias}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tabela: Cursos */}
          {dados.cursos.length > 0 && (
            <div className="card">
              <h3 style={{ fontWeight:700, marginBottom:'1rem', fontSize:'1rem' }}>
                🎓 Cursos
              </h3>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom:'2px solid var(--border)' }}>
                    {['Curso','Plataforma','Progresso','Status'].map(h => (
                      <th key={h} style={{ textAlign:'left', padding:'0.5rem',
                        color:'var(--text-secondary)', fontWeight:600, fontSize:'0.78rem' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dados.cursos.map((c,i) => (
                    <tr key={i} style={{ borderBottom:'1px solid var(--border)' }}>
                      <td style={{ padding:'0.5rem', fontWeight:600 }}>{c.nome}</td>
                      <td style={{ padding:'0.5rem',
                        color:'var(--text-secondary)' }}>{c.plataforma||'—'}</td>
                      <td style={{ padding:'0.5rem' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <div style={{ flex:1, background:'var(--border)',
                            borderRadius:999, height:6, overflow:'hidden', maxWidth:80 }}>
                            <div style={{ height:'100%', background:'var(--accent)',
                              width:`${c.progresso}%`, borderRadius:999 }} />
                          </div>
                          <span style={{ fontSize:'0.78rem', fontWeight:600 }}>
                            {c.progresso}%
                          </span>
                        </div>
                      </td>
                      <td style={{ padding:'0.5rem' }}>{S_LBL[c.status]||c.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="card" style={{ textAlign:'center', padding:'2rem' }}>
            <p style={{ color:'var(--text-secondary)', fontSize:'0.875rem',
              marginBottom:'1rem' }}>
              PDF com cabeçalho colorido, rodapé (data + <strong>{dados.usuario.email}</strong>)
              e paginação automática
            </p>
            <button onClick={gerarPDF} className="btn-primary"
              style={{ fontSize:'1rem', padding:'0.875rem 2.5rem' }}>
              ⬇️ Baixar Relatório PDF
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
