import { Router } from 'express';
import { pool } from '../db.js';
import { isScore, toId } from '@roxiler/shared';
import { listQuery } from '../utils/listing.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

export const storesRouter = Router();
storesRouter.use(requireAuth, requireRole('user'));

const STORES = `
  SELECT s.id, s.name, s.address,
         ROUND(AVG(r.score), 1)::float AS rating,
         MAX(r.score) FILTER (WHERE r.user_id = $1) AS my_rating
  FROM stores s
  LEFT JOIN ratings r ON r.store_id = s.id
  GROUP BY s.id`;

storesRouter.get('/', async (req, res) => {
  const { rows } = await pool.query(...listQuery(STORES, [req.user.id], req.query, {
    search: { name: 'name', address: 'address' },
    sortable: { name: 'lower(name)', address: 'lower(address)', rating: 'rating', my_rating: 'my_rating' },
  }));
  res.json({ stores: rows });
});

storesRouter.put('/:id/rating', async (req, res) => {
  const storeId = toId(req.params.id);
  if (!storeId) return res.status(404).json({ error: 'Store not found.' });
  const score = req.body?.score;
  if (!isScore(score)) return res.status(400).json({ errors: { score: 'Rating must be a whole number from 1 to 5.' } });

  const { rows: [rating] } = await pool.query(
    `INSERT INTO ratings (user_id, store_id, score)
     SELECT $1, id, $3 FROM stores WHERE id = $2
     ON CONFLICT (user_id, store_id) DO UPDATE SET score = EXCLUDED.score, updated_at = now()
     RETURNING store_id, score`,
    [req.user.id, storeId, score],
  );
  if (!rating) return res.status(404).json({ error: 'Store not found.' });
  res.json({ rating });
});
