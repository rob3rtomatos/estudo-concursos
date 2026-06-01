const request = require('supertest');
const app     = require('../../src/app');
const { clearTables, closePool } = require('../setup/testDb');

let token;
beforeAll(async () => {
  await clearTables();
  const r = await request(app).post('/api/auth/registro')
    .send({ nome: 'User', email: 'rel@teste.com', senha: 'Senha@123' });
  token = r.body.token;
});
afterAll(async () => { await clearTables(); });

describe('[INTEGRATION] Relatórios', () => {
  test('GET /api/relatorios/gerar - retorna dados sem erro', async () => {
    const res = await request(app).get('/api/relatorios/gerar')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('GET /api/relatorios/gerar sem token - retorna 401', async () => {
    const res = await request(app).get('/api/relatorios/gerar');
    expect(res.status).toBe(401);
  });
});
