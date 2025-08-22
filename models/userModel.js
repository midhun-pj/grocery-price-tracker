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

export const updateUserPassword = (id, newPasswordHash) =>
  db.prepare('UPDATE users SET password = ? WHERE id = ?').run(newPasswordHash, id);

// Remove all refresh tokens for a specific user
export async function removeAllUserRefreshTokens(userId) {
    const stmt = db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?');
    return stmt.run(userId);
}

// Find user by ID
export function findById(id) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
}
