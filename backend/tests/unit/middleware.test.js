/**
 * Testes unitários - authMiddleware
 */

const jwt = require('jsonwebtoken');
process.env.JWT_SECRET = 'secret_teste_unitario';

const { autenticar } = require('../../src/middleware/authMiddleware');

/** Utilitário para criar mock de req/res/next */
function criarMocks(headers = {}) {
  const req  = { headers };
  const res  = {
    status: jest.fn().mockReturnThis(),
    json:   jest.fn().mockReturnThis()
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('authMiddleware - autenticar', () => {

  it('deve rejeitar requisição sem header Authorization', () => {
    const { req, res, next } = criarMocks();
    autenticar(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ erro: expect.any(String) })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('deve rejeitar token sem prefixo Bearer', () => {
    const { req, res, next } = criarMocks({
      authorization: 'token_sem_bearer'
    });
    autenticar(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('deve aceitar token válido e injetar req.usuario', () => {
    const token = jwt.sign(
      { id: 42, email: 'user@test.com' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const { req, res, next } = criarMocks({
      authorization: `Bearer ${token}`
    });

    autenticar(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.usuario).toEqual(
      expect.objectContaining({ id: 42, email: 'user@test.com' })
    );
  });

  it('deve rejeitar token expirado com mensagem específica', () => {
    // Token que expirou 1 segundo atrás
    const token = jwt.sign(
      { id: 1, email: 'old@test.com' },
      process.env.JWT_SECRET,
      { expiresIn: -1 }
    );
    const { req, res, next } = criarMocks({
      authorization: `Bearer ${token}`
    });

    autenticar(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ erro: expect.stringContaining('expirado') })
    );
  });

  it('deve rejeitar token adulterado', () => {
    const { req, res, next } = criarMocks({
      authorization: 'Bearer token.adulterado.invalido'
    });

    autenticar(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
