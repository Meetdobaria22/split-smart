import express from 'express';
import { createGroup } from '../controllers/groupControllers.js';
//import { accessGroup } from '../controllers/groupControllers.js';
import { authenticateToken } from '../middleware/authMiddleware.js';



const router = express.Router();

router.post('/', authenticateToken, createGroup);
//router.get('/', authenticateToken, accessGroup);

export default router;