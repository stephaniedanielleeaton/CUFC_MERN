import { Router, Request, Response } from 'express';
import { checkJwt, getAuth0Id } from '../middleware/auth';
import { squareCheckoutService } from '../services/square';
import { getMemberProfileById, getProfileForUser } from '../services/memberProfileService';
import { IntroClassCheckoutRequest, CheckoutResponse, SingleClassCheckoutRequest, ErrorResponse } from '@cufc/shared';
import { DROP_IN_CATALOG_OBJECT_ID } from '../config/constants';

const router = Router();

router.post('/intro', checkJwt, async (req: Request<{}, {}, IntroClassCheckoutRequest>, res: Response<CheckoutResponse | ErrorResponse>) => {
  try {
    const { catalogObjectId, memberProfileId, redirectUrl } = req.body;

    console.log(`[Checkout] Intro class checkout request - memberProfileId: ${memberProfileId}, catalogObjectId: ${catalogObjectId}`);

    if (!catalogObjectId || !memberProfileId) {
      console.warn('[Checkout] Missing required parameters');
      return res.status(400).json({
        error: 'Missing required parameters: catalogObjectId and memberProfileId are required'
      });
    }

    const profile = await getMemberProfileById(memberProfileId);
    if (!profile) {
      console.error(`[Checkout] Profile not found: ${memberProfileId}`);
      return res.status(404).json({ error: 'Member profile not found' });
    }

    if (!profile.profileComplete) {
      console.error(`[Checkout] Incomplete profile attempted checkout: ${memberProfileId}, displayName: ${profile.displayFirstName} ${profile.displayLastName}`);
      return res.status(400).json({ 
        error: 'Profile must be complete before checkout. Please complete your profile first.',
        code: 'PROFILE_INCOMPLETE'
      });
    }

    console.log(`[Checkout] Creating checkout for ${profile.displayFirstName} ${profile.displayLastName} (${profile.personalInfo?.email})`);

    const checkoutUrl = await squareCheckoutService.createPaymentLink(
      catalogObjectId, 
      memberProfileId, 
      profile.squareCustomerId || undefined, 
      redirectUrl
    );

    if (!checkoutUrl) {
      console.error(`[Checkout] Failed to create checkout link for profile: ${memberProfileId}`);
      return res.status(500).json({ error: 'Failed to create checkout link' });
    }

    console.log(`[Checkout] Checkout created successfully for profile: ${memberProfileId}`);
    res.json({ checkoutUrl });
  } catch (error) {
    console.error('Error in intro class checkout:', error);
    res.status(500).json({ error: 'An error occurred while processing your request' });
  }
});

router.post('/intro-guest', async (req: Request<{}, {}, IntroClassCheckoutRequest>, res: Response<CheckoutResponse | ErrorResponse>) => {
  try {
    const { catalogObjectId, memberProfileId, redirectUrl } = req.body;

    console.log(`[Checkout] Guest intro class checkout request - memberProfileId: ${memberProfileId}, catalogObjectId: ${catalogObjectId}`);

    if (!catalogObjectId || !memberProfileId) {
      console.warn('[Checkout] Guest checkout missing required parameters');
      return res.status(400).json({
        error: 'Missing required parameters: catalogObjectId and memberProfileId are required'
      });
    }

    const profile = await getMemberProfileById(memberProfileId);
    if (!profile) {
      console.error(`[Checkout] Guest checkout - profile not found: ${memberProfileId}`);
      return res.status(404).json({ error: 'Member profile not found' });
    }

    if (!profile.profileComplete) {
      console.error(`[Checkout] Guest checkout - incomplete profile: ${memberProfileId}, displayName: ${profile.displayFirstName} ${profile.displayLastName}`);
      return res.status(400).json({ 
        error: 'Profile must be complete before checkout. Please complete your profile first.',
        code: 'PROFILE_INCOMPLETE'
      });
    }

    console.log(`[Checkout] Guest checkout for ${profile.displayFirstName} ${profile.displayLastName} (${profile.personalInfo?.email})`);

    const checkoutUrl = await squareCheckoutService.createPaymentLink(
      catalogObjectId, 
      memberProfileId, 
      profile.squareCustomerId || undefined, 
      redirectUrl
    );

    if (!checkoutUrl) {
      console.error(`[Checkout] Guest checkout - failed to create link for profile: ${memberProfileId}`);
      return res.status(500).json({ error: 'Failed to create checkout link' });
    }

    console.log(`[Checkout] Guest checkout created successfully for profile: ${memberProfileId}`);
    res.json({ checkoutUrl });
  } catch (error) {
    console.error('Error in guest intro class checkout:', error);
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

  if (!profile.profileComplete) {
    return res.status(400).json({ 
      error: 'Profile must be complete before checkout. Please complete your profile first.',
      code: 'PROFILE_INCOMPLETE'
    });
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


router.post('/subscription', checkJwt, async (req: Request, res: Response<CheckoutResponse | ErrorResponse>) => {
  const auth0Id = getAuth0Id(req);
  if (!auth0Id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const profile = await getProfileForUser(auth0Id);
  if (!profile) {
    return res.status(404).json({ error: 'Member profile not found' });
  }

  if (!profile.profileComplete) {
    return res.status(400).json({ 
      error: 'Profile must be complete before checkout. Please complete your profile first.',
      code: 'PROFILE_INCOMPLETE'
    });
  }

  res.json({ checkoutUrl: squareCheckoutService.getSubscriptionCheckoutUrl() });
});

export default router;
