const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let SQL;
let db;

const DB_PATH = process.env.DB_PATH || './data/beauty_salon.db';

async function initSqlJsInstance() {
  if (!SQL) {
    SQL = await initSqlJs();
  }
  return SQL;
}

async function initDb() {
  const SQL = await initSqlJsInstance();

  // Load existing database or create new one
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

  console.log('✅ Database initialized');
  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

function closeDb() {
  if (db) {
    // Save database to disk
    const data = db.export();
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, Buffer.from(data));
    db.close();
    db = null;
    console.log('💾 Database saved to', DB_PATH);
  }
}

module.exports = { initDb, getDb, closeDb };
