import express from 'express';
import authRoutes from './routes/authRoutes.js';

const app = express();

app.use(express.json()); // middleware
app.use('/api/auth', authRoutes); // plugging all the auth related routes

export default app;


