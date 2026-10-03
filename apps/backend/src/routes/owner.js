import { Router } from 'express';
import { pool } from '../db.js';
import { listQuery } from '../utils/listing.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const ownerRouter = Router();
ownerRouter.use(requireAuth, requireRole('owner'));

const RATERS = `
  SELECT u.id, u.name, u.email, r.score, r.updated_at
  FROM ratings r
  JOIN users u ON u.id = r.user_id
  WHERE r.store_id = $1`;

ownerRouter.get('/dashboard', async (req, res) => {
  const { rows: [store] } = await pool.query(
    `SELECT s.id, s.name, s.address,
            ROUND(AVG(r.score), 1)::float AS rating, COUNT(r.id)::int AS rating_count
     FROM stores s
     LEFT JOIN ratings r ON r.store_id = s.id
     WHERE s.owner_id = $1
     GROUP BY s.id`,
    [req.user.id],
  );
  if (!store) return res.json({ store: null, raters: [] });

  const { rows: raters } = await pool.query(...listQuery(RATERS, [store.id], req.query, {
    sortable: { updated_at: 'updated_at', name: 'lower(name)', email: 'email', score: 'score' },
  }));
  res.json({ store, raters });
});
