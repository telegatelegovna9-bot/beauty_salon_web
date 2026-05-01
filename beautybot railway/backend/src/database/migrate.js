const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function migrate() {
  console.log('🔄 Running database migration...');

  const SQL = await initSqlJs();
  const DB_PATH = process.env.DB_PATH || './data/beauty_salon.db';

  // Load existing database or create new one
  let db;
  if (fs.existsSync(DB_PATH)) {
    const dbBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(dbBuffer);
    console.log('📁 Database loaded from', DB_PATH);
  } else {
    db = new SQL.Database();
    console.log('📁 Creating new database at', DB_PATH);
  }

  // Load and execute schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.run(schema);

  // Save database to disk
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  db.close();

  console.log('✅ Migration complete!');
}

migrate().catch(console.error);
