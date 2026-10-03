import { Router } from 'express';
import { pool, USER_FIELDS } from '../db.js';
import { hashPassword } from '../utils/password.js';
import { validate, toId } from '@roxiler/shared';
import { listQuery } from '../utils/listing.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('admin'));

const USERS = `
  SELECT u.id, u.name, u.email, u.address, u.role, s.id AS store_id, ROUND(AVG(r.score), 1)::float AS rating
  FROM users u
  LEFT JOIN stores s ON s.owner_id = u.id
  LEFT JOIN ratings r ON r.store_id = s.id
  GROUP BY u.id, s.id`;

const STORES = `
  SELECT s.id, s.name, s.email, s.address, s.owner_id,
         ROUND(AVG(r.score), 1)::float AS rating, COUNT(r.id)::int AS rating_count
  FROM stores s
  LEFT JOIN ratings r ON r.store_id = s.id
  GROUP BY s.id`;

adminRouter.get('/dashboard', async (req, res) => {
  const { rows: [counts] } = await pool.query(`
    SELECT (SELECT count(*) FROM users)::int   AS users,
           (SELECT count(*) FROM stores)::int  AS stores,
           (SELECT count(*) FROM ratings)::int AS ratings`);
  res.json(counts);
});

adminRouter.get('/users', async (req, res) => {
  const { rows } = await pool.query(...listQuery(USERS, [], req.query, {
    search: { name: 'name', email: 'email', address: 'address' },
    exact: { role: 'role' },
    sortable: { name: 'lower(name)', email: 'email', address: 'lower(address)', role: 'role', rating: 'rating' },
  }));
  res.json({ users: rows });
});

adminRouter.get('/users/:id', async (req, res) => {
  const { rows: [user] } = await pool.query(`SELECT * FROM (${USERS}) AS t WHERE id = $1`, [toId(req.params.id)]);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  res.json({ user });
});

adminRouter.post('/users', async (req, res) => {
  const { errors, values } = validate(req.body, ['name', 'email', 'address', 'password', 'role']);
  if (errors) return res.status(400).json({ errors });

  const { rows: [user] } = await pool.query(
    `INSERT INTO users (name, email, address, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (email) DO NOTHING
     RETURNING ${USER_FIELDS}`,
    [values.name, values.email, values.address, await hashPassword(values.password), values.role],
  );
  if (!user) return res.status(409).json({ errors: { email: 'This email is already registered.' } });
  res.status(201).json({ user });
});

adminRouter.get('/stores', async (req, res) => {
  const { rows } = await pool.query(...listQuery(STORES, [], req.query, {
    search: { name: 'name', email: 'email', address: 'address' },
    sortable: { name: 'lower(name)', email: 'email', address: 'lower(address)', rating: 'rating' },
  }));
  res.json({ stores: rows });
});

adminRouter.post('/stores', async (req, res) => {
  const { errors, values } = validate(req.body, ['name', 'email', 'address'], { name: 'storeName' });
  const rawOwner = req.body?.owner_id;
  const hasOwner = rawOwner != null && rawOwner !== '';
  const ownerId = ['number', 'string'].includes(typeof rawOwner) ? toId(String(rawOwner)) : null;
  if (hasOwner) {
    const { rows: [owner] } = await pool.query('SELECT role FROM users WHERE id = $1', [ownerId]);
    if (owner?.role !== 'owner') {
      return res.status(400).json({ errors: { ...errors, owner_id: 'Choose a user with the store owner role.' } });
    }
  }
  if (errors) return res.status(400).json({ errors });

  try {
    const { rows: [store] } = await pool.query(
      `INSERT INTO stores (name, email, address, owner_id) VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, address, owner_id`,
      [values.name, values.email, values.address, hasOwner ? ownerId : null],
    );
    res.status(201).json({ store });
  } catch (err) {
    if (err.constraint === 'stores_email_key') {
      return res.status(409).json({ errors: { email: 'A store with this email already exists.' } });
    }
    if (err.constraint === 'stores_owner_id_key') {
      return res.status(409).json({ errors: { owner_id: 'This owner already has a store.' } });
    }
    throw err;
  }
});
