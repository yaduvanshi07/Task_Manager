const request = require('supertest');
const app = require('../src/app');

describe('Authentication Tests', () => {
  let authToken;

  test('POST /api/auth/register - should create a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('test@example.com');
    expect(response.body.token).toBeDefined();
  });

  test('POST /api/auth/login - should authenticate user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'password'
      });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('admin@test.com');
    expect(response.body.token).toBeDefined();
    
    authToken = response.body.token;
  });

  test('POST /api/auth/login - should reject invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@test.com',
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid credentials');
  });

  test('GET /api/users/me - should return current user info', async () => {
    const response = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('admin@test.com');
  });

  test('GET /api/users/me - should reject requests without token', async () => {
    const response = await request(app)
      .get('/api/users/me');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Access token required');
  });
});