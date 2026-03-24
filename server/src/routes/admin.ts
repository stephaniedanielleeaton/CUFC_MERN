import { Router, Request, Response } from 'express';
import { checkJwt, requireRole } from '../middleware/auth';
import { adminService } from '../services/adminService';
import { MemberUpdateData } from '@cufc/shared';

const router = Router();

router.get('/members', checkJwt, requireRole('club-admin'), async (_req: Request, res: Response) => {
  try {
    const members = await adminService.getAllMembers();
    res.json({ members });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/members/square-status', checkJwt, requireRole('club-admin'), async (_req: Request, res: Response) => {
  try {
    const status = await adminService.getAllMembersSquareStatus();
    res.json(status);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/members/:id/subscription-status', checkJwt, requireRole('club-admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const status = await adminService.getMemberSubscriptionStatus(id);
    res.json(status);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/members/:id/transactions', checkJwt, requireRole('club-admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const transactions = await adminService.getMemberTransactions(id);
    res.json({ transactions });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.get('/members/:id/attendance', checkJwt, requireRole('club-admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const attendance = await adminService.getMemberAttendance(id);
    res.json({ attendance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.patch('/members/:id', checkJwt, requireRole('club-admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body: MemberUpdateData = req.body;
    const updated = await adminService.updateMember(id, body);

    if (!updated) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.delete('/members/:id', checkJwt, requireRole('club-admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await adminService.deleteMember(id);
    
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
