import db from '../db.js';

export const allItems = (userId) =>
  db.prepare(`
      SELECT g.*, s.name AS supermarket
      FROM grocery_items g
      JOIN supermarkets s ON s.id = g.supermarket_id
      WHERE g.user_id = ?
      ORDER BY date DESC`).all(userId);

export const createItem = (userId, body) =>
  db.prepare(`INSERT INTO grocery_items
      (user_id, supermarket_id, name, quantity, unit, price, date)
      VALUES (?,?,?,?,?,?,?)`)
    .run(userId, body.supermarket_id, body.name, body.quantity, body.unit, body.price, body.date);

export const updateItem = (userId, id, body) =>
  db.prepare(`UPDATE grocery_items
      SET supermarket_id = ?, name = ?, quantity = ?, unit = ?, price = ?, date = ?
      WHERE id = ? AND user_id = ?`)
    .run(body.supermarket_id, body.name, body.quantity, body.unit, body.price, body.date, id, userId);

export const deleteItem = (userId, id) =>
  db.prepare('DELETE FROM grocery_items WHERE id = ? AND user_id = ?').run(id, userId);

export const countItems = (userId) => {
  const result = db.prepare('SELECT COUNT(*) as count FROM grocery_items WHERE user_id = ?').get(userId);
  return result.count;
};

export const getItemsPaginated = (userId, page, limit) => {
  const offset = (page - 1) * limit;
  return db.prepare(`
      SELECT g.*, s.name AS supermarket
      FROM grocery_items g
      JOIN supermarkets s ON s.id = g.supermarket_id
      WHERE g.user_id = ?
      ORDER BY date DESC
      LIMIT ? OFFSET ?`).all(userId, limit, offset);
};

export const countItemsWithSearch = (userId, searchTerm) => {
  const likeTerm = `%${searchTerm}%`;
  const result = db.prepare(`
    SELECT COUNT(*) as count 
    FROM grocery_items g
    JOIN supermarkets s ON s.id = g.supermarket_id
    WHERE g.user_id = ? 
    AND (LOWER(g.name) LIKE LOWER(?) OR LOWER(s.name) LIKE LOWER(?))
  `).get(userId, likeTerm, likeTerm);
  return result.count;
};

export const getItemsPaginatedWithSearch = (userId, page, limit, searchTerm) => {
  const offset = (page - 1) * limit;
  const likeTerm = `%${searchTerm}%`;
  return db.prepare(`
    SELECT g.*, s.name AS supermarket
    FROM grocery_items g
    JOIN supermarkets s ON s.id = g.supermarket_id
    WHERE g.user_id = ? 
    AND (LOWER(g.name) LIKE LOWER(?) OR LOWER(s.name) LIKE LOWER(?))
    ORDER BY date DESC
    LIMIT ? OFFSET ?
  `).all(userId, likeTerm, likeTerm, limit, offset);
};

export const getItemWithHistory = (userId, itemId) => {
  // First get the specific item
  const currentItem = db.prepare(`
    SELECT g.*, s.name AS supermarket
    FROM grocery_items g
    JOIN supermarkets s ON s.id = g.supermarket_id
    WHERE g.id = ? AND g.user_id = ?
  `).get(itemId, userId);

  if (!currentItem) {
    return null;
  }

  // Get all items with the same name for history
  const history = db.prepare(`
    SELECT g.*, s.name AS supermarket
    FROM grocery_items g
    JOIN supermarkets s ON s.id = g.supermarket_id
    WHERE g.user_id = ? AND LOWER(g.name) = LOWER(?)
    ORDER BY g.date DESC
  `).all(userId, currentItem.name);

  // Calculate statistics
  const totalPurchases = history.length;
  const avgPrice = history.length > 0
    ? (history.reduce((sum, item) => sum + parseFloat(item.price), 0) / history.length).toFixed(2)
    : '0.00';

  return {
    currentItem,
    history,
    statistics: {
      totalPurchases,
      avgPrice: parseFloat(avgPrice)
    }
  };
};