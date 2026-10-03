const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const len = (v) => [...v].length;

const rules = {
  name: (v) => (len(v) < 20 || len(v) > 60) && 'Name must be 20 to 60 characters.',
  storeName: (v) => (!v || len(v) > 60) && 'Store name is required and must be at most 60 characters.',
  email: (v) => (!EMAIL.test(v) || v.length > 255) && 'Enter a valid email address.',
  address: (v) => (!v || len(v) > 400) && 'Address is required and must be at most 400 characters.',
  password: (v) =>
    (len(v) < 8 || len(v) > 16 || !/[A-Z]/.test(v) || !/[^A-Za-z0-9\s]/.test(v)) &&
    'Password must be 8 to 16 characters with one uppercase letter and one special character.',
  role: (v) => !['admin', 'user', 'owner'].includes(v) && 'Role must be admin, user or owner.',
};


export function validate(body, fields, ruleFor = {}) {
  const errors = {};
  const values = {};
  for (const field of fields) {
    const raw = body?.[field];
    if (typeof raw !== 'string') {
      errors[field] = `${field[0].toUpperCase()}${field.slice(1)} is required.`;
      continue;
    }
    const rule = ruleFor[field] ?? field;
    const value = rule === 'password' ? raw : raw.trim();
    const error = rules[rule](value);
    if (error) errors[field] = error;
    else values[field] = field === 'email' ? value.toLowerCase() : value;
  }
  return { errors: Object.keys(errors).length ? errors : null, values };
}

export const toId = (v) => (/^\d{1,9}$/.test(v) ? Number(v) : null);

export const isScore = (v) => Number.isInteger(v) && v >= 1 && v <= 5;
