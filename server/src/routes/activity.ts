import { Router, Response } from 'express';
import { dbService } from '../db/db.ts';
import { requireAuth, requireApproved, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/activity - Aggregated activity feed for accessible devices (Admin: all, Teacher: school, Parent: own child)
router.get('/', requireAuth, requireApproved, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const activities = await dbService.getActivitiesForUser(req.user!.userId);
    return res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Không thể tải lịch sử hoạt động',
    });
  }
});

export default router;
