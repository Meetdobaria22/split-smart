import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1]; // "Bearer <token>" -> just the token part

    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // attaches { user_id: ... } to req.user
        next(); // continue to the actual route handler
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};