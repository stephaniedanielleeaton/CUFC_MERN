import { Router, Request, Response } from 'express';
import { IntroClassOfferingsService } from '../services/square/introClassOfferingsService';

const router = Router();

// GET /api/intro-class-offerings - Get intro class offerings from Square
router.get('/', async (_req: Request, res: Response) => {
  try {
    const introClassOfferingsService = new IntroClassOfferingsService();
    const offerings = await introClassOfferingsService.getIntroClassOfferings();
    
    res.json(offerings);
  } catch (error) {
    console.error('Error in intro class offerings API route:', error);
    res.status(500).json({ error: 'Failed to retrieve intro class offerings' });
  }
});

export default router;
