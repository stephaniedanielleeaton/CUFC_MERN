import { Router, Request, Response } from 'express';
import { checkJwt } from '../middleware/auth';

const router = Router();

// GET /api/auth/roles - Get user roles from token
router.get('/roles', checkJwt, async (req: Request, res: Response) => {
  try {
    const roles = req.auth?.payload['https://cufc.app/roles'] || [];
    res.json({ roles, payload: req.auth?.payload });
  } catch (error) {
    console.error('Error getting token', error);
    res.status(500).json({ error: 'Could not get token' });
  }
});

export default router;
