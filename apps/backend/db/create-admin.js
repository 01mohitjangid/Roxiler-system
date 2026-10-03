import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { validate } from '@roxiler/shared';
import { pool, USER_FIELDS } from '../src/db.js';
import { hashPassword } from '../src/utils/password.js';

const rl = createInterface({ input: stdin });
const lines = rl[Symbol.asyncIterator]();
async function ask(question) {
  stdout.write(question);
  const { value, done } = await lines.next();
  if (done) {
    console.error('\nStopped before all details were entered.');
    process.exit(1);
  }
  return value;
}
const fields = [
  ['name', 'Full name (20-60 characters): '],
  ['email', 'Email: '],
  ['address', 'Address: '],
  ['password', 'Password (8-16, one uppercase, one special): '],
];

const answers = {};
for (const [field, question] of fields) {
  for (;;) {
    answers[field] = await ask(question);
    const { errors } = validate(answers, [field]);
    if (!errors) break;
    console.log(`  ${errors[field]}`);
  }
}
rl.close();

const { values } = validate(answers, fields.map(([f]) => f));
try {
  const { rows: [admin] } = await pool.query(
    `INSERT INTO users (name, email, address, password_hash, role)
     VALUES ($1, $2, $3, $4, 'admin')
     ON CONFLICT (email) DO NOTHING
     RETURNING ${USER_FIELDS}`,
    [values.name, values.email, values.address, await hashPassword(values.password)],
  );
  console.log(admin ? `Admin created: ${admin.email}` : `A user with ${values.email} already exists.`);
  if (!admin) process.exitCode = 1;
} finally {
  await pool.end();
}
