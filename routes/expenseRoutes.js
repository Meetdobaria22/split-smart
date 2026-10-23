import express from 'express';
import { addExpense, getGroupExpenses, getGroupBalances } from '../controllers/expenseControllers.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = express.Router({ mergeParams: true });

router.post('/', authenticateToken, addExpense);
router.get('/', authenticateToken, getGroupExpenses);
router.get('/balances', authenticateToken, getGroupBalances);
export default router;