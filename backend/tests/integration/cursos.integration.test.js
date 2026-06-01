const request = require('supertest');
const app     = require('../../src/app');
const { clearTables } = require('../setup/testDb');

let token;
beforeAll(async () => {
  await clearTables();
  await request(app).post('/api/auth/registro')
    .send({ nome: 'User', email: 'curso@teste.com', senha: 'Senha@123' });
  const r = await request(app).post('/api/auth/login')
    .send({ email: 'curso@teste.com', senha: 'Senha@123' });
  token = r.body.token;
});
afterAll(async () => { await clearTables(); });

describe('[INTEGRATION] Cursos', () => {
  let cursoId;

  test('POST /api/cursos - cria curso', async () => {
    const res = await request(app).post('/api/cursos')
      .set('Authorization', `Bearer ${token}`)
      .send({ nome: 'Curso TI para Concursos', plataforma: 'Estratégia', cor: '#6366f1' });
    expect(res.status).toBe(201);
    cursoId = res.body.id;
  });

  test('GET /api/cursos - lista cursos', async () => {
    const res = await request(app).get('/api/cursos')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('PATCH /api/cursos/:id - atualiza progresso', async () => {
    const res = await request(app).patch(`/api/cursos/${cursoId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ progresso: 50, status: 'em_andamento' });
    expect([200, 201]).toContain(res.status);
  });
});
