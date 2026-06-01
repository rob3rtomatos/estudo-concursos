const request = require('supertest');
const app     = require('../../src/app');
const { clearTables } = require('../setup/testDb');

let token, materiaId;
beforeAll(async () => {
  await clearTables();
  await request(app).post('/api/auth/registro')
    .send({ nome: 'User', email: 'reg@teste.com', senha: 'Senha@123' });
  const r = await request(app).post('/api/auth/login')
    .send({ email: 'reg@teste.com', senha: 'Senha@123' });
  token = r.body.token;
  const m = await request(app).post('/api/materias')
    .set('Authorization', `Bearer ${token}`)
    .send({ nome: 'Português', cor: '#6366f1' });
  materiaId = m.body.id;
});
afterAll(async () => { await clearTables(); });

describe('[INTEGRATION] Registro de Estudo', () => {
  test('POST /api/registro - cria registro', async () => {
    const res = await request(app).post('/api/registro')
      .set('Authorization', `Bearer ${token}`)
      .send({ materia_id: materiaId, data_estudo: '2026-06-01', horas_estudadas: 2.5 });
    expect([200, 201]).toContain(res.status);
  });

  test('POST /api/registro - horas negativas retorna 422', async () => {
    const res = await request(app).post('/api/registro')
      .set('Authorization', `Bearer ${token}`)
      .send({ materia_id: materiaId, data_estudo: '2026-06-02', horas_estudadas: -1 });
    expect([400, 422]).toContain(res.status);
  });

  test('GET /api/registro - lista registros', async () => {
    const res = await request(app).get('/api/registro')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
