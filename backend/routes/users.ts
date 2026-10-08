import { Router } from 'express';
import { requireAuth, AuthRequest } from '../middleware/auth.ts';
import { getUsers, getOrCreateUser } from '../db/users.ts';

export const usersRouter = Router();

// Synchronize authenticated Firebase Auth user with Cloud SQL
usersRouter.post('/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: No verified user' });
    }
    const user = await getOrCreateUser(
      req.user.uid,
      req.user.email || 'no-email@inthewindav.com',
      req.user.name || undefined
    );
    res.json(user);
  } catch (error: any) {
    console.error('Failed to sync user:', error);
    res.status(500).json({ error: error.message || 'Failed to sync user' });
  }
});

// Retrieve team users list
usersRouter.get('/', requireAuth, async (req: AuthRequest, res) => {
  try {
    const usersList = await getUsers();
    res.json(usersList);
  } catch (error: any) {
    console.error('Failed to fetch users:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch users' });
  }
});
