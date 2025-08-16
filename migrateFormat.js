import Database from 'better-sqlite3';

const db = new Database('./grocery.db');

console.log('🔄 Starting date format migration...');

try {
  db.exec(`
    BEGIN TRANSACTION;
    
    -- 1. Rename existing table
    ALTER TABLE grocery_items RENAME TO grocery_items_old;
    
    -- 2. Create new table with proper schema
    CREATE TABLE grocery_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      supermarket_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT NOT NULL,
      price REAL NOT NULL,
      date TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (supermarket_id) REFERENCES supermarkets(id) ON DELETE CASCADE
    );
    
    -- 3. Copy and transform data (DD/MM/YYYY -> YYYY-MM-DD)
    INSERT INTO grocery_items (id, user_id, supermarket_id, name, quantity, unit, price, date)
    SELECT 
      id, user_id, supermarket_id, name, quantity, unit, price,
      substr(date, 7, 4) || '-' || substr(date, 4, 2) || '-' || substr(date, 1, 2) AS date
    FROM grocery_items_old;
    
    -- 4. Drop old table
    DROP TABLE grocery_items_old;
    
    COMMIT;
  `);

  const count = db.prepare('SELECT COUNT(*) as count FROM grocery_items').get();
  console.log(`✅ Migration completed successfully! ${count.count} records migrated.`);
  
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  db.exec('ROLLBACK;');
} finally {
  db.close();
}
