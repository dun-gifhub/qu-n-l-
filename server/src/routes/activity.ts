import { Router, Response } from 'express';
import { dbService } from '../db/db.ts';
import { requireAuth, requireApproved, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// GET /api/activity - Aggregated activity feed
router.get('/', async (req: any, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    const activities = await dbService.getActivitiesForUser(userId);
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
