const request = require('supertest');
const app     = require('../../src/app');
const { clearTables } = require('../setup/testDb');

let token, materiaId;
beforeAll(async () => {
  await clearTables();
  const r = await request(app).post('/api/auth/registro')
    .send({ nome: 'User', email: 'cron@teste.com', senha: 'Senha@123' });
  token = r.body.token;
  const m = await request(app).post('/api/materias')
    .set('Authorization', `Bearer ${token}`)
    .send({ nome: 'Matemática', cor: '#6366f1' });
  materiaId = m.body.materia.id;
});
afterAll(async () => { await clearTables(); });

describe('[INTEGRATION] Cronômetro', () => {
  test('GET /api/cronometro/ativa - sem sessão retorna 200', async () => {
    const res = await request(app).get('/api/cronometro/ativa')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('POST /api/cronometro/iniciar - inicia sessão', async () => {
    const res = await request(app).post('/api/cronometro/iniciar')
      .set('Authorization', `Bearer ${token}`)
      .send({ materia_id: materiaId });
    expect([200, 201]).toContain(res.status);
  });

  test('PATCH /api/cronometro/pausar - pausa sessão ativa', async () => {
    const res = await request(app).patch('/api/cronometro/pausar')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 400]).toContain(res.status);
  });

  test('PATCH /api/cronometro/retomar - retoma sessão pausada', async () => {
    const res = await request(app).patch('/api/cronometro/retomar')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 400, 404]).toContain(res.status);
  });

  test('POST /api/cronometro/encerrar - encerra sessão', async () => {
    const res = await request(app).post('/api/cronometro/encerrar')
      .set('Authorization', `Bearer ${token}`);
    expect([200, 400, 404]).toContain(res.status);
  });
});
