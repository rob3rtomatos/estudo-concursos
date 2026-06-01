const request = require('supertest');
const app     = require('../../src/app');
const { clearTables } = require('../setup/testDb');

let token;
beforeAll(async () => {
  await clearTables();
  await request(app).post('/api/auth/registro')
    .send({ nome: 'User', email: 'mat@teste.com', senha: 'Senha@123' });
  const r = await request(app).post('/api/auth/login')
    .send({ email: 'mat@teste.com', senha: 'Senha@123' });
  token = r.body.token;
});
afterAll(async () => { await clearTables(); });

describe('[INTEGRATION] Matérias', () => {
  let materiaId;

  test('POST /api/materias - cria matéria', async () => {
    const res = await request(app).post('/api/materias')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Direito Constitucional', cor: '#6366f1' });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    materiaId = res.body.id;
  });

  test('GET /api/materias - lista matérias do usuário', async () => {
    const res = await request(app).get('/api/materias')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('PUT /api/materias/:id - atualiza matéria', async () => {
    const res = await request(app).put(`/api/materias/${materiaId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Dir. Constitucional Atualizado', cor: '#FF5733' });
    expect(res.status).toBe(200);
  });

  test('DELETE /api/materias/:id - remove matéria', async () => {
    const res = await request(app).delete(`/api/materias/${materiaId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('GET /api/materias sem token - retorna 401', async () => {
    const res = await request(app).get('/api/materias');
    expect(res.status).toBe(401);
  });
});
