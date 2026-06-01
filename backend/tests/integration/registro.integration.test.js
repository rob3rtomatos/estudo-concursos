const request = require('supertest');
const app     = require('../../src/app');
const { clearTables } = require('../setup/testDb');

let token, materiaId;
beforeAll(async () => {
  await clearTables();
  const r = await request(app).post('/api/auth/registro')
    .send({ nome: 'User', email: 'reg@teste.com', senha: 'Senha@123' });
  token = r.body.token;
  const m = await request(app).post('/api/materias')
    .set('Authorization', `Bearer ${token}`)
    .send({ nome: 'Português', cor: '#6366f1' });
  materiaId = m.body.materia.id;
});
afterAll(async () => { await clearTables(); });

describe('[INTEGRATION] Registro de Estudo', () => {
  test('POST /api/registros - cria registro', async () => {
    const res = await request(app).post('/api/registros')
      .set('Authorization', `Bearer ${token}`)
      .send({ materia_id: materiaId, data_estudo: '2026-06-01', horas_estudadas: 2.5 });
    expect([200, 201]).toContain(res.status);
  });

  test('POST /api/registros - horas negativas retorna 422', async () => {
    const res = await request(app).post('/api/registros')
      .set('Authorization', `Bearer ${token}`)
      .send({ materia_id: materiaId, data_estudo: '2026-06-02', horas_estudadas: -1 });
    expect([400, 422]).toContain(res.status);
  });

  test('GET /api/registros - lista registros', async () => {
    const res = await request(app).get('/api/registros')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toBeTruthy();
  });
});
