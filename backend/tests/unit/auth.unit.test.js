const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

describe('[UNIT] Auth - Utilitários', () => {
  test('bcrypt: hash e comparação válidos', async () => {
    const hash = await bcrypt.hash('senha123', 10);
    expect(await bcrypt.compare('senha123', hash)).toBe(true);
    expect(await bcrypt.compare('errada',   hash)).toBe(false);
  });

  test('JWT: geração e verificação do token', () => {
    const secret  = process.env.JWT_SECRET || 'testsecret';
    const payload = { id: 1, email: 'teste@teste.com' };
    const token   = jwt.sign(payload, secret, { expiresIn: '1h' });
    const decoded = jwt.verify(token, secret);
    expect(decoded.id).toBe(1);
    expect(decoded.email).toBe('teste@teste.com');
  });

  test('JWT: token expirado lança erro', () => {
    const secret = process.env.JWT_SECRET || 'testsecret';
    const token  = jwt.sign({ id: 1 }, secret, { expiresIn: '-1s' });
    expect(() => jwt.verify(token, secret)).toThrow('jwt expired');
  });

  test('JWT: token adulterado lança erro', () => {
    const secret = process.env.JWT_SECRET || 'testsecret';
    const token  = jwt.sign({ id: 1 }, secret) + 'adulterado';
    expect(() => jwt.verify(token, secret)).toThrow();
  });
});
