import { Router, Request, Response } from 'express';
import { checkJwt } from '../middleware/auth';
import { SquareService } from '../services/square/squareService';
import { getMemberProfileById } from '../services/memberProfileService';

const router = Router();

router.post('/intro', checkJwt, async (req: Request, res: Response) => {
  try {
    const { catalogObjectId, memberProfileId, redirectUrl } = req.body;

    if (!catalogObjectId || !memberProfileId) {
      return res.status(400).json({
        error: 'Missing required parameters: catalogObjectId and memberProfileId are required'
      });
    }

    const profile = await getMemberProfileById(memberProfileId);
    if (!profile) {
      return res.status(404).json({ error: 'Member profile not found' });
    }

    const squareService = new SquareService();
    const checkoutUrl = await squareService.getSingleVariantCheckout(
      catalogObjectId, 
      memberProfileId, 
      profile.squareCustomerId || undefined, 
      redirectUrl
    );

    if (!checkoutUrl) {
      return res.status(500).json({ error: 'Failed to create checkout link' });
    }

    res.json({ checkoutUrl });
  } catch (error) {
    console.error('Error in intro class checkout:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

export default router;
