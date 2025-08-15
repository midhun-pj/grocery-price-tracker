import db from '../db.js';

export const findByUsername = (username) =>
  db.prepare('SELECT * FROM users WHERE username = ?').get(username);

export const createUser = (username, passwordHash) =>
  db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, passwordHash);

// Optional: Add more user management functions
export const getAllUsers = () =>
  db.prepare('SELECT id, username FROM users').all();

export const deleteUser = (id) =>
  db.prepare('DELETE FROM users WHERE id = ?').run(id);