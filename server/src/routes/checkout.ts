import { Router, Request, Response } from 'express';
import { checkJwt } from '../middleware/auth';
import { squareCheckoutService } from '../services/square';
import { getMemberProfileById } from '../services/memberProfileService';
import { IntroClassCheckoutRequest, CheckoutResponse, SingleClassCheckoutRequest, ErrorResponse } from '@cufc/shared';
import { DROP_IN_CATALOG_OBJECT_ID } from '../config/constants';

const router = Router();

router.post('/intro', checkJwt, async (req: Request<{}, {}, IntroClassCheckoutRequest>, res: Response<CheckoutResponse | ErrorResponse>) => {
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

    const checkoutUrl = await squareCheckoutService.createPaymentLink(
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

router.post('/dropin', checkJwt, async (req: Request<{}, {}, SingleClassCheckoutRequest>, res: Response<CheckoutResponse | ErrorResponse>) => {
  const { memberProfileId, redirectUrl } = req.body;

  if (!memberProfileId) {
    return res.status(400).json({
      error: 'Missing required parameter: memberProfileId is required'
    });
  }

  const profile = await getMemberProfileById(memberProfileId)
  if (!profile) {
    return res.status(404).json({ error: 'Member profile not found' });
  }

  try {
    const checkoutUrl = await squareCheckoutService.createPaymentLink(
      DROP_IN_CATALOG_OBJECT_ID,
      memberProfileId,
      profile.squareCustomerId || undefined,
      redirectUrl
    );

    if (!checkoutUrl) {
      return res.status(500).json({ error: 'Failed to create checkout link' });
    }

    res.json({ checkoutUrl });
  } catch (error) {
    console.error('Error in single class checkout:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});


router.post('/subscription', checkJwt, async (_req: Request, res: Response<CheckoutResponse | ErrorResponse>) => {
  res.json({ checkoutUrl: squareCheckoutService.getSubscriptionCheckoutUrl() });
});

export default router;
