import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { pool } from '../src/db.js';
import { email, goodUser, run, startApp } from './helpers.js';

let api;
let admin;
let alice;
let bob;
let owner;
let alpha;
let beta;

const ownerUser = { ...goodUser('owner'), name: 'Testing Store Owner Account' };

before(async () => {
  api = await startApp();
  admin = await api.adminToken();
  alice = (await api.call('POST', '/api/auth/signup', { ...goodUser('alice'), name: 'Alice Testing Normal User' })).body.token;
  bob = (await api.call('POST', '/api/auth/signup', { ...goodUser('bob'), name: 'Bob Testing Normal User Here' })).body.token;
});
after(() => api.stop());

test('each role only reaches its own routes', async () => {
  assert.equal((await api.call('GET', '/api/admin/dashboard')).status, 401);
  assert.equal((await api.call('GET', '/api/admin/dashboard', null, alice)).status, 403);
  assert.equal((await api.call('GET', '/api/owner/dashboard', null, alice)).status, 403);
  assert.equal((await api.call('GET', '/api/stores', null, admin)).status, 403);
  assert.equal((await api.call('GET', '/api/stores', null, alice)).status, 200);
});

test('admin dashboard shows real totals as numbers', async () => {
  const { status, body } = await api.call('GET', '/api/admin/dashboard', null, admin);
  const { rows: [db] } = await pool.query(
    'SELECT (SELECT count(*) FROM users)::int AS users, (SELECT count(*) FROM stores)::int AS stores, (SELECT count(*) FROM ratings)::int AS ratings',
  );
  assert.equal(status, 200);
  assert.deepEqual(body, db);
});

test('admin adds users with any role', async () => {
  const created = await api.call('POST', '/api/admin/users', { ...ownerUser, role: 'owner' }, admin);
  assert.equal(created.status, 201);
  assert.equal(created.body.user.role, 'owner');
  assert.equal(created.body.user.password_hash, undefined);

  const login = await api.call('POST', '/api/auth/login', { email: ownerUser.email, password: ownerUser.password });
  assert.equal(login.status, 200);
  owner = { token: login.body.token, id: login.body.user.id };

  const badRole = await api.call('POST', '/api/admin/users', { ...goodUser('badrole'), role: 'boss' }, admin);
  assert.equal(badRole.status, 400);
  assert.ok(badRole.body.errors.role);

  const invalid = await api.call('POST', '/api/admin/users', { name: 'x', email: 'x', address: '', password: 'x', role: 'user' }, admin);
  assert.deepEqual(Object.keys(invalid.body.errors).sort(), ['address', 'email', 'name', 'password']);

  const dup = await api.call('POST', '/api/admin/users', { ...ownerUser, role: 'user' }, admin);
  assert.equal(dup.status, 409);
});

test('admin adds stores and links an owner', async () => {
  const store = (tag, extra) => ({ name: `${run} ${tag}`, email: email(tag), address: '5 Market Road', ...extra });

  const aliceId = (await api.call('GET', '/api/auth/me', null, alice)).body.user.id;
  const notOwner = await api.call('POST', '/api/admin/stores', store('x', { owner_id: aliceId }), admin);
  assert.equal(notOwner.status, 400);
  assert.ok(notOwner.body.errors.owner_id);

  const missingOwner = await api.call('POST', '/api/admin/stores', store('y', { owner_id: 999999999 }), admin);
  assert.equal(missingOwner.status, 400);

  const wrongType = await api.call('POST', '/api/admin/stores', store('z', { owner_id: [owner.id] }), admin);
  assert.equal(wrongType.status, 400);

  const a = await api.call('POST', '/api/admin/stores', store('alpha', { owner_id: owner.id }), admin);
  assert.equal(a.status, 201);
  alpha = a.body.store;
  assert.equal(alpha.owner_id, owner.id);

  const b = await api.call('POST', '/api/admin/stores', { ...store('beta'), name: 'Beta Mart' }, admin);
  assert.equal(b.status, 201);
  beta = b.body.store;

  const sameOwner = await api.call('POST', '/api/admin/stores', store('gamma', { owner_id: owner.id }), admin);
  assert.equal(sameOwner.status, 409);
  assert.ok(sameOwner.body.errors.owner_id);

  const sameEmail = await api.call('POST', '/api/admin/stores', { ...store('alpha'), name: 'Other' }, admin);
  assert.equal(sameEmail.status, 409);
  assert.ok(sameEmail.body.errors.email);
});

test('rating input is checked', async () => {
  for (const score of [0, 6, 3.5, '4', null]) {
    assert.equal((await api.call('PUT', `/api/stores/${alpha.id}/rating`, { score }, alice)).status, 400, String(score));
  }
  assert.equal((await api.call('PUT', '/api/stores/999999999/rating', { score: 4 }, alice)).status, 404);
  assert.equal((await api.call('PUT', '/api/stores/abc/rating', { score: 4 }, alice)).status, 404);
  assert.equal((await api.call('PUT', '/api/stores/99999999999/rating', { score: 4 }, alice)).status, 404);
});

test('users submit and change ratings; averages update', async () => {
  assert.equal((await api.call('PUT', `/api/stores/${alpha.id}/rating`, { score: 4 }, alice)).status, 200);
  assert.equal((await api.call('PUT', `/api/stores/${alpha.id}/rating`, { score: 2 }, bob)).status, 200);
  const changed = await api.call('PUT', `/api/stores/${alpha.id}/rating`, { score: 5 }, alice);
  assert.equal(changed.status, 200);
  assert.equal(changed.body.rating.score, 5);

  const { rows: [{ count }] } = await pool.query('SELECT count(*)::int FROM ratings WHERE store_id = $1', [alpha.id]);
  assert.equal(count, 2, 'changing a rating must not add a row');

  const { body } = await api.call('GET', `/api/stores?name=${encodeURIComponent(run)}`, null, alice);
  const a = body.stores.find((s) => s.id === alpha.id);
  assert.equal(a.rating, 3.5);
  assert.equal(a.my_rating, 5);
  assert.equal(a.email, undefined, 'normal users see name and address only');
});

test('users search stores by name and address, and sort', async () => {
  const byName = await api.call('GET', `/api/stores?name=${encodeURIComponent(`${run} ALPHA`)}`, null, bob);
  assert.deepEqual(byName.body.stores.map((s) => s.id), [alpha.id]);

  const byAddress = await api.call('GET', `/api/stores?name=${run}&address=market`, null, bob);
  assert.equal(byAddress.body.stores.length, 1);

  const all = await api.call('GET', '/api/stores?address=5%20Market%20Road&sort=rating&order=desc', null, bob);
  const ours = all.body.stores.filter((s) => s.id === alpha.id || s.id === beta.id);
  assert.deepEqual(ours.map((s) => s.id), [alpha.id, beta.id]);
  assert.equal(ours[1].rating, null);
  assert.equal(ours[1].my_rating, null);
});

test('search text is literal, and bad sort input is ignored', async () => {
  const pct = await api.call('GET', '/api/stores?name=%25', null, bob);
  assert.equal(pct.status, 200);
  assert.ok(pct.body.stores.every((s) => s.name.includes('%')));
  const under = await api.call('GET', '/api/stores?name=_', null, bob);
  assert.ok(under.body.stores.every((s) => s.name.includes('_')));

  const evil = await api.call('GET', `/api/stores?sort=${encodeURIComponent('name; DROP TABLE users')}&order=sideways`, null, bob);
  assert.equal(evil.status, 200);
});

test('owner dashboard shows average rating and who rated', async () => {
  const { status, body } = await api.call('GET', '/api/owner/dashboard?sort=score&order=desc', null, owner.token);
  assert.equal(status, 200);
  assert.equal(body.store.id, alpha.id);
  assert.equal(body.store.rating, 3.5);
  assert.equal(body.store.rating_count, 2);
  assert.deepEqual(body.raters.map((r) => [r.email, r.score]), [[email('alice'), 5], [email('bob'), 2]]);
  assert.equal(body.raters[0].password_hash, undefined);
});

test('owner without a store gets an empty dashboard', async () => {
  const lonely = { ...goodUser('lonely'), name: 'Lonely Store Owner Account', role: 'owner' };
  await api.call('POST', '/api/admin/users', lonely, admin);
  const token = (await api.call('POST', '/api/auth/login', { email: lonely.email, password: lonely.password })).body.token;
  const { status, body } = await api.call('GET', '/api/owner/dashboard', null, token);
  assert.equal(status, 200);
  assert.deepEqual(body, { store: null, raters: [] });
});

test('admin lists stores with filters, sorting and rating', async () => {
  const { status, body } = await api.call('GET', `/api/admin/stores?email=${run}&sort=rating&order=desc`, null, admin);
  assert.equal(status, 200);
  assert.deepEqual(body.stores.map((s) => s.id), [alpha.id, beta.id]);
  assert.equal(body.stores[0].rating, 3.5);
  assert.equal(body.stores[0].email, email('alpha'));

  const byName = await api.call('GET', '/api/admin/stores?name=beta%20mart', null, admin);
  assert.ok(byName.body.stores.some((s) => s.id === beta.id));
});

test('admin lists users with filters and sorting', async () => {
  const owners = await api.call('GET', `/api/admin/users?email=${run}&role=owner`, null, admin);
  assert.deepEqual(owners.body.users.map((u) => u.email).sort(), [email('lonely'), email('owner')]);

  const lower = { ...goodUser('lowercase'), name: 'aaa lowercase testing user', role: 'user' };
  await api.call('POST', '/api/admin/users', lower, admin);
  const sorted = await api.call('GET', `/api/admin/users?email=${run}&sort=name&order=DESC`, null, admin);
  const names = sorted.body.users.map((u) => u.name.toLowerCase());
  assert.deepEqual(names, [...names].sort().reverse());
  assert.equal(names.at(-1), 'aaa lowercase testing user');
  assert.ok(sorted.body.users.every((u) => u.password_hash === undefined));

  const byAddress = await api.call('GET', `/api/admin/users?email=${run}&address=test%20street`, null, admin);
  assert.ok(byAddress.body.users.length >= 4);
});

test('admin user details include rating for store owners', async () => {
  const o = await api.call('GET', `/api/admin/users/${owner.id}`, null, admin);
  assert.equal(o.status, 200);
  assert.equal(o.body.user.rating, 3.5);
  assert.equal(o.body.user.password_hash, undefined);

  const me = await api.call('GET', '/api/auth/me', null, alice);
  const u = await api.call('GET', `/api/admin/users/${me.body.user.id}`, null, admin);
  assert.equal(u.body.user.rating, null);

  assert.equal((await api.call('GET', '/api/admin/users/999999999', null, admin)).status, 404);
  assert.equal((await api.call('GET', '/api/admin/users/abc', null, admin)).status, 404);
});
