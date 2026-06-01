const request = require('supertest');
const app     = require('../../src/app');
const { clearTables, closePool } = require('../setup/testDb');

let token;
beforeAll(async () => {
  await clearTables();
  const r = await request(app).post('/api/auth/registro')
    .send({ nome: 'User', email: 'dash@teste.com', senha: 'Senha@123' });
  token = r.body.token;
});
afterAll(async () => { await clearTables(); });

describe('[INTEGRATION] Dashboard', () => {
  test('GET /api/dashboard/resumo - retorna estrutura completa', async () => {
    const res = await request(app).get('/api/dashboard/resumo')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('porDia');
    expect(res.body).toHaveProperty('porMateria');
    expect(res.body).toHaveProperty('metaSemanal');
    expect(res.body).toHaveProperty('totalHoje');
  });

  test('GET /api/dashboard/resumo sem token - retorna 401', async () => {
    const res = await request(app).get('/api/dashboard/resumo');
    expect(res.status).toBe(401);
  });
});
