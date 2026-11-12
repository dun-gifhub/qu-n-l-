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

router.post('/connect-db', async (req: Request, res: Response): Promise<any> => {
  try {
    const { databaseUrl } = req.body || {};
    if (!databaseUrl || typeof databaseUrl !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp chuỗi kết nối databaseUrl (bắt đầu bằng postgresql://)',
      });
    }

    const result = await dbService.connectPostgres(databaseUrl);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    return res.json({
      success: true,
      message: result.message,
      data: result.stats,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Lỗi kết nối cơ sở dữ liệu Neon',
    });
  }
});

export default router;
