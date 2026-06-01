const request = require('supertest');
const app     = require('../../src/app');
const { clearTables } = require('../setup/testDb');

let token;
beforeAll(async () => {
  await clearTables();
  await request(app).post('/api/auth/registro')
    .send({ nome: 'User', email: 'sim@teste.com', senha: 'Senha@123' });
  const r = await request(app).post('/api/auth/login')
    .send({ email: 'sim@teste.com', senha: 'Senha@123' });
  token = r.body.token;
});
afterAll(async () => { await clearTables(); });

describe('[INTEGRATION] Simulados', () => {
  let simuladoId;

  test('POST /api/simulados - cria simulado', async () => {
    const res = await request(app).post('/api/simulados')
      .set('Authorization', `Bearer ${token}`)
      .send({ titulo: 'Simulado CESPE 2024', tempo_min: 120 });
    expect(res.status).toBe(201);
    simuladoId = res.body.id;
  });

  test('GET /api/simulados - lista simulados', async () => {
    const res = await request(app).get('/api/simulados')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('DELETE /api/simulados/:id - remove simulado', async () => {
    const res = await request(app).delete(`/api/simulados/${simuladoId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
