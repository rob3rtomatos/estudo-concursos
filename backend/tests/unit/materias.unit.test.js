describe('[UNIT] Matérias - Validações', () => {
  const validarMateria = (nome, cor) => {
    const erros = [];
    if (!nome || nome.trim().length < 2)   erros.push('Nome muito curto');
    if (!nome || nome.trim().length > 100) erros.push('Nome muito longo');
    if (cor && !/^#[0-9a-fA-F]{6}$/.test(cor)) erros.push('Cor inválida');
    return erros;
  };

  test('nome válido não retorna erros', () => {
    expect(validarMateria('Direito Constitucional', '#6366f1')).toHaveLength(0);
  });

  test('nome vazio retorna erro', () => {
    expect(validarMateria('', '#6366f1')).toContain('Nome muito curto');
  });

  test('cor hex inválida retorna erro', () => {
    expect(validarMateria('Matemática', 'vermelho')).toContain('Cor inválida');
  });

  test('cor hex válida não retorna erro', () => {
    expect(validarMateria('Português', '#FF5733')).toHaveLength(0);
  });
});
