/**
 * Testes unitários - Serviço de cron com mock do banco
 * Não requer conexão real com o banco de dados
 */

// Mock do módulo de banco para isolar o teste
jest.mock('../../src/utils/db', () => ({
  query: jest.fn()
}));

// Mock do node-cron para não executar agendamentos reais
jest.mock('node-cron', () => ({
  schedule: jest.fn()
}));

const { query }              = require('../../src/utils/db');
const { gerarLembretes }     = require('../../src/services/cronService');

describe('cronService - gerarLembretes', () => {

  beforeEach(() => {
    jest.clearAllMocks();  // Limpar mocks entre testes
  });

  it('deve criar notificações para usuários sem registro hoje', async () => {
    // Simular: 2 usuários sem registro hoje
    query
      .mockResolvedValueOnce({
        rows: [
          { id: 1, nome: 'Alice' },
          { id: 2, nome: 'Bob' }
        ]
      })
      // Simular INSERT de notificação para Alice
      .mockResolvedValueOnce({ rows: [] })
      // Simular INSERT de notificação para Bob
      .mockResolvedValueOnce({ rows: [] });

    await gerarLembretes();

    // Deve ter chamado query 3x: 1 SELECT + 2 INSERTs
    expect(query).toHaveBeenCalledTimes(3);  // 1 SELECT + 2 INSERTs

    // Verificar que o INSERT inclui "lembrete"
    const insertCall = query.mock.calls[1];
    expect(insertCall[0]).toContain('INSERT INTO notificacoes');
    expect(insertCall[1][0]).toBe(1);   // usuario_id = 1 (Alice)
    // tipo é hardcoded na query SQL, não é parâmetro
  });

  it('não deve criar notificações quando todos já registraram', async () => {
    // Simular: nenhum usuário pendente
    query.mockResolvedValueOnce({ rows: [] });

    await gerarLembretes();

    // Apenas 1 SELECT, nenhum INSERT
    expect(query).toHaveBeenCalledTimes(1);
  });

  it('deve lidar com erro do banco sem lançar exceção', async () => {
    // Simular erro no banco
    query.mockRejectedValueOnce(new Error('Conexão recusada'));

    // Não deve lançar, deve tratar internamente
    await expect(gerarLembretes()).resolves.not.toThrow();
  });
});
