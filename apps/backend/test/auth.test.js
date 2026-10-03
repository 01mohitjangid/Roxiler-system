import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { pool } from '../src/db.js';
import { requireAuth, requireRole } from '../src/middleware/auth.js';
import { email, goodUser, startApp } from './helpers.js';

let api;
before(async () => {
  api = await startApp();
});
after(() => api.stop());

test('signup creates a normal user and returns a token', async () => {
  const { status, body } = await api.call('POST', '/api/auth/signup', goodUser('signup'));
  assert.equal(status, 201);
  assert.ok(body.token);
  assert.equal(body.user.role, 'user');
  assert.equal(body.user.email, email('signup'));
  assert.equal(body.user.password_hash, undefined);
});

test('signup ignores a role sent by the client', async () => {
  const { status, body } = await api.call('POST', '/api/auth/signup', { ...goodUser('sneaky'), role: 'admin' });
  assert.equal(status, 201);
  assert.equal(body.user.role, 'user');
});

test('signup rejects every invalid field', async () => {
  const { status, body } = await api.call('POST', '/api/auth/signup', {
    name: 'Abc',
    email: 'not-an-email',
    address: 'a'.repeat(401),
    password: 'nouppercase1!',
  });
  assert.equal(status, 400);
  assert.deepEqual(Object.keys(body.errors).sort(), ['address', 'email', 'name', 'password']);
});

test('password rules: length, uppercase and special character', async () => {
  for (const password of ['Ab@1', 'Abcdefgh@12345678', 'abcdefg@1', 'Abcdefgh1']) {
    const { status, body } = await api.call('POST', '/api/auth/signup', { ...goodUser('pw'), password });
    assert.equal(status, 400, password);
    assert.ok(body.errors.password, password);
  }
});

test('signup rejects a missing body and non-string fields', async () => {
  const res = await fetch(`${api.base}/api/auth/signup`, { method: 'POST' });
  assert.equal(res.status, 400);
  const { status } = await api.call('POST', '/api/auth/signup', { ...goodUser('types'), name: 12345 });
  assert.equal(status, 400);
});

test('signup rejects a duplicate email, ignoring case', async () => {
  await api.call('POST', '/api/auth/signup', goodUser('dup'));
  const { status } = await api.call('POST', '/api/auth/signup', {
    ...goodUser('dup'),
    email: email('dup').toUpperCase(),
  });
  assert.equal(status, 409);
});

test('login works with the right password only', async () => {
  await api.call('POST', '/api/auth/signup', goodUser('login'));

  const ok = await api.call('POST', '/api/auth/login', { email: email('login').toUpperCase(), password: 'Secret@123' });
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token);
  assert.equal(ok.body.user.password_hash, undefined);

  const wrong = await api.call('POST', '/api/auth/login', { email: email('login'), password: 'Wrong@123' });
  assert.equal(wrong.status, 401);

  const unknown = await api.call('POST', '/api/auth/login', { email: email('nobody'), password: 'Secret@123' });
  assert.equal(unknown.status, 401);
  assert.equal(unknown.body.error, wrong.body.error);
});

test('/me needs a valid token', async () => {
  const { body } = await api.call('POST', '/api/auth/signup', goodUser('me'));

  const me = await api.call('GET', '/api/auth/me', null, body.token);
  assert.equal(me.status, 200);
  assert.equal(me.body.user.email, email('me'));

  assert.equal((await api.call('GET', '/api/auth/me')).status, 401);
  assert.equal((await api.call('GET', '/api/auth/me', null, 'garbage')).status, 401);
});

test('password change needs the current password and a valid new one', async () => {
  const { body } = await api.call('POST', '/api/auth/signup', goodUser('change'));
  const token = body.token;

  const wrongCurrent = await api.call('PATCH', '/api/auth/password', { current_password: 'Nope@1234', new_password: 'Newpass@123' }, token);
  assert.equal(wrongCurrent.status, 400);
  assert.ok(wrongCurrent.body.errors.current_password);

  const weakNew = await api.call('PATCH', '/api/auth/password', { current_password: 'Secret@123', new_password: 'weak' }, token);
  assert.equal(weakNew.status, 400);

  const ok = await api.call('PATCH', '/api/auth/password', { current_password: 'Secret@123', new_password: 'Newpass@123' }, token);
  assert.equal(ok.status, 200);

  assert.equal((await api.call('POST', '/api/auth/login', { email: email('change'), password: 'Secret@123' })).status, 401);
  assert.equal((await api.call('POST', '/api/auth/login', { email: email('change'), password: 'Newpass@123' })).status, 200);

  assert.equal((await api.call('PATCH', '/api/auth/password', { current_password: 'x', new_password: 'y' })).status, 401);
});

test('requireRole lets the right role in and blocks others', async () => {
  const guarded = express();
  guarded.get('/admin-only', requireAuth, requireRole('admin'), (req, res) => res.json({ ok: true }));
  const s = guarded.listen(0);
  await new Promise((resolve) => s.once('listening', resolve));
  const url = `http://localhost:${s.address().port}/admin-only`;

  const userToken = (await api.call('POST', '/api/auth/signup', goodUser('role'))).body.token;
  const adminToken = await api.adminToken();

  const asUser = await fetch(url, { headers: { Authorization: `Bearer ${userToken}` } });
  const asAdmin = await fetch(url, { headers: { Authorization: `Bearer ${adminToken}` } });
  await new Promise((resolve) => s.close(resolve));

  assert.equal(asUser.status, 403);
  assert.equal(asAdmin.status, 200);
});

test('emoji count as one character each, matching the database', async () => {
  const { status, body } = await api.call('POST', '/api/auth/signup', { ...goodUser('emoji'), name: '😀'.repeat(15) });
  assert.equal(status, 400);
  assert.ok(body.errors.name);
});

test('a deleted or demoted user loses access at once', async () => {
  const { body } = await api.call('POST', '/api/auth/signup', goodUser('gone'));
  const guarded = express();
  guarded.get('/admin-only', requireAuth, requireRole('admin'), (req, res) => res.json({ ok: true }));
  const s = guarded.listen(0);
  await new Promise((resolve) => s.once('listening', resolve));
  const url = `http://localhost:${s.address().port}/admin-only`;
  const hit = () => fetch(url, { headers: { Authorization: `Bearer ${body.token}` } }).then((r) => r.status);

  await pool.query(`UPDATE users SET role = 'admin' WHERE id = $1`, [body.user.id]);
  const asAdmin = await hit();
  await pool.query(`UPDATE users SET role = 'user' WHERE id = $1`, [body.user.id]);
  const demoted = await hit();
  await pool.query('DELETE FROM users WHERE id = $1', [body.user.id]);
  const deleted = await hit();
  await new Promise((resolve) => s.close(resolve));

  assert.equal(asAdmin, 200);
  assert.equal(demoted, 403);
  assert.equal(deleted, 401);
});

test('a NUL character is a 400, not a server error', async () => {
  const signup = await api.call('POST', '/api/auth/signup', { ...goodUser('nul'), address: 'bad\u0000address' });
  const login = await api.call('POST', '/api/auth/login', { email: 'a\u0000@x.com', password: 'Secret@123' });
  assert.equal(signup.status, 400);
  assert.equal(login.status, 400);
});

test('unknown API routes return JSON 404', async () => {
  const { status, body } = await api.call('GET', '/api/nope');
  assert.equal(status, 404);
  assert.ok(body.error);
});
