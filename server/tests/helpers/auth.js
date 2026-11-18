import request from 'supertest';

let counter = 0;

/** Registers a fresh user and returns a cookie-carrying Supertest agent. */
export async function createAuthedAgent(app, overrides = {}) {
  counter += 1;
  const agent = request.agent(app);
  const res = await agent.post('/api/auth/register').send({
    name: `User ${counter}`,
    email: `user${counter}@example.com`,
    password: 'correct-horse-1',
    ...overrides,
  });
  if (res.status !== 201) throw new Error(`Registration failed: ${JSON.stringify(res.body)}`);
  return { agent, user: res.body.user };
}
