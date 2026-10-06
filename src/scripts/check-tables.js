import db from '../database/knex.client.js';

async function checkTables() {
  const { rows } = await db.raw(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `);
  console.log('Existing tables:', rows.map(r => r.table_name));

  for (const table of ['admins', 'roles', 'permissions']) {
    if (rows.some(r => r.table_name === table)) {
      const cols = await db.raw(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = ?
      `, [table]);
      console.log(`Columns for ${table}:`, cols.rows.map(c => `${c.column_name} (${c.data_type})`));
    }
  }
  process.exit(0);
}

checkTables().catch(err => {
  console.error(err);
  process.exit(1);
});
