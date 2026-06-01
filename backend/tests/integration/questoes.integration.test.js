const request = require('supertest');
const app     = require('../../src/app');
const { clearTables } = require('../setup/testDb');

let token, materiaId;
beforeAll(async () => {
  await clearTables();
  await request(app).post('/api/auth/registro')
    .send({ nome: 'User', email: 'quest@teste.com', senha: 'Senha@123' });
  const r = await request(app).post('/api/auth/login')
    .send({ email: 'quest@teste.com', senha: 'Senha@123' });
  token = r.body.token;
  const m = await request(app).post('/api/materias')
    .set('Authorization', `Bearer ${token}`)
    .send({ nome: 'Informática', cor: '#6366f1' });
  materiaId = m.body.id;
});
afterAll(async () => { await clearTables(); });

describe('[INTEGRATION] Questões', () => {
  let questaoId;

  test('POST /api/questoes - cria questão', async () => {
    const res = await request(app).post('/api/questoes')
      .set('Authorization', `Bearer ${token}`)
      .send({ materia_id: materiaId, banca: 'CESPE', ano: 2024,
              dificuldade: 'medio', enunciado: 'Enunciado da questão de teste' });
    expect(res.status).toBe(201);
    questaoId = res.body.id;
  });

  test('GET /api/questoes - lista questões', async () => {
    const res = await request(app).get('/api/questoes')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('DELETE /api/questoes/:id - remove questão', async () => {
    const res = await request(app).delete(`/api/questoes/${questaoId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
