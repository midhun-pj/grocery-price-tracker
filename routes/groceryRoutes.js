import express from 'express';
import {
    createItem, updateItem, deleteItem, countItems, getItemsPaginated,
    countItemsWithSearch, getItemsPaginatedWithSearch,
    getItemWithHistory
} from '../models/groceryModel.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authenticate);

// GET with pagination and search
router.get('/', (req, res) => {
  const userId = req.user.id;
  
  // Parse parameters with defaults
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 20, 1), 100);
  const search = (req.query.search || '').trim();
  
  let totalCount;
  let items;
  
  if (search) {
    // Search with pagination
    totalCount = countItemsWithSearch(userId, search);
    items = getItemsPaginatedWithSearch(userId, page, limit, search);
  } else {
    // Regular pagination
    totalCount = countItems(userId);
    items = getItemsPaginated(userId, page, limit);
  }
  
  const totalPages = Math.ceil(totalCount / limit);
  const currentPage = Math.min(page, totalPages || 1);
  
  res.json({
    data: items,
    pagination: {
      currentPage,
      totalPages,
      totalCount,
      itemsPerPage: limit,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    },
    search: search // Include search term in response
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

router.get('/:id', (req, res) => {
  try {
    const itemId = parseInt(req.params.id);
    const userId = req.user.id;
    
    const itemWithHistory = getItemWithHistory(userId, itemId);
    
    if (!itemWithHistory) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    res.json(itemWithHistory);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching item details', error: error.message });
  }
});

export default router;
