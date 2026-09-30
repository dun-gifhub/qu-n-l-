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

export default router;
