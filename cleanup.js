import Database from 'better-sqlite3';

class SupermarketCleanupBetter {
    constructor(dbPath) {
        this.db = new Database(dbPath);
    }

    runCleanup() {
        const transaction = this.db.transaction(() => {
            // Create temporary mapping
            this.db.exec(`
                CREATE TEMPORARY TABLE supermarket_mapping AS
                WITH ranked_supermarkets AS (
                    SELECT 
                        id, name, LOWER(name) AS normalized_name,
                        ROW_NUMBER() OVER (
                            PARTITION BY LOWER(name) 
                            ORDER BY CASE WHEN name GLOB '[A-Z]*' THEN 1 ELSE 2 END, id ASC
                        ) AS rn
                    FROM supermarkets
                )
                SELECT old.id AS old_id, new.id AS new_id
                FROM ranked_supermarkets old
                JOIN ranked_supermarkets new ON old.normalized_name = new.normalized_name AND new.rn = 1
                WHERE old.id != new.id;
            `);

            // Update grocery items
            const updateGrocery = this.db.prepare(`
                UPDATE grocery_items
                SET supermarket_id = (SELECT new_id FROM supermarket_mapping WHERE old_id = grocery_items.supermarket_id)
                WHERE supermarket_id IN (SELECT old_id FROM supermarket_mapping)
            `);
            
            const groceryResult = updateGrocery.run();

            // Delete duplicates
            const deleteDuplicates = this.db.prepare(`
                DELETE FROM supermarkets WHERE id IN (SELECT old_id FROM supermarket_mapping)
            `);
            
            const deleteResult = deleteDuplicates.run();

            return { groceryUpdated: groceryResult.changes, duplicatesRemoved: deleteResult.changes };
        });

        return transaction();
    }

    getPreview() {
        const stmt = this.db.prepare(`
            WITH ranked_supermarkets AS (
                SELECT 
                    id, name, LOWER(name) AS normalized_name,
                    ROW_NUMBER() OVER (
                        PARTITION BY LOWER(name) 
                        ORDER BY CASE WHEN name GLOB '[A-Z]*' THEN 1 ELSE 2 END, id ASC
                    ) AS rn
                FROM supermarkets
            )
            SELECT 
                old.name AS will_be_removed, 
                old.id AS old_id,
                new.name AS will_be_kept, 
                new.id AS new_id
            FROM ranked_supermarkets old
            JOIN ranked_supermarkets new ON old.normalized_name = new.normalized_name AND new.rn = 1
            WHERE old.id != new.id
            ORDER BY old.name
        `);

        return stmt.all();
    }

    close() {
        this.db.close();
    }
}
// Usage
const cleanup = new SupermarketCleanupBetter('./grocery.db');
try {
    const preview = cleanup.getPreview();
    console.log('Preview:', preview);
    
    const result = cleanup.runCleanup();
    console.log(`Cleanup completed: ${result.groceryUpdated} items updated, ${result.duplicatesRemoved} duplicates removed`);
} catch (error) {
    console.error('Error:', error.message);
} finally {
    cleanup.close();
}
