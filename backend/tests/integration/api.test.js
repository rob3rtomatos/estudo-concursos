/**
 * Testes de integração - Endpoints da API
 * Exige banco de dados ativo (rodar dentro do Docker)
 */

const request = require('supertest');
const app     = require('../../src/app');

// Usuário de teste reutilizado entre os testes
const userTest = {
  nome:  'Usuário Teste',
  email: `teste_${Date.now()}@test.com`,   // Email único a cada execução
  senha: 'senha123'
};
let tokenTeste = '';   // JWT gerado no login
let materiaId  = 0;    // ID da matéria criada nos testes
let cicloId    = 0;    // ID da entrada de ciclo criada

// ─────────────────────────────────────────────────────────
// AUTENTICAÇÃO
// ─────────────────────────────────────────────────────────
describe('Auth - Registro e Login', () => {

  it('POST /api/auth/registro - deve criar usuário e retornar token', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send(userTest);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.usuario.email).toBe(userTest.email);
    tokenTeste = res.body.token;  // Guardar token para próximos testes
  });

  it('POST /api/auth/registro - deve rejeitar email duplicado', async () => {
    const res = await request(app)
      .post('/api/auth/registro')
      .send(userTest);

    expect(res.status).toBe(409);
    expect(res.body).toHaveProperty('erro');
  });

  it('POST /api/auth/login - deve autenticar e retornar token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userTest.email, senha: userTest.senha });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    tokenTeste = res.body.token;  // Atualizar token
  });

  it('POST /api/auth/login - deve rejeitar senha errada', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userTest.email, senha: 'senha_errada' });

    expect(res.status).toBe(401);
  });

  it('GET /api/auth/me - deve retornar dados do usuário autenticado', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenTeste}`);

    expect(res.status).toBe(200);
    expect(res.body.usuario.email).toBe(userTest.email);
  });

  it('GET /api/auth/me - deve rejeitar acesso sem token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────────────
// MATÉRIAS
// ─────────────────────────────────────────────────────────
describe('Matérias - CRUD', () => {

  it('POST /api/materias - deve criar matéria', async () => {
    const res = await request(app)
      .post('/api/materias')
      .set('Authorization', `Bearer ${tokenTeste}`)
      .send({ nome: 'Banco de Dados', cor: '#6366f1' });

    expect(res.status).toBe(201);
    expect(res.body.materia.nome).toBe('Banco de Dados');
    materiaId = res.body.materia.id;  // Guardar para próximos testes
  });

  it('GET /api/materias - deve listar matérias do usuário', async () => {
    const res = await request(app)
      .get('/api/materias')
      .set('Authorization', `Bearer ${tokenTeste}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.materias)).toBe(true);
    expect(res.body.materias.length).toBeGreaterThan(0);
  });

  it('PUT /api/materias/:id - deve atualizar matéria', async () => {
    const res = await request(app)
      .put(`/api/materias/${materiaId}`)
      .set('Authorization', `Bearer ${tokenTeste}`)
      .send({ nome: 'BD Atualizado', cor: '#22c55e' });

    expect(res.status).toBe(200);
    expect(res.body.materia.nome).toBe('BD Atualizado');
  });
});

// ─────────────────────────────────────────────────────────
// CICLO DE ESTUDOS
// ─────────────────────────────────────────────────────────
describe('Ciclo de Estudos - CRUD', () => {

  it('POST /api/ciclos - deve criar entrada no ciclo', async () => {
    const res = await request(app)
      .post('/api/ciclos')
      .set('Authorization', `Bearer ${tokenTeste}`)
      .send({
        dia_semana:       1,  // Segunda-feira
        materia_id:       materiaId,
        horas_planejadas: 2.5
      });

    expect(res.status).toBe(201);
    expect(res.body.entrada.dia_semana).toBe(1);
    cicloId = res.body.entrada.id;
  });

  it('GET /api/ciclos - deve retornar ciclo semanal agrupado por dia', async () => {
    const res = await request(app)
      .get('/api/ciclos')
      .set('Authorization', `Bearer ${tokenTeste}`);

    expect(res.status).toBe(200);
    expect(res.body.ciclo).toHaveProperty('1');  // Segunda-feira
    expect(Array.isArray(res.body.ciclo['1'])).toBe(true);
    expect(res.body.ciclo['1'].length).toBeGreaterThan(0);
  });

  it('DELETE /api/ciclos/:id - deve remover entrada do ciclo', async () => {
    const res = await request(app)
      .delete(`/api/ciclos/${cicloId}`)
      .set('Authorization', `Bearer ${tokenTeste}`);

    expect(res.status).toBe(200);
  });
});

// ─────────────────────────────────────────────────────────
// REGISTRO DE HORAS
// ─────────────────────────────────────────────────────────
describe('Registro de Horas', () => {
  const hoje = new Date().toISOString().slice(0, 10);

  it('POST /api/registros - deve salvar horas estudadas', async () => {
    const res = await request(app)
      .post('/api/registros')
      .set('Authorization', `Bearer ${tokenTeste}`)
      .send({
        materia_id:      materiaId,
        data_estudo:     hoje,
        horas_estudadas: 1.5,
        observacoes:     'Capítulos 1-3'
      });

    expect(res.status).toBe(201);
    expect(parseFloat(res.body.registro.horas_estudadas)).toBe(1.5);
  });

  it('POST /api/registros - deve atualizar registro existente (upsert)', async () => {
    const res = await request(app)
      .post('/api/registros')
      .set('Authorization', `Bearer ${tokenTeste}`)
      .send({
        materia_id:      materiaId,
        data_estudo:     hoje,
        horas_estudadas: 3.0  // Atualizar para 3h
      });

    expect(res.status).toBe(201);
    expect(parseFloat(res.body.registro.horas_estudadas)).toBe(3.0);
  });

  it('GET /api/registros/hoje - deve retornar registros de hoje', async () => {
    const res = await request(app)
      .get('/api/registros/hoje')
      .set('Authorization', `Bearer ${tokenTeste}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.registros)).toBe(true);
    expect(res.body.registros.length).toBeGreaterThan(0);
  });

  it('GET /api/registros - deve retornar registros por período', async () => {
    const res = await request(app)
      .get(`/api/registros?inicio=${hoje}&fim=${hoje}`)
      .set('Authorization', `Bearer ${tokenTeste}`);

    expect(res.status).toBe(200);
    expect(res.body.registros.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────
describe('Dashboard', () => {

  it('GET /api/dashboard/resumo - deve retornar dados dos gráficos', async () => {
    const res = await request(app)
      .get('/api/dashboard/resumo')
      .set('Authorization', `Bearer ${tokenTeste}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('porDia');
    expect(res.body).toHaveProperty('porMateria');
    expect(res.body).toHaveProperty('metaSemanal');
    expect(res.body).toHaveProperty('totalHoje');
    expect(Array.isArray(res.body.porDia)).toBe(true);
    expect(typeof res.body.totalHoje).toBe('number');
  });
});

// ─────────────────────────────────────────────────────────
// NOTIFICAÇÕES
// ─────────────────────────────────────────────────────────
describe('Notificações', () => {

  it('GET /api/notificacoes - deve listar notificações', async () => {
    const res = await request(app)
      .get('/api/notificacoes')
      .set('Authorization', `Bearer ${tokenTeste}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.notificacoes)).toBe(true);
    expect(typeof res.body.naoLidas).toBe('number');
  });
});
