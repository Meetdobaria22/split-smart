import express from 'express';
import authRoutes from './routes/authRoutes.js';
import groupRoutes from './routes/groupRoutes.js';

const app = express();

app.use(express.json()); // middleware

app.use('/api/auth', authRoutes); // plugging all the auth related routes

app.use('/api/groups', groupRoutes); // endpoint for groups

export default app;


