import { Router, Request, Response } from 'express';
import { checkJwt, getAuth0Id } from '../middleware/auth';
import { getProfileForUser, createProfileForUser, updateMemberProfileById } from '../services/memberProfileService';
import { getLastCheckInForMember } from '../services/attendanceService';
import { getMemberSubscriptions, getMemberIntroEnrollment } from '../services/square/subscriptionService';

const router = Router();

// GET /api/members/me - Get current user's profile
router.get('/me', checkJwt, async (req: Request, res: Response) => {
  try {
    const auth0Id = getAuth0Id(req);
    if (!auth0Id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const profile = await getProfileForUser(auth0Id);
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
    } = req.body;

    const profile = await createProfileForUser(auth0Id, {
      displayFirstName: body.displayFirstName,
      displayLastName: body.displayLastName,
      personalInfo: body.personalInfo,
      guardian: body.guardian,
    });

    res.status(201).json(profile);
  } catch (error) {
    console.error(error);
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

    const profile = await getProfileForUser(auth0Id);
    if (!profile?.squareCustomerId) {
      return res.json([]);
    }

    const subscriptions = await getMemberSubscriptions(profile.squareCustomerId);
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

    const profile = await getProfileForUser(auth0Id);
    if (!profile) {
      return res.json({ enrollment: null });
    }

    const enrollment = await getMemberIntroEnrollment(profile.squareCustomerId ?? null);
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

    const body = req.body;
    const existing = await getProfileForUser(auth0Id);
    if (!existing) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const updated = await updateMemberProfileById(existing._id.toString(), body.data);
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

    const lastCheckIn = await getLastCheckInForMember(memberProfileId);
    res.json({ lastCheckIn });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
