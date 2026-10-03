import jwt from 'jsonwebtoken';
import { pool } from '../db.js';


export function signToken(user) {
  return jwt.sign({ sub: String(user.id) }, process.env.JWT_SECRET, { expiresIn: '1d' });
}

export async function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Please log in.' });

  let id;
  try {
    id = Number(jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] }).sub);
  } catch {
    return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
  }

  const { rows: [user] } = Number.isInteger(id)
    ? await pool.query('SELECT id, role FROM users WHERE id = $1', [id])
    : { rows: [] };
  if (!user) return res.status(401).json({ error: 'Please log in.' });

  req.user = user;
  next();
}

export const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role) ? next() : res.status(403).json({ error: 'You do not have access to this.' });
