import express from 'express';
import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';
import { storesRouter } from './routes/stores.js';
import { ownerRouter } from './routes/owner.js';

export const app = express();

app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/stores', storesRouter);
app.use('/api/owner', ownerRouter);

app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

app.use((err, req, res, _next) => {
  if (err.status >= 400 && err.status < 500) return res.status(err.status).json({ error: err.message });
  if (err.code === '22021') return res.status(400).json({ error: 'Input contains invalid characters.' });
  console.error(err.stack ?? String(err));
  res.status(500).json({ error: 'Something went wrong.' });
});
