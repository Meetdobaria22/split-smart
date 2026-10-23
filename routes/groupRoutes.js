import express from 'express';
import { createGroup } from '../controllers/groupControllers.js';
import { accessGroup } from '../controllers/groupControllers.js';
import { getGroupById } from '../controllers/groupControllers.js';
import { addGroupMember } from '../controllers/groupControllers.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import expenseRoutes from './expenseRoutes.js';
import { getGroupMembers } from '../controllers/groupControllers.js';
const router = express.Router();

router.post('/', authenticateToken, createGroup);
router.get('/', authenticateToken, accessGroup);
router.get('/:id', authenticateToken, getGroupById);
router.post('/:id/members', authenticateToken, addGroupMember);
router.use('/:id/expenses', expenseRoutes);
router.get('/:id/members', authenticateToken, getGroupMembers);
export default router;