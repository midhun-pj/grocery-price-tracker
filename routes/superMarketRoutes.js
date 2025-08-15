import express from 'express';
import {
    allMarkets, getMarket, createMarket,
    updateMarket, deleteMarket
} from '../models/superMarketModel.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticate);

router.get('/', (_req, res) => res.json(allMarkets()));

router.post('/', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Name required' });
    const result = createMarket(name);
    res.status(201).json(getMarket(result.lastInsertRowid));
});

router.put('/:id', (req, res) => {
    updateMarket(req.params.id, req.body.name);
    res.json(getMarket(req.params.id));
});

router.delete('/:id', (req, res) => {
    deleteMarket(req.params.id);
    res.status(204).end();
});

export default router;
