import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { findByUsername, createUser, removeAllUserRefreshTokens, findById } from '../models/userModel.js';
imrpot { generateTokens } from '../utils/tokenUtils.js';

import { JWT_SECRET } from '../config.js';

const router = express.Router();

router.post('/login', (req, res) => {

    try {
        const { username, password } = req.body;
        const user = findByUsername(username);
   
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate tokens
        const { accessToken, refreshToken } = generateTokens(user.id);

        // Store refresh token in database
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        // to-do
        // db.prepare(`
        //  INSERT INTO refresh_tokens (user_id, token, expires_at) 
        //  VALUES (?, ?, ?)
        // `).run(user.id, refreshToken, expiresAt.toISOString());

        // Set cookies
        res.cookie('accessToken', accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000 // 15 minutes
        });
    
        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
    
        res.json({ 
          message: 'Login successful',
          user: { id: user.id, username: user.username }
        });
    } catch(error) {
        res.status(500).json({ error: 'Login failed' });
    }
});


const validatePasswordStrength = (req, res, next) => {
    const { password, newPassword } = req.body;
    const passwordToCheck = password || newPassword;
    
    if (passwordToCheck) {
        // Add more sophisticated password validation
        const hasUpperCase = /[A-Z]/.test(passwordToCheck);
        const hasLowerCase = /[a-z]/.test(passwordToCheck);
        const hasNumbers = /\d/.test(passwordToCheck);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(passwordToCheck);
        
        if (passwordToCheck.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }
        
        if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
            return res.status(400).json({ 
                error: 'Password must contain uppercase, lowercase, and numeric characters' 
            });
        }
    }
    
    next();
};

router.post('/create-user', validatePasswordStrength,async (req, res) => {
    try {
        const { username, password } = req.body;

        // Input validation
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password required' });
        }

        // Password strength validation
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }

        // Check if user already exists
        const existingUser = findByUsername(username);
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' }); // 409 Conflict
        }

        // Hash password and create user
        const hashedPassword = await bcrypt.hash(password, 12); // Use async version with higher rounds
        const result = createUser(username, hashedPassword);

        // Generate tokens for immediate login after signup
        const { accessToken, refreshToken } = generateTokens(result.lastInsertRowid);
        
        // Store refresh token
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        await storeRefreshToken(refreshToken, result.lastInsertRowid, expiresAt);
        
        // Set cookies
        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 15 * 60 * 1000
        });
        
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(201).json({
            message: 'User created successfully',
            user: { id: result.lastInsertRowid, username }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error creating user' });
    }
});




router.put('/update-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.userId; // From authenticated token

        // Input validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password required' });
        }

        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters long' });
        }

        // Get current user
        const user = findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const validCurrentPassword = await bcrypt.compare(currentPassword, user.password);
        if (!validCurrentPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        const result = updateUserPassword(userId, hashedPassword);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Invalidate all refresh tokens for this user (force re-login on all devices)
        await removeAllUserRefreshTokens(userId);

        // Clear current session cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        res.json({ 
            message: 'Password updated successfully. Please log in again.',
            requiresReauth: true
        });
    } catch (error) {
        res.status(500).json({ error: 'Error updating password' });
    }
});

router.delete('/delete-account', authenticateToken, async (req, res) => {
    try {
        const { password } = req.body;
        const userId = req.userId; // From authenticated token

        // Require password confirmation for account deletion
        if (!password) {
            return res.status(400).json({ error: 'Password confirmation required' });
        }

        // Get current user
        const user = findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Password is incorrect' });
        }

        // Delete all user's refresh tokens first
        await removeAllUserRefreshTokens(userId);
        
        // Delete user (this should cascade and delete related data)
        const result = deleteUser(userId);

        if (result.changes === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Clear cookies
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        res.json({ message: 'Account deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Error deleting account' });
    }
});


// NEW: Delete user
router.delete('/delete-user/:id', (req, res) => {
    try {
        const { id } = req.params;
        const result = deleteUser(parseInt(id));

        if (result.changes === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    
    // Remove refresh token from database
    if (refreshToken) {
      db.prepare(`DELETE FROM refresh_tokens WHERE token = ?`).run(refreshToken);
    }
    
    // Clear cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});


export default router;
