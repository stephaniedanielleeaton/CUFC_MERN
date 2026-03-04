import { Router, Request, Response } from 'express';
import { checkJwt, requireRole } from '../middleware/auth';
import { 
  updateMemberProfileById, 
  getAllMemberProfiles, 
  deleteMemberProfileById,
  getSquareCustomerIdForMember,
  getMembersWithSquareCustomerId,
  getAllMemberIds
} from '../services/memberProfileService';
import { MemberUpdateData } from '@cufc/shared';
import { getMemberAttendanceHistory } from '../services/attendanceService';
import { 
  getMemberSubscriptionStatus, 
  getAllMembersSquareStatus, 
  getMemberTransactions 
} from '../services/square/subscriptionService';

const router = Router();

// GET /api/admin/members - Get all members (admin only)
router.get('/members', checkJwt, requireRole('club-admin'), async (_req: Request, res: Response) => {
  try {
    const profiles = await getAllMemberProfiles();
    res.json({ members: profiles });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/admin/members/square-status - Get Square subscription status for all members
router.get('/members/square-status', checkJwt, requireRole('club-admin'), async (_req: Request, res: Response) => {
  try {
    const membersWithSquare = await getMembersWithSquareCustomerId();
    const status = await getAllMembersSquareStatus(membersWithSquare);
    res.json(status);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/admin/members/:id/subscription-status - Check if member has active subscription
router.get('/members/:id/subscription-status', checkJwt, requireRole('club-admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const squareCustomerId = await getSquareCustomerIdForMember(id);
    const status = await getMemberSubscriptionStatus(squareCustomerId);
    res.json(status);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/admin/members/:id/transactions - Get member's transactions
router.get('/members/:id/transactions', checkJwt, requireRole('club-admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const squareCustomerId = await getSquareCustomerIdForMember(id);
    
    if (!squareCustomerId) {
      return res.json({ transactions: [] });
    }
    
    const transactions = await getMemberTransactions(squareCustomerId);
    res.json({ transactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/admin/members/:id/attendance - Get member's attendance history
router.get('/members/:id/attendance', checkJwt, requireRole('club-admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const attendance = await getMemberAttendanceHistory(id);
    res.json({ attendance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// PATCH /api/admin/members/:id - Update a member (admin only)
router.patch('/members/:id', checkJwt, requireRole('club-admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body: MemberUpdateData = req.body;

    const updated = await updateMemberProfileById(id, body);

    if (!updated) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE /api/admin/members/:id - Delete a member (admin only)
router.delete('/members/:id', checkJwt, requireRole('club-admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await deleteMemberProfileById(id);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
