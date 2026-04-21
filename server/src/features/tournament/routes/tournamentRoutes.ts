import { Router, Request, Response } from 'express';
import { tournamentService, registrationService, tournamentSquareService, SubmitRegistrationData } from '../services';
import { RegistrationRequestDto } from '../dto';
import { checkJwt, getAuth0Id, requireRole } from '../../../middleware/auth';
import { memberProfileService } from '../../../services/memberProfileService';

const router = Router();

/**
 * GET /api/tournaments
 * Get all tournaments from M2
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const tournaments = await tournamentService.getClubTournaments();
    res.json(tournaments);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({ error: 'Failed to fetch tournaments' });
  }
});

/**
 * GET /api/tournaments/clubs
 * Get all clubs from M2
 */
router.get('/clubs', async (_req: Request, res: Response) => {
  try {
    const clubs = await tournamentService.getClubs();
    res.json(clubs);
  } catch (error) {
    console.error('Error fetching clubs:', error);
    res.status(500).json({ error: 'Failed to fetch clubs' });
  }
});

/**
 * GET /api/tournaments/user/registrations
 * Get current user's tournament registrations
 */
router.get('/user/registrations', checkJwt, async (req: Request, res: Response) => {
  try {
    const auth0Id = getAuth0Id(req);
    if (!auth0Id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const registrations = await registrationService.getRegistrantsByUser(auth0Id);
    res.json(registrations);
  } catch (error) {
    console.error('Error fetching user registrations:', error);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

/**
 * GET /api/tournaments/:m2TournamentId
 * Get tournament details by M2 ID
 */
router.get('/:m2TournamentId', async (req: Request, res: Response) => {
  try {
    const m2TournamentId = Number.parseInt(req.params.m2TournamentId, 10);
    if (Number.isNaN(m2TournamentId)) {
      return res.status(400).json({ error: 'Invalid tournament ID' });
    }

    const tournament = await tournamentService.getTournamentDetails(m2TournamentId);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    res.json(tournament);
  } catch (error) {
    console.error('Error fetching tournament:', error);
    res.status(500).json({ error: 'Failed to fetch tournament' });
  }
});

/**
 * GET /api/tournaments/:m2TournamentId/registrants
 * Get registrants for a tournament (admin only in future)
 */
router.get('/:m2TournamentId/registrants', async (req: Request, res: Response) => {
  try {
    const m2TournamentId = Number.parseInt(req.params.m2TournamentId, 10);
    if (Number.isNaN(m2TournamentId)) {
      return res.status(400).json({ error: 'Invalid tournament ID' });
    }

    const registrants = await registrationService.getRegistrantsByTournament(m2TournamentId);
    res.json(registrants);
  } catch (error) {
    console.error('Error fetching registrants:', error);
    res.status(500).json({ error: 'Failed to fetch registrants' });
  }
});

/**
 * GET /api/tournaments/user/profile-data
 * Get user profile data for form auto-fill
 */
router.get('/user/profile-data', checkJwt, async (req: Request, res: Response) => {
  try {
    const auth0Id = getAuth0Id(req);
    if (!auth0Id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const profile = await memberProfileService.getByAuth0Id(auth0Id);
    if (!profile) {
      return res.json(null);
    }

    res.json({
      preferredFirstName: profile.displayFirstName,
      preferredLastName: profile.displayLastName,
      legalFirstName: profile.personalInfo?.legalFirstName,
      legalLastName: profile.personalInfo?.legalLastName,
      email: profile.personalInfo?.email,
      phoneNumber: profile.personalInfo?.phone,
      guardianFirstName: profile.guardian?.firstName,
      guardianLastName: profile.guardian?.lastName,
    });
  } catch (error) {
    console.error('Error fetching profile data:', error);
    res.status(500).json({ error: 'Failed to fetch profile data' });
  }
});

/**
 * POST /api/tournaments/:m2TournamentId/register
 * Submit tournament registration
 */
router.post('/:m2TournamentId/register', async (req: Request, res: Response) => {
  try {
    const m2TournamentId = Number.parseInt(req.params.m2TournamentId, 10);
    if (Number.isNaN(m2TournamentId)) {
      return res.status(400).json({ error: 'Invalid tournament ID' });
    }

    const body: RegistrationRequestDto = req.body;

    const tournament = await tournamentService.getTournamentDetails(m2TournamentId);
    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    const auth0Id = getAuth0Id(req);
    let userId: string | undefined;
    const baseFeeChargedInCents = tournament.basePriceInCents;

    if (auth0Id) {
      const profile = await memberProfileService.getByAuth0Id(auth0Id);
      userId = profile?._id;
    }

    const submitData: SubmitRegistrationData = {
      m2TournamentId,
      tournamentName: tournament.name,
      selectedEvents: body.selectedEvents,
      preferredFirstName: body.preferredFirstName,
      preferredLastName: body.preferredLastName,
      legalFirstName: body.legalFirstName,
      legalLastName: body.legalLastName,
      email: body.email,
      phoneNumber: body.phoneNumber,
      clubAffiliation: body.clubAffiliation,
      isMinor: body.isMinor,
      guardianFirstName: body.guardianFirstName,
      guardianLastName: body.guardianLastName,
      baseFeeChargedInCents,
      userId,
      auth0Id,
      isRequestedAlternativeQualification: body.isRequestedAlternativeQualification,
    };

    const { registrant, paymentId } = await registrationService.submitRegistration(submitData);

    const { paymentUrl } = await tournamentSquareService.createOrderWithPaymentLink({
      tournamentName: tournament.name,
      selectedEvents: body.selectedEvents,
      baseFeeInCents: baseFeeChargedInCents,
      paymentId,
      m2TournamentId,
      registrantId: registrant.id,
    });

    res.json({
      registrantId: registrant.id,
      paymentId,
      paymentUrl,
    });
  } catch (error) {
    console.error('Error submitting registration:', error);
    res.status(500).json({ error: 'Failed to submit registration' });
  }
});

/**
 * GET /api/tournaments/admin/all
 * Get all tournaments including disabled ones (admin only)
 */
router.get('/admin/all', checkJwt, requireRole('club-admin'), async (_req: Request, res: Response) => {
  try {
    const tournaments = await tournamentService.getClubTournamentsForAdmin();
    res.json(tournaments);
  } catch (error) {
    console.error('Error fetching tournaments for admin:', error);
    res.status(500).json({ error: 'Failed to fetch tournaments' });
  }
});

/**
 * PATCH /api/tournaments/admin/:m2TournamentId/toggle
 * Toggle tournament visibility (admin only)
 */
router.patch('/admin/:m2TournamentId/toggle', checkJwt, requireRole('club-admin'), async (req: Request, res: Response) => {
  try {
    const m2TournamentId = Number.parseInt(req.params.m2TournamentId, 10);
    if (Number.isNaN(m2TournamentId)) {
      return res.status(400).json({ error: 'Invalid tournament ID' });
    }

    const { isEnabled, name } = req.body;
    if (typeof isEnabled !== 'boolean') {
      return res.status(400).json({ error: 'isEnabled must be a boolean' });
    }
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'name is required' });
    }

    const auth0Id = getAuth0Id(req);
    const updated = await tournamentService.setTournamentEnabled(m2TournamentId, name, isEnabled, auth0Id);

    res.json(updated);
  } catch (error) {
    console.error('Error toggling tournament visibility:', error);
    res.status(500).json({ error: 'Failed to update tournament' });
  }
});

export default router;
