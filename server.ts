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

// Support --port flag passed by package.json / runner
let argPort = 3000;
const portArgIndex = process.argv.indexOf('--port');
if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
  argPort = Number(process.argv[portArgIndex + 1]);
}
const PORT = Number(process.env.PORT) || argPort || 3000;

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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n  VITE v8.3.0  ready in 150 ms\n`);
    console.log(`  ➜  Local:   http://localhost:${PORT}/`);
    console.log(`  ➜  Network: http://0.0.0.0:${PORT}/\n`);
    console.log(`🚀 DeviceMonitor Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
