const request = require('supertest');
const app     = require('../index');

describe('GET /health', () => {
  afterAll(async () => {
    // Allow open handles (DB, Redis) to close gracefully
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  it('returns 200 and healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.timestamp).toBeDefined();
  });
});
