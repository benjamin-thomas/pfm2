import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

export const initDb = (dbPath: string = ':memory:'): Database.Database => {
  const db = new Database(dbPath);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Read and execute init.sql - relative to project root
  const sqlPath = path.join(process.cwd(), 'sql/init.sql');
  const initSql = fs.readFileSync(sqlPath, 'utf-8');

  db.exec(initSql);

  console.log(`✅ Database initialized at ${dbPath === ':memory:' ? 'memory' : dbPath}`);

  return db;
};
