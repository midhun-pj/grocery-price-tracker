import db from '../db.js';

export const allMarkets = () =>
  db.prepare('SELECT * FROM supermarkets ORDER BY name').all();

export const getMarket = (id) =>
  db.prepare('SELECT * FROM supermarkets WHERE id = ?').get(id);

export const createMarket = (name) =>
  db.prepare('INSERT INTO supermarkets (name) VALUES (?)').run(name);

export const updateMarket = (id, name) =>
  db.prepare('UPDATE supermarkets SET name = ? WHERE id = ?').run(name, id);

export const deleteMarket = (id) =>
  db.prepare('DELETE FROM supermarkets WHERE id = ?').run(id);
