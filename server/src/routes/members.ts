import { Router, Request, Response } from 'express';
import { checkJwt, getAuth0Id, getAuth0Email } from '../middleware/auth';
import { memberService } from '../services/memberService';
import type { GuestProfileInput } from '@cufc/shared';

const router = Router();

// GET /api/members/me - Get current user's profile
router.get('/me', checkJwt, async (req: Request, res: Response) => {
  try {
    const auth0Id = getAuth0Id(req);
    if (!auth0Id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // First try to find by auth0Id
    let profile = await memberService.getProfileByAuth0Id(auth0Id);
    
    // If not found, try to find by email and link the auth0Id
    if (!profile) {
      const email = getAuth0Email(req);
      if (email) {
        profile = await memberService.findAndLinkByEmail(auth0Id, email);
      }
    }
    
    res.json({ profile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/members/me - Create current user's profile
router.post('/me', checkJwt, async (req: Request, res: Response) => {
  try {
    const auth0Id = getAuth0Id(req);
    if (!auth0Id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const body: {
      displayFirstName?: string;
      displayLastName?: string;
      personalInfo?: { email?: string };
      guardian?: { firstName?: string; lastName?: string };
      profileComplete?: boolean;
    } = req.body;

    const profile = await memberService.createProfile(auth0Id, {
      displayFirstName: body.displayFirstName,
      displayLastName: body.displayLastName,
      personalInfo: body.personalInfo,
      guardian: body.guardian,
      profileComplete: body.profileComplete,
    });

    res.status(201).json(profile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/members/guest - Create a guest profile (no auth required)
router.post('/guest', async (req: Request, res: Response) => {
  try {
    const body: GuestProfileInput = req.body;

    // Validate required fields
    if (!body.displayFirstName || !body.displayLastName) {
      return res.status(400).json({ error: 'Display first and last name are required' });
    }
    if (!body.personalInfo?.email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const profile = await memberService.createGuestProfile(body);
    res.status(201).json({ profile });
  } catch (error) {
    console.error('Error creating guest profile:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/members/me/subscriptions - Get member's subscriptions
router.get('/me/subscriptions', checkJwt, async (req: Request, res: Response) => {
  try {
    const auth0Id = getAuth0Id(req);
    if (!auth0Id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const subscriptions = await memberService.getSubscriptions(auth0Id);
    res.json(subscriptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/members/me/intro-enrollment - Get member's intro class enrollment
router.get('/me/intro-enrollment', checkJwt, async (req: Request, res: Response) => {
  try {
    const auth0Id = getAuth0Id(req);
    if (!auth0Id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const enrollment = await memberService.getIntroEnrollment(auth0Id);
    res.json({ enrollment });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/members/me/update - Update member's profile
router.post('/me/update', checkJwt, async (req: Request, res: Response) => {
  try {
    const auth0Id = getAuth0Id(req);
    if (!auth0Id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const profile = await memberService.getProfileByAuth0Id(auth0Id);
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const updated = await memberService.updateProfile(profile._id.toString(), req.body.data);
    res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/members/last-checkin - Get last check-in for a member
router.get('/last-checkin', checkJwt, async (req: Request, res: Response) => {
  try {
    const memberProfileId = req.query.memberProfileId as string;
    if (!memberProfileId) {
      return res.json({ lastCheckIn: null });
    }

    const lastCheckIn = await memberService.getLastCheckIn(memberProfileId);
    res.json({ lastCheckIn });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/members/me/transactions - Get member's payment history
router.get('/me/transactions', checkJwt, async (req: Request, res: Response) => {
  try {
    const auth0Id = getAuth0Id(req);
    if (!auth0Id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const transactions = await memberService.getTransactions(auth0Id);
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/members/me/attendance - Get member's attendance history
router.get('/me/attendance', checkJwt, async (req: Request, res: Response) => {
  try {
    const auth0Id = getAuth0Id(req);
    if (!auth0Id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const attendance = await memberService.getAttendanceHistory(auth0Id);
    res.json(attendance);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
