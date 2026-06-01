/**
 * Testes unitários - Autenticação (JWT e bcrypt)
 */

const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

process.env.JWT_SECRET = 'test_secret';

describe('bcrypt hash e comparação', () => {
  it('deve criar hash e validar senha corretamente', async () => {
    const hash = await bcrypt.hash('minha_senha', 10);
    const valida = await bcrypt.compare('minha_senha', hash);
    expect(valida).toBe(true);
  });

  it('deve rejeitar senha incorreta', async () => {
    const hash = await bcrypt.hash('correta', 10);
    const invalida = await bcrypt.compare('errada', hash);
    expect(invalida).toBe(false);
  });
});

describe('JWT geração e verificação', () => {
  it('deve gerar e verificar token válido', () => {
    const payload = { id: 1, email: 'test@test.com' };
    const token   = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    expect(decoded.id).toBe(1);
    expect(decoded.email).toBe('test@test.com');
  });

  it('deve lançar erro em token inválido', () => {
    expect(() => jwt.verify('token_invalido', process.env.JWT_SECRET)).toThrow();
  });
});
