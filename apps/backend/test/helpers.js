import { once } from 'node:events';
import { app } from '../src/app.js';
import { pool } from '../src/db.js';
import { hashPassword } from '../src/utils/password.js';

export const run = `t${Date.now()}`;
export const email = (tag) => `${run}-${tag}@test.local`;
export const goodUser = (tag) => ({
  name: 'Testing Normal User Account',
  email: email(tag),
  address: '12 Test Street',
  password: 'Secret@123',
});

export async function startApp() {
  const server = app.listen(0);
  await once(server, 'listening');
  const base = `http://localhost:${server.address().port}`;

  async function call(method, path, body, token) {
    const res = await fetch(base + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...(body && { body: JSON.stringify(body) }),
    });
    return { status: res.status, body: await res.json() };
  }

  async function stop() {
    await pool.query('DELETE FROM stores WHERE email LIKE $1', [`${run}-%`]);
    await pool.query('DELETE FROM users WHERE email LIKE $1', [`${run}-%`]);
    server.close();
    await pool.end();
  }

  async function adminToken() {
    const admin = { ...goodUser('admin'), name: 'Testing Admin User Account' };
    await pool.query(
      `INSERT INTO users (name, email, address, password_hash, role) VALUES ($1, $2, $3, $4, 'admin')
       ON CONFLICT (email) DO NOTHING`,
      [admin.name, admin.email, admin.address, await hashPassword(admin.password)],
    );
    return (await call('POST', '/api/auth/login', { email: admin.email, password: admin.password })).body.token;
  }

  return { base, call, stop, adminToken };
}
