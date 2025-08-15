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

// New pagination methods
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