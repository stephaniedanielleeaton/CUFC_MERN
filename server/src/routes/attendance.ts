import { Router, Request, Response } from 'express';
import { getMembersWithCheckInStatus, checkInMember, getRecentAttendanceForAllMembers } from '../services/attendanceService';
import { getAllMemberIds } from '../services/memberProfileService';
import { checkJwt, requireRole } from '../middleware/auth';

const router = Router();

// GET /api/attendance/members - Get all members with check-in status
router.get('/members', async (_req: Request, res: Response) => {
  try {
    const result = await getMembersWithCheckInStatus();
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// POST /api/attendance/checkin - Check in a member
router.post('/checkin', async (req: Request, res: Response) => {
  try {
    const { memberId } = req.body;
    
    if (!memberId) {
      return res.status(400).json({ error: 'Missing memberId' });
    }

    const result = await checkInMember(memberId);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/attendance/recent - Get recent attendance (admin only)
router.get('/recent', checkJwt, requireRole('club-admin'), async (_req: Request, res: Response) => {
  try {
    const memberIds = await getAllMemberIds();
    const result = await getRecentAttendanceForAllMembers(memberIds);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
