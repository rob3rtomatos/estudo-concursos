/**
 * Testes unitários - Cálculos de desempenho e métricas
 */

// ─────────────────────────────────────────────────────────
// Funções utilitárias de cálculo (puras, sem dependências)
// ─────────────────────────────────────────────────────────

/** Calcula percentual de meta concluída */
function calcularPercentualMeta(estudado, planejado) {
  if (!planejado || planejado <= 0) return 0;
  return Math.min(100, Math.round((estudado / planejado) * 100));
}

/** Agrupa registros por dia (array de { data, horas }) */
function agruparPorDia(registros) {
  return registros.reduce((acc, r) => {
    acc[r.data] = (acc[r.data] || 0) + r.horas;
    return acc;
  }, {});
}

/** Soma total de horas em um array de registros */
function somarHoras(registros) {
  return registros.reduce((sum, r) => sum + r.horas, 0);
}

/** Identifica a matéria com mais horas estudadas */
function materiaMaisEstudada(porMateria) {
  if (!porMateria || porMateria.length === 0) return null;
  return porMateria.reduce((max, m) =>
    m.total_horas > max.total_horas ? m : max
  );
}

// ─────────────────────────────────────────────────────────
// TESTES
// ─────────────────────────────────────────────────────────

describe('calcularPercentualMeta', () => {
  it('deve retornar 75% quando estudou 3h de meta 4h', () => {
    expect(calcularPercentualMeta(3, 4)).toBe(75);
  });

  it('deve retornar 100% quando meta foi superada', () => {
    expect(calcularPercentualMeta(12, 8)).toBe(100);
  });

  it('deve retornar 0% quando meta não foi definida', () => {
    expect(calcularPercentualMeta(3, 0)).toBe(0);
    expect(calcularPercentualMeta(3, null)).toBe(0);
  });

  it('deve retornar 0% quando ainda não estudou', () => {
    expect(calcularPercentualMeta(0, 8)).toBe(0);
  });
});

describe('agruparPorDia', () => {
  const registros = [
    { data: '2025-06-01', horas: 2 },
    { data: '2025-06-01', horas: 1 },   // Mesmo dia → soma 3h
    { data: '2025-06-02', horas: 2.5 }
  ];

  it('deve somar horas do mesmo dia', () => {
    const agrupado = agruparPorDia(registros);
    expect(agrupado['2025-06-01']).toBe(3);
  });

  it('deve manter dias distintos separados', () => {
    const agrupado = agruparPorDia(registros);
    expect(agrupado['2025-06-02']).toBe(2.5);
  });

  it('deve retornar objeto vazio para array vazio', () => {
    expect(agruparPorDia([])).toEqual({});
  });
});

describe('somarHoras', () => {
  it('deve somar corretamente horas decimais', () => {
    const r = [{ horas: 1.5 }, { horas: 2.5 }, { horas: 0.5 }];
    expect(somarHoras(r)).toBeCloseTo(4.5);
  });

  it('deve retornar 0 para array vazio', () => {
    expect(somarHoras([])).toBe(0);
  });
});

describe('materiaMaisEstudada', () => {
  const materias = [
    { materia: 'Redes',         total_horas: 10 },
    { materia: 'Banco de Dados',total_horas: 18 },
    { materia: 'SO',            total_horas: 7  }
  ];

  it('deve identificar a matéria com mais horas', () => {
    const top = materiaMaisEstudada(materias);
    expect(top.materia).toBe('Banco de Dados');
  });

  it('deve retornar null para array vazio', () => {
    expect(materiaMaisEstudada([])).toBeNull();
    expect(materiaMaisEstudada(null)).toBeNull();
  });
});
