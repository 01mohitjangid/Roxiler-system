export function listQuery(inner, params, query, { search = {}, exact = {}, sortable }) {
  const values = [...params];
  const where = [];
  const add = (column, op, value) => {
    values.push(value);
    where.push(`${column} ${op} $${values.length}`);
  };

  for (const [param, column] of Object.entries(search)) {
    const v = query[param];
    if (typeof v === 'string' && v.trim()) add(column, 'ILIKE', `%${v.trim().replace(/[\\%_]/g, '\\$&')}%`);
  }
  for (const [param, column] of Object.entries(exact)) {
    const v = query[param];
    if (typeof v === 'string' && v) add(column, '=', v);
  }

  const sort = Object.hasOwn(sortable, query.sort) ? sortable[query.sort] : Object.values(sortable)[0];
  const order = String(query.order).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  return [
    `SELECT * FROM (${inner}) AS t
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY ${sort} ${order} NULLS LAST, id`,
    values,
  ];
}
