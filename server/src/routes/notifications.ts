import { Router, Response } from 'express';
import { registerClient } from '../services/realtime.ts';
import { optionalAuth, AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();
router.use(optionalAuth);

// GET /api/notifications/stream - Server-Sent Events (SSE) endpoint
router.get('/stream', (req: AuthenticatedRequest, res: Response): any => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Bắt buộc đăng nhập để nhận thông báo thời gian thực.',
    });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable proxy buffering (for Render, NGINX)
  res.flushHeaders?.();

  registerClient(res);

  // Send periodic keep-alive every 25 seconds
  const keepAliveInterval = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(keepAliveInterval);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(keepAliveInterval);
  });
});

export default router;
