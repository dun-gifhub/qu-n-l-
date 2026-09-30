import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { initDatabase } from './server/src/db/db.ts';
import authRouter from './server/src/routes/auth.ts';
import devicesRouter from './server/src/routes/devices.ts';
import activityRouter from './server/src/routes/activity.ts';
import healthRouter from './server/src/routes/health.ts';

dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  const app = express();

  // Basic security and parsing middlewares
  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Initialize Database (Neon PostgreSQL with local fallback)
  const dbStatus = await initDatabase();
  console.log(`Database engine initialized: ${dbStatus.isPostgres ? 'Neon PostgreSQL' : 'Local Persistent Engine'}`);

  // Register REST API routes
  app.use('/api/health', healthRouter);
  app.use('/api/auth', authRouter);
  app.use('/api/devices', devicesRouter);
  app.use('/api/activity', activityRouter);

  // Serve Frontend
  if (!isProduction) {
    // Development mode: mount Vite dev middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('⚡ Vite dev server middleware mounted');
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
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(indexPath);
      });
      console.log('📦 Serving production build from dist/');
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
    console.log(`🚀 DeviceMonitor Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
