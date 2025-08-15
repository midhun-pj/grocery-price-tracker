import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findByUsername, createUser } from '../models/userModel.js';
import { JWT_SECRET } from '../config.js';

const router = express.Router();

router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = findByUsername(username);
    if (!user) return res.status(400).json({ message: 'User not found' });

    if (!bcrypt.compareSync(password, user.password))
        return res.status(400).json({ message: 'Wrong password' });

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
});

// NEW: Admin endpoint to create users
router.post('/create-user', (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password required' });
        }

        // Check if user already exists
        const existingUser = findByUsername(username);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password and create user
        const hashedPassword = bcrypt.hashSync(password, 10);
        const result = createUser(username, hashedPassword);

        res.status(201).json({
            id: result.lastInsertRowid,
            username,
            message: 'User created successfully'
        });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});

export default router;
