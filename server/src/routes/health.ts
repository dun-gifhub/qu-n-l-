import { Router, Request, Response } from 'express';
import { dbService } from '../db/db.ts';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    database: {
      type: dbService.isPostgres() ? 'Neon PostgreSQL' : 'Local Persistent Storage',
      status: 'healthy',
    },
    version: '1.0.0',
  });
});

router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await dbService.getDatabaseStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi đọc trạng thái cơ sở dữ liệu',
    });
  }
});

export default router;
