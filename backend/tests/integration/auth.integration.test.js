const request = require('supertest');
const app     = require('../../src/app');
const { clearTables, closePool } = require('../setup/testDb');

beforeAll(async () => { await clearTables(); });
afterAll(async () => { await clearTables(); });

describe('[INTEGRATION] Auth', () => {
  const user = { nome: 'Teste User', email: 'teste@teste.com', senha: 'Senha@123' };
  let token;

  test('POST /api/auth/registro - cadastro válido retorna 201', async () => {
    const res = await request(app).post('/api/auth/registro').send(user);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  test('POST /api/auth/registro - email duplicado retorna 409', async () => {
    const res = await request(app).post('/api/auth/registro').send(user);
    expect(res.status).toBe(409);
  });

  test('POST /api/auth/login - credenciais válidas retorna token', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: user.email, senha: user.senha });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  test('POST /api/auth/login - senha errada retorna 401', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: user.email, senha: 'errada' });
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me - sem token retorna 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me - token válido retorna dados do usuário', async () => {
    const res = await request(app).get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.usuario?.email || res.body.email).toBe(user.email);
  });
});
