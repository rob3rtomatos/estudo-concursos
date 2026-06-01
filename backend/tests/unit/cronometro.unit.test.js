describe('[UNIT] Cronômetro - Lógica de tempo', () => {
  const calcularDuracao = (iniciadoEm, encerradoEm) => {
    const diff = new Date(encerradoEm) - new Date(iniciadoEm);
    return Math.floor(diff / 1000);
  };

  const segParaHoras = (seg) => parseFloat((seg / 3600).toFixed(1));

  test('calcula duração em segundos corretamente', () => {
    const inicio = new Date('2026-06-01T08:00:00');
    const fim    = new Date('2026-06-01T09:00:00');
    expect(calcularDuracao(inicio, fim)).toBe(3600);
  });

  test('converte 3600 segundos para 1.0 hora', () => {
    expect(segParaHoras(3600)).toBe(1.0);
  });

  test('converte 5400 segundos para 1.5 horas', () => {
    expect(segParaHoras(5400)).toBe(1.5);
  });

  test('duração zero quando inicio = fim', () => {
    const t = new Date();
    expect(calcularDuracao(t, t)).toBe(0);
  });
});
