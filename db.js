import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const db = new Database('./grocery.db');

// run migration once
const initSQL = fs.readFileSync(path.join('migrations', 'init.sql'), 'utf8');
db.exec(initSQL);

export default db;
