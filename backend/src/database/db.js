const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let db = null;
let SQL = null;
let dbPath = null;
let saveTimer = null;

function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(saveToDisk, 500);
}

function saveToDisk() {
  if (!db || !dbPath || !db._db) return;
  try {
    const data = db._db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (e) {
    console.error('Failed to save database:', e.message);
  }
}

/**
 * Wrap sql.js to provide better-sqlite3-compatible synchronous API
 */
function createCompatibleDb(sqlDb) {
  const wrapper = {
    _db: sqlDb,

    prepare(sql) {
      const self = this;
      return {
        _sql: sql,

        run(...params) {
          const flat = flattenParams(params);
          sqlDb.run(sql, flat);
          const lastId = sqlDb.exec('SELECT last_insert_rowid() as id');
          const lastInsertRowid = lastId[0]?.values[0]?.[0] || 0;
          const changes = sqlDb.getRowsModified();
          scheduleSave();
          return { changes, lastInsertRowid };
        },

        get(...params) {
          const flat = flattenParams(params);
          const stmt = sqlDb.prepare(sql);
          try {
            stmt.bind(flat);
            if (stmt.step()) {
              return stmt.getAsObject();
            }
            return undefined;
          } finally {
            stmt.free();
          }
        },

        all(...params) {
          const flat = flattenParams(params);
          const results = [];
          const stmt = sqlDb.prepare(sql);
          try {
            stmt.bind(flat);
            while (stmt.step()) {
              results.push(stmt.getAsObject());
            }
          } finally {
            stmt.free();
          }
          return results;
        }
      };
    },

    exec(sql) {
      sqlDb.run(sql);
      scheduleSave();
    },

    pragma(pragmaStr) {
      try { sqlDb.run(`PRAGMA ${pragmaStr}`); } catch (e) {}
    },

    transaction(fn) {
      return (...args) => {
        sqlDb.run('BEGIN');
        try {
          const result = fn(...args);
          sqlDb.run('COMMIT');
          scheduleSave();
          return result;
        } catch (e) {
          try { sqlDb.run('ROLLBACK'); } catch (_) {}
          throw e;
        }
      };
    },

    close() {
      saveToDisk();
      sqlDb.close();
    }
  };
  return wrapper;
}

function flattenParams(params) {
  if (params.length === 0) return [];
  if (params.length === 1 && Array.isArray(params[0])) return params[0];
  return params;
}

/**
 * Apply schema — split by semicolons, skip comments and problematic statements
 */
function applySchema(sqlDb, schemaPath) {
  const schema = fs.readFileSync(schemaPath, 'utf8');

  // Split into individual statements
  const statements = [];
  let current = '';
  let inComment = false;

  for (const line of schema.split('\n')) {
    const trimmed = line.trim();
    // Skip comment lines
    if (trimmed.startsWith('--')) continue;
    // Skip PRAGMA lines (sql.js handles them differently)
    if (trimmed.toUpperCase().startsWith('PRAGMA')) continue;

    current += line + '\n';

    if (trimmed.endsWith(';')) {
      const stmt = current.trim();
      if (stmt.length > 1) {
        statements.push(stmt);
      }
      current = '';
    }
  }

  // Handle multi-line statements (triggers)
  // Re-parse properly
  const allStatements = schema
    .replace(/--[^\n]*/g, '') // remove comments
    .split(/;\s*\n/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.toUpperCase().startsWith('PRAGMA'));

  for (const stmt of allStatements) {
    const finalStmt = stmt.endsWith(';') ? stmt : stmt + ';';
    try {
      sqlDb.run(finalStmt);
    } catch (e) {
      const msg = e.message || '';
      // Ignore "already exists" errors on re-init
      if (!msg.includes('already exists') &&
          !msg.includes('duplicate column') &&
          !msg.includes('table') === false) {
        // Only log unexpected errors
        if (!msg.includes('already exists')) {
          // silently skip
        }
      }
    }
  }
}

async function getDbAsync() {
  if (db) return db;

  const DB_PATH = process.env.DB_PATH || './data/beauty_salon.db';
  dbPath = path.resolve(DB_PATH);
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  SQL = await initSqlJs();

  let sqlDb;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    sqlDb = new SQL.Database(fileBuffer);
  } else {
    sqlDb = new SQL.Database();
  }

  // Apply schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  if (fs.existsSync(schemaPath)) {
    applySchema(sqlDb, schemaPath);
    // Save after schema creation
    const data = sqlDb.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }

  db = createCompatibleDb(sqlDb);

  console.log(`✅ Database connected: ${dbPath}`);
  return db;
}

let _syncDb = null;

function getDb() {
  if (_syncDb) return _syncDb;
  throw new Error('Database not initialized. Call await initDb() first.');
}

async function initDb() {
  _syncDb = await getDbAsync();
  return _syncDb;
}

function closeDb() {
  if (saveTimer) clearTimeout(saveTimer);
  if (db) {
    saveToDisk();
    try { db._db.close(); } catch (e) {}
    db = null;
    _syncDb = null;
  }
}

module.exports = { getDb, initDb, closeDb, getDbAsync };
