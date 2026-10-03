import { app } from './app.js';

if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
  console.error('Missing env vars. Copy apps/backend/.env.example to apps/backend/.env.');
  process.exit(1);
}

const port = process.env.PORT ?? 4000;
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
