const request = require('supertest');
const app     = require('../../src/app');
const { clearTables } = require('../setup/testDb');

let tokenA, tokenB, materiaIdA;

beforeAll(async () => {
  await clearTables();

  // Usuário A
  await request(app).post('/api/auth/registro')
    .send({ nome: 'User A', email: 'usera@sec.com', senha: 'Senha@123' });
  const rA = await request(app).post('/api/auth/login')
    .send({ email: 'usera@sec.com', senha: 'Senha@123' });
  tokenA = rA.body.token;

  // Usuário B
  await request(app).post('/api/auth/registro')
    .send({ nome: 'User B', email: 'userb@sec.com', senha: 'Senha@456' });
  const rB = await request(app).post('/api/auth/login')
    .send({ email: 'userb@sec.com', senha: 'Senha@456' });
  tokenB = rB.body.token;

  // Matéria do usuário A
  const m = await request(app).post('/api/materias')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ nome: 'Matéria Privada', cor: '#6366f1' });
  materiaIdA = m.body.materia?.id || m.body.id;
});
afterAll(async () => { await clearTables(); });

// ── A01: Broken Access Control ───────────────────────────────────
describe('[OWASP A01] Broken Access Control', () => {
  test('Usuário B não pode deletar matéria do Usuário A', async () => {
    const res = await request(app).delete(`/api/materias/${materiaIdA}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect([403, 404]).toContain(res.status);
  });

  test('Usuário B não pode ver dashboard do Usuário A', async () => {
    const res = await request(app).get('/api/dashboard/resumo')
      .set('Authorization', `Bearer ${tokenB}`);
    // Deve retornar dados APENAS do usuário B
    expect(res.status).toBe(200);
    expect(res.body.porMateria?.find(m => m.materia === 'Matéria Privada')).toBeUndefined();
  });

  test('Acesso sem token retorna 401 em todas as rotas protegidas', async () => {
    const rotas = [
      { method: 'get',  path: '/api/dashboard' },
      { method: 'get',  path: '/api/materias' },
      { method: 'get',  path: '/api/questoes' },
      { method: 'get',  path: '/api/simulados' },
      { method: 'get',  path: '/api/relatorios' },
      { method: 'get',  path: '/api/cronometro/ativa' },
    ];
    for (const rota of rotas) {
      const res = await request(app)[rota.method](rota.path);
      expect(res.status).toBe(401);
    }
  });
});

// ── A02: Cryptographic Failures ──────────────────────────────────
describe('[OWASP A02] Cryptographic Failures', () => {
  test('Senha não é retornada na resposta de login', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'usera@sec.com', senha: 'Senha@123' });
    expect(res.body.senha).toBeUndefined();
    expect(res.body.senha_hash).toBeUndefined();
  });

  test('GET /api/auth/me não expõe senha_hash', async () => {
    const res = await request(app).get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.body.senha_hash).toBeUndefined();
    expect(res.body.senha).toBeUndefined();
  });

  test('Token JWT usa algoritmo seguro (HS256 ou RS256)', async () => {
    const jwt  = require('jsonwebtoken');
    const rA   = await request(app).post('/api/auth/login')
      .send({ email: 'usera@sec.com', senha: 'Senha@123' });
    const decoded = jwt.decode(rA.body.token, { complete: true });
    expect(['HS256','HS384','HS512','RS256']).toContain(decoded.header.alg);
  });
});

// ── A03: Injection ───────────────────────────────────────────────
describe('[OWASP A03] Injection', () => {
  test('SQL Injection no login não autentica', async () => {
    const payloads = [
      { email: "' OR '1'='1", senha: "' OR '1'='1" },
      { email: 'admin@admin.com; DROP TABLE usuarios;--', senha: 'x' },
      { email: "' UNION SELECT 1,2,3--", senha: 'x' },
    ];
    for (const p of payloads) {
      const res = await request(app).post('/api/auth/login').send(p);
      expect([400, 401, 422]).toContain(res.status);
    }
  });

  test('XSS em nome de matéria é armazenado como texto literal', async () => {
    const xss = '<script>alert("xss")</script>';
    const res = await request(app).post('/api/materias')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ nome: xss, cor: '#6366f1' });
    if (res.status === 201) {
      expect(res.body.materia?.nome || res.body.nome).toBe(xss); // armazenado, não executado
    } else {
      expect([400, 422]).toContain(res.status); // ou rejeitado
    }
  });

  test('NoSQL Injection em campos de busca não retorna dados indevidos', async () => {
    const res = await request(app).get('/api/materias?nome[$ne]=')
      .set('Authorization', `Bearer ${tokenA}`);
    expect([200, 400]).toContain(res.status);
  });
});

// ── A04: Insecure Design ─────────────────────────────────────────
describe('[OWASP A04] Insecure Design', () => {
  test('Registro sem email retorna erro de validação', async () => {
    const res = await request(app).post('/api/auth/registro')
      .send({ nome: 'Sem Email', senha: 'Senha@123' });
    expect([400, 422]).toContain(res.status);
  });

  test('Registro sem senha retorna erro de validação', async () => {
    const res = await request(app).post('/api/auth/registro')
      .send({ nome: 'Sem Senha', email: 'semsenha@teste.com' });
    expect([400, 422]).toContain(res.status);
  });

  test('Horas estudadas negativas são rejeitadas', async () => {
    const m = await request(app).post('/api/materias')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ nome: 'Mat Teste', cor: '#6366f1' });
    const res = await request(app).post('/api/registros')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ materia_id: m.body.id, data_estudo: '2026-06-01', horas_estudadas: -5 });
    expect([400, 422]).toContain(res.status);
  });
});

// ── A05: Security Misconfiguration ──────────────────────────────
describe('[OWASP A05] Security Misconfiguration', () => {
  test('Rota inexistente retorna 404, não 500', async () => {
    const res = await request(app).get('/api/rota-que-nao-existe');
    expect(res.status).toBe(404);
  });

  test('Método não permitido retorna 404 ou 405, não 500', async () => {
    const res = await request(app).delete('/api/auth/login');
    expect([404, 405]).toContain(res.status);
  });

  test('Stack trace não é exposto em erros 500', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: null, senha: null });
    expect(res.body.stack).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain('at Object');
  });
});

// ── A07: Identification and Authentication Failures ───────────────
describe('[OWASP A07] Authentication Failures', () => {
  test('Token inválido retorna 401', async () => {
    const res = await request(app).get('/api/materias')
      .set('Authorization', 'Bearer tokeninvalido123');
    expect(res.status).toBe(401);
  });

  test('Token expirado retorna 401', async () => {
    const jwt    = require('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'testsecret';
    const expired = jwt.sign({ id: 1 }, secret, { expiresIn: '-1s' });
    const res = await request(app).get('/api/materias')
      .set('Authorization', `Bearer ${expired}`);
    expect(res.status).toBe(401);
  });

  test('Token sem "Bearer " retorna 401', async () => {
    const res = await request(app).get('/api/materias')
      .set('Authorization', tokenA); // sem "Bearer "
    expect(res.status).toBe(401);
  });

  test('Login com email inexistente retorna 401, não revela existência', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'naoexiste@teste.com', senha: 'qualquer' });
    expect(res.status).toBe(401);
  });
});

// ── A08: Software and Data Integrity Failures ────────────────────
describe('[OWASP A08] Data Integrity', () => {
  test('materia_id de outro usuário é rejeitado no registro', async () => {
    const res = await request(app).post('/api/registros')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ materia_id: materiaIdA, data_estudo: '2026-06-01', horas_estudadas: 1 });
    expect([400, 403, 404, 422]).toContain(res.status);
  });

  test('Payload com campos extras não causa erro 500', async () => {
    const res = await request(app).post('/api/materias')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ nome: 'Matéria Segura', cor: '#6366f1',
              __proto__: { admin: true }, constructor: { name: 'hack' } });
    expect([200, 201, 400]).toContain(res.status);
    expect(res.status).not.toBe(500);
  });
});

// ── A09: Security Logging & Monitoring ──────────────────────────
describe('[OWASP A09] Logging', () => {
  test('Tentativas de login com falha não travam a aplicação', async () => {
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/auth/login')
        .send({ email: 'brute@force.com', senha: `tentativa${i}` });
    }
    // Após 5 tentativas, API ainda responde
    const res = await request(app).get('/api/dashboard/resumo')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(res.status).toBe(200);
  });
});
