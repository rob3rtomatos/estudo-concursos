const request = require('supertest');
const app     = require('../../src/app');
const { clearTables } = require('../setup/testDb');

let token;
beforeAll(async () => {
  await clearTables();
  await request(app).post('/api/auth/registro')
    .send({ nome: 'User', email: 'dash@teste.com', senha: 'Senha@123' });
  const r = await request(app).post('/api/auth/login')
    .send({ email: 'dash@teste.com', senha: 'Senha@123' });
  token = r.body.token;
});
afterAll(async () => { await clearTables(); });

describe('[INTEGRATION] Dashboard', () => {
  test('GET /api/dashboard - retorna estrutura completa', async () => {
    const res = await request(app).get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('porDia');
    expect(res.body).toHaveProperty('porMateria');
    expect(res.body).toHaveProperty('metaSemanal');
    expect(res.body).toHaveProperty('totalHoje');
    expect(res.body).toHaveProperty('totalQuestoes');
    expect(res.body).toHaveProperty('totalSimulados');
  });

  test('GET /api/dashboard - porMateria inclui dados do cronômetro', async () => {
    const res = await request(app).get('/api/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(Array.isArray(res.body.porMateria)).toBe(true);
  });

  test('GET /api/dashboard sem token - retorna 401', async () => {
    const res = await request(app).get('/api/dashboard');
    expect(res.status).toBe(401);
  });
});
