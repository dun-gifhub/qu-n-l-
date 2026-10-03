import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './server/src/db/db.ts';
import authRouter from './server/src/routes/auth.ts';
import devicesRouter from './server/src/routes/devices.ts';
import activityRouter from './server/src/routes/activity.ts';
import healthRouter from './server/src/routes/health.ts';
import usersRouter from './server/src/routes/users.ts';
import notificationsRouter from './server/src/routes/notifications.ts';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Support --port flag passed by package.json / runner or default to 10000 on Render / 3000 locally
let argPort = 0;
const portArgIndex = process.argv.indexOf('--port');
if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
  argPort = Number(process.argv[portArgIndex + 1]);
}
// Render provides PORT env variable; if unset on Render default is 10000, locally default is 3000
const PORT = Number(process.env.PORT) || argPort || (process.env.RENDER ? 10000 : 3000);

// Global protection against unhandled crashes (prevents Render WORKER TIMEOUT / SIGKILL 502 Bad Gateway)
process.on('uncaughtException', (err) => {
  console.error('⚠️ Uncaught Exception intercepted to keep service alive:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.warn('⚠️ Unhandled Rejection intercepted at:', promise, 'reason:', reason);
});

async function startServer() {
  const app = express();

  // High-performance gzip/brotli compression for all requests
  app.use(compression());

  // Basic security and parsing middlewares
  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // Initialize Database (Neon PostgreSQL with local fallback)
  const dbStatus = await initDatabase();
  console.log(`Database engine initialized: ${dbStatus.isPostgres ? 'Neon PostgreSQL' : 'Local Persistent Engine'}`);

  // Register direct mobile endpoints (from Flutter / Android / iOS app screenshots)
  app.post('/report', (req, res, next) => {
    req.url = '/report';
    return devicesRouter(req, res, next);
  });
  app.post('/uninstall', (req, res, next) => {
    req.url = '/uninstall';
    return devicesRouter(req, res, next);
  });
  app.use('/api/report', (req, res, next) => {
    req.url = '/report';
    return devicesRouter(req, res, next);
  });
  app.use('/api/uninstall', (req, res, next) => {
    req.url = '/uninstall';
    return devicesRouter(req, res, next);
  });

  // Register REST API routes
  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/users', usersRouter);
  app.use('/api/devices', devicesRouter);
  app.use('/api/activity', activityRouter);
  app.use('/api/notifications', notificationsRouter);

  // Serve Frontend
  if (!isProduction) {
    // Development mode: mount Vite dev middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Dev SPA fallback so client routes (/report, /dashboard, etc.) resolve index.html
    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api/')) {
        return next();
      }
      try {
        const url = req.originalUrl;
        const indexPath = path.resolve(process.cwd(), 'index.html');
        if (fs.existsSync(indexPath)) {
          let template = fs.readFileSync(indexPath, 'utf-8');
          template = await vite.transformIndexHtml(url, template);
          res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
        } else {
          next();
        }
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

    console.log('⚡ Vite dev server middleware mounted with SPA fallback');
  } else {
    // Production mode: serve built static files from dist/
    const distPath = path.resolve(process.cwd(), 'dist');
    const indexPath = path.join(distPath, 'index.html');

    // Auto-build fallback if dist/index.html is missing on deployment
    if (!fs.existsSync(indexPath)) {
      console.log('⚠️ dist/index.html not found! Triggering automatic build...');
      try {
        const { execSync } = await import('child_process');
        execSync('npx vite build', { stdio: 'inherit' });
        console.log('✅ Frontend built successfully!');
      } catch (err) {
        console.error('❌ Failed to auto-build frontend:', err);
      }
    }

    if (fs.existsSync(indexPath)) {
      app.use(
        express.static(distPath, {
          maxAge: '1y',
          immutable: true,
          setHeaders: (res, filePath) => {
            if (filePath.endsWith('.html')) {
              res.setHeader('Cache-Control', 'no-cache');
            }
          },
        })
      );
      app.get('*', (_req, res) => {
        res.setHeader('Cache-Control', 'no-cache');
        res.sendFile(indexPath);
      });
      console.log('📦 Serving production build from dist/ with high-speed caching & gzip');
    } else {
      // Fallback if build somehow failed
      app.get('*', (_req, res) => {
        res.status(500).send(`
          <!DOCTYPE html>
          <html>
            <head><title>Build Required</title><meta charset="utf-8"></head>
            <body style="font-family: sans-serif; padding: 40px; text-align: center; background: #0f172a; color: #f8fafc;">
              <h2>⚠️ Frontend chưa được build</h2>
              <p>Vui lòng cập nhật <strong>Build Command</strong> trên Render thành: <br><code style="background: #1e293b; padding: 6px 12px; border-radius: 8px; color: #38bdf8;">npm install && npm run build</code></p>
            </body>
          </html>
        `);
      });
    }
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  VITE v8.3.0  ready in 150 ms\n`);
    console.log(`  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`  ➜  Network: http://0.0.0.0:${PORT}/\n`);
    console.log(`🚀 DeviceMonitor Server running on http://0.0.0.0:${PORT}`);
  });

  // Prevent 502 Bad Gateway on Render (Connection reset by peer):
  // Render load balancer keep-alive timeout is ~90-100s. Node.js default is 5s.
  // keepAliveTimeout must exceed reverse proxy timeout, and headersTimeout must exceed keepAliveTimeout.
  server.keepAliveTimeout = 120000; // 120s
  server.headersTimeout = 125000;   // 125s
  server.requestTimeout = 300000;   // 300s (5 minutes)

  const gracefulShutdown = (signal: string) => {
    console.log(`Received ${signal}. Gracefully closing HTTP server...`);
    server.close(() => {
      console.log('HTTP server closed cleanly.');
      process.exit(0);
    });
    setTimeout(() => {
      console.error('Forced shutdown after timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
