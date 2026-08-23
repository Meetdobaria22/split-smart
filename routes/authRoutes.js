// for setting up auth routes....the routes folder is for all routes present in the project which is then plugged to the app.js 
import express from 'express';
import { signup , login } from '../controllers/authControllers.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);



export default router;