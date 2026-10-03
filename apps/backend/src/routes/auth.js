import { Router } from 'express';
import { pool, USER_FIELDS } from '../db.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { validate } from '@roxiler/shared';
import { requireAuth, signToken } from '../middleware/auth.js';

export const authRouter = Router();

authRouter.post('/signup', async (req, res) => {
  const { errors, values } = validate(req.body, ['name', 'email', 'address', 'password']);
  if (errors) return res.status(400).json({ errors });

  const { rows: [user] } = await pool.query(
    `INSERT INTO users (name, email, address, password_hash)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (email) DO NOTHING
     RETURNING ${USER_FIELDS}`,
    [values.name, values.email, values.address, await hashPassword(values.password)],
  );
  if (!user) return res.status(409).json({ errors: { email: 'This email is already registered.' } });

  res.status(201).json({ token: signToken(user), user });
});

authRouter.post('/login', async (req, res) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const { rows: [user] } = await pool.query(
    `SELECT ${USER_FIELDS}, password_hash FROM users WHERE email = $1`,
    [email.trim().toLowerCase()],
  );
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  delete user.password_hash;
  res.json({ token: signToken(user), user });
});

authRouter.get('/me', requireAuth, async (req, res) => {
  const { rows: [user] } = await pool.query(`SELECT ${USER_FIELDS} FROM users WHERE id = $1`, [req.user.id]);
  if (!user) return res.status(401).json({ error: 'Please log in.' });
  res.json({ user });
});

authRouter.patch('/password', requireAuth, async (req, res) => {
  const { current_password, new_password } = req.body ?? {};
  const { errors, values } = validate({ password: new_password }, ['password']);
  if (errors) return res.status(400).json({ errors: { new_password: errors.password } });

  const { rows: [user] } = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  if (!user) return res.status(401).json({ error: 'Please log in.' });
  if (typeof current_password !== 'string' || !(await verifyPassword(current_password, user.password_hash))) {
    return res.status(400).json({ errors: { current_password: 'Current password is wrong.' } });
  }

  await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [await hashPassword(values.password), req.user.id]);
  res.json({ message: 'Password updated.' });
});
