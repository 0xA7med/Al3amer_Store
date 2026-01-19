import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
export const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }
        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await db.query.users.findFirst({
            where: eq(users.id, decoded.userId),
        });
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }
        const { password: _, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;
        next();
    }
    catch (error) {
        console.error('Error verifying token:', error);
        return res.status(401).json({ error: 'Invalid token' });
    }
};
//# sourceMappingURL=auth.js.map