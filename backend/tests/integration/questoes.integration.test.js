const request = require('supertest');
const app     = require('../../src/app');
const { clearTables } = require('../setup/testDb');

let token, materiaId;
beforeAll(async () => {
  await clearTables();
  const r = await request(app).post('/api/auth/registro')
    .send({ nome: 'User', email: 'quest@teste.com', senha: 'Senha@123' });
  token = r.body.token;
  const m = await request(app).post('/api/materias')
    .set('Authorization', `Bearer ${token}`)
    .send({ nome: 'Informática', cor: '#6366f1' });
  materiaId = m.body.materia.id;
});
afterAll(async () => { await clearTables(); });

describe('[INTEGRATION] Questões', () => {
  let questaoId;

  test('POST /api/questoes - cria questão', async () => {
    const res = await request(app).post('/api/questoes')
      .set('Authorization', `Bearer ${token}`)
      .send({ materia_id: materiaId, banca: 'CESPE', ano: 2024,
              dificuldade: 'media', enunciado: 'Enunciado da questão de teste' });
    expect([200, 201]).toContain(res.status);
    questaoId = res.body.questao?.id || res.body.id;
  });

  test('GET /api/questoes - lista questões', async () => {
    const res = await request(app).get('/api/questoes')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  test('DELETE /api/questoes/:id - remove questão', async () => {
    const res = await request(app).delete(`/api/questoes/${questaoId}`)
      .set('Authorization', `Bearer ${token}`);
    expect([200, 204]).toContain(res.status);
  });
});
