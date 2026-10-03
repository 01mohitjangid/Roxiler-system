import pg from 'pg';

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

pool.on('error', (err) => console.error('Postgres pool error:', err.message));

export const USER_FIELDS = 'id, name, email, address, role';
