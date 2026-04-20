const request = require('supertest');
const app = require('../app');

describe('Qualidade de Software - Testes de Integração', () => {
  it('Deve verificar se a API está online e respondendo na rota raiz', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.body.mensagem).toBeDefined();
  });

  it('Deve carregar a lista de professores do banco SQLite', async () => {
    const res = await request(app).get('/api/professores');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});