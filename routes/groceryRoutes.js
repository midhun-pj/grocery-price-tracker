import express from 'express';
import {
    allItems, createItem, updateItem, deleteItem, countItems, getItemsPaginated
} from '../models/groceryModel.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticate);

// router.get('/', (req, res) => res.json(allItems(req.user.id)));

// GET with pagination
router.get('/', (req, res) => {
    const userId = req.user.id;

    // Parse pagination parameters with defaults
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100); // Max 100 items per page

    // Get total count for pagination metadata
    const totalItems = countItems(userId);
    const totalPages = Math.ceil(totalItems / limit);
    const currentPage = Math.min(page, totalPages || 1);

    // Get paginated items
    const items = getItemsPaginated(userId, currentPage, limit);

    res.json({
        data: items,
        pagination: {
            currentPage,
            totalPages,
            totalItems,
            itemsPerPage: limit,
            hasNextPage: currentPage < totalPages,
            hasPrevPage: currentPage > 1
        }
    });
});


router.post('/', (req, res) => {
    const result = createItem(req.user.id, req.body);
    res.status(201).json({ id: result.lastInsertRowid });
});

router.put('/:id', (req, res) => {
    updateItem(req.user.id, req.params.id, req.body);
    res.json({ ok: true });
});

router.delete('/:id', (req, res) => {
    deleteItem(req.user.id, req.params.id);
    res.status(204).end();
});

export default router;
