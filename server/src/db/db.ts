import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  UserRecord,
  DeviceRecord,
  DeviceLocationRecord,
  DeviceStatusRecord,
  SessionRecord,
  ActivityEvent,
  AppUsageItem,
  WebVisitItem,
  PhoneContact,
  ApprovalStatus,
  UserRole,
  PlatformType,
  NetworkType,
} from '../types/index.ts';

interface DBState {
  users: UserRecord[];
  devices: DeviceRecord[];
  locations: DeviceLocationRecord[];
  statuses: DeviceStatusRecord[];
  sessions: SessionRecord[];
  activities: ActivityEvent[];
  appUsages: AppUsageItem[];
  webHistory: WebVisitItem[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'database.json');

let pgPool: Pool | null = null;
let isPostgresConnected = false;

export function normalizeSchoolName(school?: string): string {
  return (school || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function createInitialEmptyState(): DBState {
  return {
    users: [],
    devices: [],
    locations: [],
    statuses: [],
    sessions: [],
    activities: [],
    appUsages: [],
    webHistory: [],
  };
}

function ensureDefaultAdmin(state: DBState): DBState {
  if (!state.users) {
    state.users = [];
  }

  // Load Admin credentials from Environment Variables (with fallback defaults)
  const envEmail = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.trim().toLowerCase() : '';
  const adminEmail = envEmail || 'admin@devicemonitor.com';
  const adminPassword = process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD.trim() : 'admin123';
  const adminName = process.env.ADMIN_NAME ? process.env.ADMIN_NAME.trim() : 'Quản Trị Viên (Admin)';
  const adminPhone = process.env.ADMIN_PHONE ? process.env.ADMIN_PHONE.trim() : '0901234567';
  const adminSchool = process.env.ADMIN_SCHOOL ? process.env.ADMIN_SCHOOL.trim() : 'THPT Chuyên Lê Hồng Phong';

  const nowIso = new Date().toISOString();
  let existingAdmin = state.users.find(
    (u) => u.email.toLowerCase() === adminEmail || (u.role === 'ADMIN' && (!envEmail || u.email.toLowerCase() === envEmail))
  );

  if (!existingAdmin) {
    // If no admin exists with the env/default email, create one
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(adminPassword, salt);
    const newAdmin = {
      id: 'usr_admin_master',
      name: adminName,
      email: adminEmail,
      passwordHash,
      role: 'ADMIN' as const,
      approvalStatus: 'APPROVED' as const,
      schoolName: adminSchool,
      phone: adminPhone,
      approvedBy: 'Cấu hình Environment',
      approvedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    state.users.unshift(newAdmin);
    writeLocalDB(state);
  } else if (process.env.ADMIN_EMAIL || process.env.ADMIN_PASSWORD || process.env.ADMIN_NAME) {
    // Sync existing admin with provided environment variables
    let modified = false;
    if (envEmail && existingAdmin.email.toLowerCase() !== envEmail) {
      existingAdmin.email = envEmail;
      modified = true;
    }
    if (process.env.ADMIN_PASSWORD) {
      const isMatch = bcrypt.compareSync(adminPassword, existingAdmin.passwordHash);
      if (!isMatch) {
        const salt = bcrypt.genSaltSync(10);
        existingAdmin.passwordHash = bcrypt.hashSync(adminPassword, salt);
        modified = true;
      }
    }
    if (process.env.ADMIN_NAME && existingAdmin.name !== adminName) {
      existingAdmin.name = adminName;
      modified = true;
    }
    if (existingAdmin.role !== 'ADMIN') {
      existingAdmin.role = 'ADMIN';
      existingAdmin.approvalStatus = 'APPROVED';
      modified = true;
    }
    if (modified) {
      existingAdmin.updatedAt = nowIso;
      writeLocalDB(state);
    }
  }

  return state;
}

export async function initDatabase(): Promise<{ isPostgres: boolean }> {
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl && (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) && !dbUrl.includes('user:password@ep-xyz')) {
    try {
      pgPool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
        keepAlive: true,
      });

      pgPool.on('error', (err) => {
        console.warn('PostgreSQL pool background warning (using local persistent store):', err.message);
      });

      const client = await pgPool.connect();
      console.log('Successfully connected to Neon PostgreSQL database.');
      isPostgresConnected = true;

      // 1. Auto-create required tables in Neon PostgreSQL if not exist
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          "passwordHash" TEXT NOT NULL,
          role TEXT DEFAULT 'TEACHER',
          "approvalStatus" TEXT DEFAULT 'APPROVED',
          "schoolName" TEXT,
          grade TEXT,
          "className" TEXT,
          "studentName" TEXT,
          phone TEXT,
          "approvedBy" TEXT,
          "approvedAt" TEXT,
          "createdAt" TEXT,
          "updatedAt" TEXT
        );

        CREATE TABLE IF NOT EXISTS devices (
          id TEXT PRIMARY KEY,
          "userId" TEXT,
          "deviceUuid" TEXT,
          name TEXT NOT NULL,
          platform TEXT NOT NULL,
          "osVersion" TEXT,
          "appVersion" TEXT,
          "studentName" TEXT,
          "schoolName" TEXT,
          "className" TEXT,
          "ownerName" TEXT,
          "ownerEmail" TEXT,
          "currentApp" TEXT,
          "currentWebsite" TEXT,
          "screenTimeMinutes" INTEGER DEFAULT 0,
          "blockedApps" TEXT[] DEFAULT '{}',
          "blockedWebsites" TEXT[] DEFAULT '{}',
          status TEXT DEFAULT 'ONLINE',
          "batteryLevel" INTEGER DEFAULT 100,
          charging BOOLEAN DEFAULT false,
          "networkType" TEXT DEFAULT 'WIFI',
          "locationPermission" BOOLEAN DEFAULT true,
          "locationSharing" BOOLEAN DEFAULT true,
          latitude DOUBLE PRECISION,
          longitude DOUBLE PRECISION,
          accuracy DOUBLE PRECISION,
          "lastSeen" TEXT,
          "createdAt" TEXT,
          "updatedAt" TEXT
        );

        CREATE TABLE IF NOT EXISTS device_locations (
          id TEXT PRIMARY KEY,
          "deviceId" TEXT NOT NULL,
          latitude DOUBLE PRECISION NOT NULL,
          longitude DOUBLE PRECISION NOT NULL,
          accuracy DOUBLE PRECISION,
          timestamp TEXT,
          "createdAt" TEXT
        );

        CREATE TABLE IF NOT EXISTS device_statuses (
          id TEXT PRIMARY KEY,
          "deviceId" TEXT NOT NULL,
          "batteryLevel" INTEGER NOT NULL,
          charging BOOLEAN NOT NULL,
          "networkType" TEXT NOT NULL,
          "locationPermission" BOOLEAN DEFAULT true,
          "locationSharing" BOOLEAN DEFAULT true,
          status TEXT NOT NULL,
          timestamp TEXT
        );

        CREATE TABLE IF NOT EXISTS activities (
          id TEXT PRIMARY KEY,
          "deviceId" TEXT NOT NULL,
          "deviceName" TEXT NOT NULL,
          platform TEXT NOT NULL,
          "studentName" TEXT,
          "schoolName" TEXT,
          "className" TEXT,
          type TEXT NOT NULL,
          description TEXT NOT NULL,
          timestamp TEXT,
          metadata JSONB
        );

        CREATE TABLE IF NOT EXISTS app_usages (
          id TEXT PRIMARY KEY,
          "deviceId" TEXT NOT NULL,
          "appName" TEXT NOT NULL,
          "packageName" TEXT,
          category TEXT,
          icon TEXT,
          "durationMinutes" INTEGER DEFAULT 0,
          "lastUsed" TEXT,
          "isRunning" BOOLEAN DEFAULT false,
          "isBlocked" BOOLEAN DEFAULT false,
          "riskLevel" TEXT DEFAULT 'SAFE',
          "createdAt" TEXT,
          "updatedAt" TEXT
        );

        CREATE TABLE IF NOT EXISTS web_history (
          id TEXT PRIMARY KEY,
          "deviceId" TEXT NOT NULL,
          url TEXT NOT NULL,
          domain TEXT,
          "pageTitle" TEXT,
          category TEXT,
          "visitCount" INTEGER DEFAULT 1,
          "durationMinutes" INTEGER DEFAULT 0,
          "isBlocked" BOOLEAN DEFAULT false,
          timestamp TEXT,
          "createdAt" TEXT,
          "updatedAt" TEXT
        );
      `);

      // 2. CRITICAL MIGRATION: Alter existing tables to add all missing columns and remove blocking constraints
      await client.query(`
        -- Add missing columns to devices
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS "studentName" TEXT;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS "studentId" TEXT;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS "schoolName" TEXT;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS grade TEXT;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS "className" TEXT;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS "parentPhone" TEXT;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS "phoneContacts" JSONB DEFAULT '[]'::jsonb;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS "ownerName" TEXT;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS "ownerEmail" TEXT;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS "ownerRole" TEXT;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS "currentApp" TEXT;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS "currentWebsite" TEXT;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS "screenTimeMinutes" INTEGER DEFAULT 0;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS "blockedApps" TEXT[] DEFAULT '{}';
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS "blockedWebsites" TEXT[] DEFAULT '{}';
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ONLINE';
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS "batteryLevel" INTEGER DEFAULT 100;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS charging BOOLEAN DEFAULT false;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS "networkType" TEXT DEFAULT 'WIFI';
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS "locationPermission" BOOLEAN DEFAULT true;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS "locationSharing" BOOLEAN DEFAULT true;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS accuracy DOUBLE PRECISION;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS "isUninstalled" BOOLEAN DEFAULT false;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS "uninstalledAt" TEXT;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS "disconnectReason" TEXT;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS "lastHeartbeatAt" TEXT;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS "inClassAlert" BOOLEAN DEFAULT false;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS "isNoNetwork" BOOLEAN DEFAULT false;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS "lastSeen" TEXT;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS "createdAt" TEXT;
        ALTER TABLE devices ADD COLUMN IF NOT EXISTS "updatedAt" TEXT;

        -- Remove strict foreign key constraints that would block direct phone reports
        ALTER TABLE devices DROP CONSTRAINT IF EXISTS "devices_userId_fkey";
        ALTER TABLE devices ALTER COLUMN "userId" DROP NOT NULL;
        ALTER TABLE device_locations DROP CONSTRAINT IF EXISTS "device_locations_deviceId_fkey";
        ALTER TABLE device_statuses DROP CONSTRAINT IF EXISTS "device_statuses_deviceId_fkey";

        -- Add missing columns to users
        ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'TEACHER';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS "approvalStatus" TEXT DEFAULT 'APPROVED';
        ALTER TABLE users ADD COLUMN IF NOT EXISTS "schoolName" TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS grade TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS "className" TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS "studentName" TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS "approvedBy" TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS "approvedAt" TEXT;

        -- Ensure default user exists
        INSERT INTO users (id, name, email, "passwordHash", role, "approvalStatus", "createdAt", "updatedAt")
        VALUES ('usr_default', 'Học Sinh / Thiết Bị', 'device@devicemonitor.com', 'nologin', 'PARENT', 'APPROVED', NOW()::text, NOW()::text)
        ON CONFLICT (id) DO NOTHING;

        -- Create indices for high-speed queries
        CREATE INDEX IF NOT EXISTS idx_devices_lastseen ON devices ("lastSeen");
        CREATE INDEX IF NOT EXISTS idx_device_locations_dev_time ON device_locations ("deviceId", timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_device_statuses_dev_time ON device_statuses ("deviceId", timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_activities_time ON activities (timestamp DESC);
      `);

      // 1. Sync users from Neon into local state (Neon is authoritative; deleted users never reappear)
      try {
        const userRes = await client.query('SELECT * FROM users');
        const state = readLocalDB();
        if (userRes.rows && userRes.rows.length > 0) {
          // Adopt Neon PostgreSQL user records as single source of truth
          state.users = userRes.rows as UserRecord[];
          console.log(`Synced ${userRes.rows.length} users from Neon PostgreSQL.`);
        } else {
          // If Neon table was completely empty, seed it with local users
          for (const u of state.users) {
            await client.query(
              `INSERT INTO users (
                id, name, email, "passwordHash", role, "approvalStatus", "schoolName", grade, "className", "studentName", phone, "approvedBy", "approvedAt", "createdAt", "updatedAt"
              )
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
              ON CONFLICT (email) DO UPDATE SET
                id = EXCLUDED.id,
                name = EXCLUDED.name,
                "passwordHash" = EXCLUDED."passwordHash",
                role = EXCLUDED.role,
                "approvalStatus" = EXCLUDED."approvalStatus",
                "schoolName" = EXCLUDED."schoolName",
                grade = EXCLUDED.grade,
                "className" = EXCLUDED."className",
                "studentName" = EXCLUDED."studentName",
                phone = EXCLUDED.phone,
                "updatedAt" = EXCLUDED."updatedAt"`,
              [
                u.id,
                u.name,
                u.email,
                u.passwordHash,
                u.role,
                u.approvalStatus,
                u.schoolName || null,
                u.grade || null,
                u.className || null,
                u.studentName || null,
                u.phone || null,
                u.approvedBy || null,
                u.approvedAt || null,
                u.createdAt,
                u.updatedAt || new Date().toISOString(),
              ]
            ).catch((e: any) => console.warn('Neon initial user push warning:', e.message));
          }
        }

        // 2. Sync devices from Neon into local state
        const devRes = await client.query('SELECT * FROM devices');
        if (devRes.rows && devRes.rows.length > 0) {
          for (const d of devRes.rows) {
            const idx = state.devices.findIndex(x => x.id === d.id);
            if (idx === -1) {
              state.devices.push(d);
            } else {
              state.devices[idx] = { ...state.devices[idx], ...d };
            }
          }
          console.log(`Synced ${devRes.rows.length} devices from Neon PostgreSQL.`);
        }

        // Push local devices to Neon if missing
        for (const d of state.devices) {
          await client.query(
            `INSERT INTO devices (
              id, "userId", "deviceUuid", name, platform, "studentName", "studentId", "schoolName", grade, "className",
              "parentPhone", "currentApp", "currentWebsite", "batteryLevel", charging, "networkType",
              latitude, longitude, accuracy, "isUninstalled", "uninstalledAt", status, "lastSeen", "createdAt", "updatedAt"
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
            ON CONFLICT (id) DO UPDATE SET
              name = EXCLUDED.name,
              platform = EXCLUDED.platform,
              "studentName" = COALESCE(EXCLUDED."studentName", devices."studentName"),
              "schoolName" = COALESCE(EXCLUDED."schoolName", devices."schoolName"),
              "className" = COALESCE(EXCLUDED."className", devices."className"),
              "parentPhone" = COALESCE(EXCLUDED."parentPhone", devices."parentPhone"),
              "currentApp" = EXCLUDED."currentApp",
              "currentWebsite" = EXCLUDED."currentWebsite",
              "batteryLevel" = EXCLUDED."batteryLevel",
              charging = EXCLUDED.charging,
              "networkType" = EXCLUDED."networkType",
              latitude = EXCLUDED.latitude,
              longitude = EXCLUDED.longitude,
              accuracy = EXCLUDED.accuracy,
              status = EXCLUDED.status,
              "lastSeen" = EXCLUDED."lastSeen",
              "updatedAt" = EXCLUDED."updatedAt"`,
            [
              d.id,
              d.userId || 'usr_default',
              d.deviceUuid,
              d.name,
              d.platform || 'Android',
              d.studentName || d.name,
              d.studentId || '',
              d.schoolName || '',
              d.grade || '',
              d.className || '',
              d.parentPhone || '',
              d.currentApp || 'Màn hình chính',
              d.currentWebsite || 'google.com',
              d.batteryLevel ?? 100,
              Boolean(d.charging),
              d.networkType || 'WIFI',
              d.latitude,
              d.longitude,
              d.accuracy,
              Boolean(d.isUninstalled),
              d.uninstalledAt || null,
              d.status || 'ONLINE',
              d.lastSeen || new Date().toISOString(),
              d.createdAt || new Date().toISOString(),
              d.updatedAt || new Date().toISOString(),
            ]
          ).catch((e: any) => console.warn('Neon push device warning:', e.message));
        }

        // 3. Sync device location history from Neon into local state (Chỉ thêm không bớt)
        const locRes = await client.query('SELECT * FROM device_locations ORDER BY timestamp DESC LIMIT 50000');
        if (locRes.rows && locRes.rows.length > 0) {
          for (const l of locRes.rows) {
            if (!state.locations.some(x => x.id === l.id)) {
              state.locations.push(l);
            }
          }
          console.log(`Synced ${locRes.rows.length} location history points from Neon.`);
        }

        // Push all local location records to Neon
        for (const loc of state.locations) {
          await client.query(
            `INSERT INTO device_locations (id, "deviceId", latitude, longitude, accuracy, timestamp, "createdAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (id) DO NOTHING`,
            [loc.id, loc.deviceId, loc.latitude, loc.longitude, loc.accuracy, loc.timestamp, loc.createdAt || loc.timestamp]
          ).catch(() => {});
        }

        // 4. Sync activities from Neon into local state
        const actRes = await client.query('SELECT * FROM activities ORDER BY timestamp DESC LIMIT 1000');
        if (actRes.rows && actRes.rows.length > 0) {
          for (const a of actRes.rows) {
            if (!state.activities.some(x => x.id === a.id)) {
              state.activities.push(a);
            }
          }
          console.log(`Synced ${actRes.rows.length} activities from Neon.`);
        }

        // 5. Sync app usages from Neon into local state
        const appRes = await client.query('SELECT * FROM app_usages LIMIT 2000');
        if (appRes.rows && appRes.rows.length > 0) {
          for (const a of appRes.rows) {
            const idx = state.appUsages.findIndex(x => x.id === a.id);
            if (idx === -1) {
              state.appUsages.push(a);
            } else {
              state.appUsages[idx] = { ...state.appUsages[idx], ...a };
            }
          }
        }
        for (const a of state.appUsages) {
          await client.query(
            `INSERT INTO app_usages (id, "deviceId", "appName", "packageName", category, icon, "durationMinutes", "lastUsed", "isRunning", "isBlocked", "riskLevel", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             ON CONFLICT (id) DO UPDATE SET
               "durationMinutes" = EXCLUDED."durationMinutes",
               "lastUsed" = EXCLUDED."lastUsed",
               "isRunning" = EXCLUDED."isRunning",
               "isBlocked" = EXCLUDED."isBlocked",
               "updatedAt" = EXCLUDED."updatedAt"`,
            [a.id, a.deviceId, a.appName, a.packageName, a.category, a.icon, a.durationMinutes, a.lastUsed, Boolean(a.isRunning), Boolean(a.isBlocked), a.riskLevel, (a as any).createdAt || new Date().toISOString(), (a as any).updatedAt || new Date().toISOString()]
          ).catch(() => {});
        }

        // 6. Sync web history from Neon into local state
        const webRes = await client.query('SELECT * FROM web_history LIMIT 2000');
        if (webRes.rows && webRes.rows.length > 0) {
          for (const w of webRes.rows) {
            const idx = state.webHistory.findIndex(x => x.id === w.id);
            if (idx === -1) {
              state.webHistory.push(w);
            } else {
              state.webHistory[idx] = { ...state.webHistory[idx], ...w };
            }
          }
        }
        for (const w of state.webHistory) {
          await client.query(
            `INSERT INTO web_history (id, "deviceId", url, domain, "pageTitle", category, "visitCount", "durationMinutes", "isBlocked", timestamp, "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
             ON CONFLICT (id) DO UPDATE SET
               "visitCount" = EXCLUDED."visitCount",
               "durationMinutes" = EXCLUDED."durationMinutes",
               "isBlocked" = EXCLUDED."isBlocked",
               timestamp = EXCLUDED.timestamp,
               "updatedAt" = EXCLUDED."updatedAt"`,
            [w.id, w.deviceId, w.url, w.domain, w.pageTitle || '', w.category, w.visitCount, w.durationMinutes, Boolean(w.isBlocked), w.timestamp, (w as any).createdAt || new Date().toISOString(), (w as any).updatedAt || new Date().toISOString()]
          ).catch(() => {});
        }

        writeLocalDB(state);
      } catch (err: any) {
        console.warn('Neon sync warning:', err.message);
      }

      client.release();
    } catch (err) {
      console.warn('⚠️ Could not connect to Neon PostgreSQL, falling back to local persistent store:', (err as Error).message);
      pgPool = null;
      isPostgresConnected = false;
    }
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    const empty = createInitialEmptyState();
    ensureDefaultAdmin(empty);
    fs.writeFileSync(DATA_FILE, JSON.stringify(empty, null, 2), 'utf-8');
  } else {
    const current = readLocalDB();
    ensureDefaultAdmin(current);
  }

  return { isPostgres: isPostgresConnected };
}

let memoryCache: DBState | null = null;
let saveDebounceTimer: NodeJS.Timeout | null = null;

function readLocalDB(): DBState {
  if (memoryCache) {
    return memoryCache;
  }

  if (!fs.existsSync(DATA_FILE)) {
    const empty = createInitialEmptyState();
    ensureDefaultAdmin(empty);
    memoryCache = empty;
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(empty, null, 2), 'utf-8');
    } catch (e) {
      console.warn('Initial file write error:', e);
    }
    return memoryCache;
  }

  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    const state: DBState = {
      users: parsed.users || [],
      devices: parsed.devices || [],
      locations: parsed.locations || [],
      statuses: parsed.statuses || [],
      sessions: parsed.sessions || [],
      activities: parsed.activities || [],
      appUsages: parsed.appUsages || [],
      webHistory: parsed.webHistory || [],
    };
    memoryCache = ensureDefaultAdmin(state);
    return memoryCache;
  } catch {
    const empty = createInitialEmptyState();
    ensureDefaultAdmin(empty);
    memoryCache = empty;
    return memoryCache;
  }
}

export function resetMemoryCache(): void {
  memoryCache = null;
}

function writeLocalDB(state: DBState, immediate: boolean = false): void {
  memoryCache = state;
  if (immediate) {
    if (saveDebounceTimer) {
      clearTimeout(saveDebounceTimer);
      saveDebounceTimer = null;
    }
    try {
      if (memoryCache) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(memoryCache, null, 2), 'utf-8');
      }
    } catch (err: any) {
      console.warn('Immediate save error:', err.message);
    }
    return;
  }

  if (!saveDebounceTimer) {
    saveDebounceTimer = setTimeout(() => {
      saveDebounceTimer = null;
      try {
        if (memoryCache) {
          fs.writeFile(DATA_FILE, JSON.stringify(memoryCache, null, 2), 'utf-8', (err) => {
            if (err) console.warn('Background database save warning:', err.message);
          });
        }
      } catch (err: any) {
        console.warn('Save error:', err.message);
      }
    }, 250);
  }
}

export function isCurrentlyInClassHours(): boolean {
  const now = new Date();
  // Vietnam UTC+7
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const vnTotalMinutes = (utcHours * 60 + utcMinutes + 7 * 60) % (24 * 60);
  const vnDay = new Date(now.getTime() + 7 * 3600 * 1000).getUTCDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday

  // Sunday is weekend (no class)
  if (vnDay === 0) return false;

  // Morning: 07:00 (420 min) to 11:30 (690 min)
  if (vnTotalMinutes >= 420 && vnTotalMinutes <= 690) return true;
  // Afternoon: 13:00 (780 min) to 17:00 (1020 min)
  if (vnTotalMinutes >= 780 && vnTotalMinutes <= 1020) return true;

  return false;
}

function enrichDevice(d: DeviceRecord, state: DBState): DeviceRecord {
  const latestStatus = state.statuses
    .filter(s => s.deviceId === d.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  const latestLoc = state.locations
    .filter(l => l.deviceId === d.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  const owner = state.users.find(u => u.id === d.userId);
  const devApps = state.appUsages.filter(a => a.deviceId === d.id);
  const runningApp = devApps.find(a => a.isRunning && !a.isBlocked);
  const latestWeb = state.webHistory
    .filter(w => w.deviceId === d.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

  const totalScreenTime = devApps.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);

  // Time calculation for real-time heartbeat (MDM Standard Heartbeat Timeout: 30s period, 3-min timeout)
  const lastSeenMs = d.lastSeen ? new Date(d.lastSeen).getTime() : 0;
  const isHeartbeatFresh = lastSeenMs > 0 && (Date.now() - lastSeenMs) <= 35000; // within 35s
  // Ngưỡng thời gian quy định không gửi dữ liệu (sau 3 phút kể từ last_seen)
  const isHeartbeatTimeout = lastSeenMs > 0 && (Date.now() - lastSeenMs > 180000);
  const isNoNet = d.networkType === 'NONE' || Boolean(d.isNoNetwork);

  // Suspected uninstalled: nếu đã bị đánh dấu gỡ HOẶC không gửi dữ liệu quá ngưỡng 3 phút
  const isSuspectedUninstalled = Boolean(d.isUninstalled) || isHeartbeatTimeout;
  const computedStatus = isSuspectedUninstalled ? 'OFFLINE' : (isHeartbeatFresh && !isNoNet ? 'ONLINE' : 'OFFLINE');
  const inClass = computedStatus === 'ONLINE' && isCurrentlyInClassHours();
  const disconnectReason = d.disconnectReason || (isHeartbeatTimeout ? 'Mất kết nối / Có thể đã gỡ cài đặt' : (d.isUninstalled ? 'Đã gỡ cài đặt' : undefined));

  return {
    ...d,
    studentName: d.studentName || owner?.studentName || d.name,
    schoolName: d.schoolName || owner?.schoolName || 'Chưa cập nhật trường',
    grade: d.grade || owner?.grade || '',
    parentPhone: d.parentPhone || owner?.phone || '',
    phoneContacts: d.phoneContacts || (d.parentPhone ? [{
      id: 'con_' + d.id + '_default',
      name: owner?.name && owner?.name !== 'Chưa rõ' ? owner?.name : 'Phụ huynh chính',
      phone: d.parentPhone,
      relationship: 'Phụ huynh',
      isEmergencyAlert: true,
      createdAt: d.createdAt || new Date().toISOString(),
    }] : []),
    ownerName: owner?.name || 'Chưa rõ',
    ownerEmail: owner?.email || '',
    ownerRole: owner?.role || 'PARENT',
    currentApp: d.currentApp || runningApp?.appName || 'Màn hình chính',
    currentWebsite: d.currentWebsite || latestWeb?.domain || 'Chưa mở trình duyệt',
    screenTimeMinutes: totalScreenTime > 0 ? totalScreenTime : (d.screenTimeMinutes ?? 0),
    blockedApps: d.blockedApps || devApps.filter(a => a.isBlocked).map(a => a.appName),
    blockedWebsites: d.blockedWebsites || state.webHistory.filter(w => w.deviceId === d.id && w.isBlocked).map(w => w.domain),
    status: computedStatus,
    batteryLevel: latestStatus?.batteryLevel ?? d.batteryLevel ?? 100,
    charging: latestStatus?.charging ?? d.charging ?? false,
    networkType: latestStatus?.networkType || d.networkType || 'WIFI',
    locationPermission: latestStatus?.locationPermission ?? true,
    locationSharing: latestStatus?.locationSharing ?? true,
    latitude: latestLoc?.latitude ?? d.latitude,
    longitude: latestLoc?.longitude ?? d.longitude,
    accuracy: latestLoc?.accuracy ?? d.accuracy,
    isUninstalled: isSuspectedUninstalled,
    uninstalledAt: d.uninstalledAt,
    disconnectReason,
    heartbeatTimeout: isHeartbeatTimeout,
    lastHeartbeatAt: d.lastSeen,
    inClassAlert: inClass,
    isNoNetwork: isNoNet,
  };
}

export function canUserAccessDevice(user: UserRecord, device: DeviceRecord): boolean {
  if (user.role === 'ADMIN') {
    return true;
  }
  if (user.role === 'TEACHER') {
    if (device.userId === user.id) return true;
    const teacherSchool = normalizeSchoolName(user.schoolName);
    const deviceSchool = normalizeSchoolName(device.schoolName);
    if (!teacherSchool || !deviceSchool || teacherSchool !== deviceSchool) return false;

    // Check grade if teacher has specific grade assigned
    if (user.grade && device.grade && user.grade.toLowerCase() !== 'tất cả') {
      if (user.grade.trim().toLowerCase() !== device.grade.trim().toLowerCase()) return false;
    }
    // Check class if teacher has specific class assigned
    if (user.className && device.className && user.className.toLowerCase() !== 'tất cả') {
      if (user.className.trim().toLowerCase() !== device.className.trim().toLowerCase()) return false;
    }
    return true;
  }
  // PARENT: only their own child's devices
  if (device.userId === user.id) return true;
  if (user.phone && device.parentPhone) {
    const cleanUserPhone = user.phone.replace(/\D/g, '');
    const cleanDevPhone = device.parentPhone.replace(/\D/g, '');
    if (cleanUserPhone && cleanDevPhone && cleanUserPhone === cleanDevPhone) return true;
  }
  if (user.childStudentId && device.studentId) {
    if (user.childStudentId.trim().toLowerCase() === device.studentId.trim().toLowerCase()) return true;
  }
  if (user.studentName && device.studentName) {
    if (user.studentName.trim().toLowerCase() === device.studentName.trim().toLowerCase()) return true;
  }
  return false;
}

export const dbService = {
  isPostgres(): boolean {
    return isPostgresConnected && pgPool !== null;
  },

  // USERS
  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const normEmail = email.toLowerCase().trim();
    const state = readLocalDB();
    const local = state.users.find(u => u.email.toLowerCase() === normEmail);
    if (local) return local;

    if (pgPool) {
      try {
        const res = await pgPool.query('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1', [normEmail]);
        if (res.rows && res.rows[0]) {
          const u = res.rows[0] as UserRecord;
          const idx = state.users.findIndex(x => x.id === u.id || x.email.toLowerCase() === normEmail);
          if (idx === -1) {
            state.users.push(u);
          } else {
            state.users[idx] = { ...state.users[idx], ...u };
          }
          return u;
        }
      } catch (err) {
        console.warn('findUserByEmail Postgres fallback error:', err);
      }
    }
    return null;
  },

  async findUserByEmailOrPhone(identifier: string): Promise<UserRecord | null> {
    if (!identifier) return null;
    const raw = String(identifier).toLowerCase().trim().replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '');
    const cleanDigits = raw.replace(/\D/g, '');
    const state = readLocalDB();
    const found = state.users.find((u) => {
      if (u.email && u.email.toLowerCase() === raw) return true;
      if (u.email && raw.includes('@') && u.email.toLowerCase().replace(/[\s.-]/g, '') === raw.replace(/[\s.-]/g, '')) {
        return true;
      }
      if (cleanDigits.length >= 8) {
        if (u.phone) {
          const uPhoneDigits = u.phone.replace(/\D/g, '');
          if (
            uPhoneDigits &&
            (uPhoneDigits === cleanDigits ||
              uPhoneDigits.endsWith(cleanDigits) ||
              cleanDigits.endsWith(uPhoneDigits))
          ) {
            return true;
          }
        }
        if (u.email && u.email.includes(cleanDigits)) {
          return true;
        }
      }
      return false;
    });

    if (found) return found;

    if (pgPool) {
      try {
        const res = await pgPool.query(
          `SELECT * FROM users 
           WHERE LOWER(email) = $1 
              OR ($2 <> '' AND (phone LIKE '%' || $2 || '%' OR email LIKE '%' || $2 || '%'))
           LIMIT 1`,
          [raw, cleanDigits]
        );
        if (res.rows && res.rows[0]) {
          const u = res.rows[0] as UserRecord;
          state.users.push(u);
          return u;
        }
      } catch (err) {
        console.warn('findUserByEmailOrPhone Postgres fallback error:', err);
      }
    }

    return null;
  },

  async findUserById(id: string): Promise<UserRecord | null> {
    const state = readLocalDB();
    const local = state.users.find(u => u.id === id);
    if (local) return local;

    if (pgPool) {
      try {
        const res = await pgPool.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
        if (res.rows && res.rows[0]) {
          const u = res.rows[0] as UserRecord;
          const idx = state.users.findIndex(x => x.id === id);
          if (idx === -1) {
            state.users.push(u);
          } else {
            state.users[idx] = { ...state.users[idx], ...u };
          }
          return u;
        }
      } catch (err) {
        console.warn('findUserById Postgres fallback error:', err);
      }
    }

    return null;
  },

  async getAllUsers(): Promise<(Omit<UserRecord, 'passwordHash'> & { deviceCount: number })[]> {
    const state = readLocalDB();
    return state.users
      .map(u => {
        const { passwordHash, ...safeUser } = u;
        const deviceCount = state.devices.filter(d => d.userId === u.id).length;
        return { ...safeUser, deviceCount };
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getUsersBySchool(schoolName: string): Promise<(Omit<UserRecord, 'passwordHash'> & { deviceCount: number })[]> {
    const normSchool = normalizeSchoolName(schoolName);
    const state = readLocalDB();
    return state.users
      .filter(u => normalizeSchoolName(u.schoolName) === normSchool)
      .map(u => {
        const { passwordHash, ...safeUser } = u;
        const deviceCount = state.devices.filter(d => d.userId === u.id).length;
        return { ...safeUser, deviceCount };
      });
  },

  async createUser(user: UserRecord): Promise<UserRecord> {
    const state = readLocalDB();
    state.users.push(user);
    writeLocalDB(state);

    if (pgPool) {
      try {
        await pgPool.query(
          `INSERT INTO users (
            id, name, email, "passwordHash", role, "approvalStatus", "schoolName", grade, "className", "studentName", phone, "approvedBy", "approvedAt", "createdAt", "updatedAt"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            email = EXCLUDED.email,
            "passwordHash" = EXCLUDED."passwordHash",
            role = EXCLUDED.role,
            "approvalStatus" = EXCLUDED."approvalStatus",
            "schoolName" = EXCLUDED."schoolName",
            grade = EXCLUDED.grade,
            "className" = EXCLUDED."className",
            "studentName" = EXCLUDED."studentName",
            phone = EXCLUDED.phone,
            "approvedBy" = EXCLUDED."approvedBy",
            "approvedAt" = EXCLUDED."approvedAt",
            "updatedAt" = EXCLUDED."updatedAt"`,
          [
            user.id,
            user.name,
            user.email,
            user.passwordHash,
            user.role,
            user.approvalStatus,
            user.schoolName || null,
            user.grade || null,
            user.className || null,
            user.studentName || null,
            user.phone || null,
            user.approvedBy || null,
            user.approvedAt || null,
            user.createdAt,
            user.updatedAt || new Date().toISOString(),
          ]
        );
      } catch (err: any) {
        console.warn('Neon user insert warning:', err.message);
      }
    }

    return user;
  },

  async updateUser(id: string, updates: Partial<UserRecord>): Promise<UserRecord | null> {
    const state = readLocalDB();
    const idx = state.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    const nowIso = new Date().toISOString();
    state.users[idx] = {
      ...state.users[idx],
      ...updates,
      updatedAt: nowIso,
    };

    // If schoolName or className changed on a parent, sync their devices if needed
    if (updates.schoolName) {
      state.devices.forEach(d => {
        if (d.userId === id) {
          d.schoolName = updates.schoolName;
        }
      });
    }
    writeLocalDB(state);

    if (pgPool) {
      try {
        const u = state.users[idx];
        await pgPool.query(
          `UPDATE users SET
            name = $2,
            role = $3,
            "approvalStatus" = $4,
            "schoolName" = $5,
            grade = $6,
            "className" = $7,
            "studentName" = $8,
            phone = $9,
            "passwordHash" = $10,
            "updatedAt" = $11
          WHERE id = $1`,
          [
            u.id,
            u.name,
            u.role,
            u.approvalStatus,
            u.schoolName || null,
            u.grade || null,
            u.className || null,
            u.studentName || null,
            u.phone || null,
            u.passwordHash,
            nowIso,
          ]
        );
      } catch (err: any) {
        console.warn('Neon user update warning:', err.message);
      }
    }

    return state.users[idx];
  },

  async updateUserApproval(
    userId: string,
    approvalStatus: ApprovalStatus,
    adminName: string
  ): Promise<UserRecord | null> {
    const state = readLocalDB();
    const idx = state.users.findIndex(u => u.id === userId);
    if (idx === -1) return null;
    const nowIso = new Date().toISOString();
    state.users[idx].approvalStatus = approvalStatus;
    state.users[idx].approvedBy = adminName;
    state.users[idx].approvedAt = nowIso;
    state.users[idx].updatedAt = nowIso;
    writeLocalDB(state);

    if (pgPool) {
      try {
        await pgPool.query(
          `UPDATE users SET
            "approvalStatus" = $2,
            "approvedBy" = $3,
            "approvedAt" = $4,
            "updatedAt" = $4
          WHERE id = $1`,
          [userId, approvalStatus, adminName, nowIso]
        );
      } catch (err: any) {
        console.warn('Neon user approval update warning:', err.message);
      }
    }

    return state.users[idx];
  },

  async deleteUser(userId: string): Promise<boolean> {
    const state = readLocalDB();
    const exists = state.users.some(u => u.id === userId);
    if (!exists) return false;
    const userDeviceIds = new Set(state.devices.filter(d => d.userId === userId).map(d => d.id));
    state.users = state.users.filter(u => u.id !== userId);
    state.devices = state.devices.filter(d => d.userId !== userId);
    state.locations = state.locations.filter(l => !userDeviceIds.has(l.deviceId));
    state.statuses = state.statuses.filter(s => !userDeviceIds.has(s.deviceId));
    state.appUsages = state.appUsages.filter(a => !userDeviceIds.has(a.deviceId));
    state.webHistory = state.webHistory.filter(w => !userDeviceIds.has(w.deviceId));
    writeLocalDB(state);

    if (pgPool) {
      try {
        await pgPool.query('DELETE FROM users WHERE id = $1', [userId]);
      } catch (err: any) {
        console.warn('Neon user delete warning:', err.message);
      }
    }

    return true;
  },

  async clearAllNonAdminUsers(requestingUserId: string): Promise<{ deletedCount: number }> {
    const state = readLocalDB();
    const caller = state.users.find(u => u.id === requestingUserId);
    if (!caller || caller.role !== 'ADMIN') {
      return { deletedCount: 0 };
    }

    const nonAdminUsers = state.users.filter(u => u.role !== 'ADMIN');
    const count = nonAdminUsers.length;
    const removedUserIds = new Set(nonAdminUsers.map(u => u.id));

    state.users = state.users.filter(u => u.role === 'ADMIN');
    state.sessions = state.sessions.filter(s => !removedUserIds.has(s.userId));
    writeLocalDB(state, true);

    if (pgPool) {
      try {
        await pgPool.query("DELETE FROM users WHERE role != 'ADMIN'");
      } catch (err: any) {
        console.warn('Neon clearAllNonAdminUsers warning:', err.message);
      }
    }

    return { deletedCount: count };
  },

  // DEVICES
  async getAllDevices(): Promise<DeviceRecord[]> {
    const state = readLocalDB();
    return state.devices.map(d => enrichDevice(d, state))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async getAccessibleDevices(userId?: string): Promise<DeviceRecord[]> {
    const state = readLocalDB();
    if (!userId) {
      return this.getAllDevices();
    }
    const user = state.users.find(u => u.id === userId);
    if (!user) return this.getAllDevices();

    const enrichedAll = state.devices.map(d => enrichDevice(d, state));
    return enrichedAll
      .filter(d => canUserAccessDevice(user, d))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async getDevicesByUser(userId: string): Promise<DeviceRecord[]> {
    return this.getAccessibleDevices(userId);
  },

  async getDeviceById(deviceId: string, requestingUserId?: string): Promise<DeviceRecord | null> {
    const state = readLocalDB();
    const rawDevice = state.devices.find(x => x.id === deviceId);
    if (!rawDevice) return null;

    const enriched = enrichDevice(rawDevice, state);
    if (requestingUserId) {
      const user = state.users.find(u => u.id === requestingUserId);
      if (!user || !canUserAccessDevice(user, enriched)) {
        return null;
      }
    }
    return enriched;
  },

  async findDeviceByUuid(uuid: string): Promise<DeviceRecord | null> {
    const state = readLocalDB();
    const found = state.devices.find(d => d.deviceUuid.toLowerCase() === uuid.toLowerCase());
    return found ? enrichDevice(found, state) : null;
  },

  // Direct Phone Telemetry Report (link để điện thoại báo vào)
  async recordDirectReport(report: {
    deviceUuid?: string;
    deviceId?: string;
    name?: string;
    studentName?: string;
    studentId?: string;
    schoolName?: string;
    grade?: string;
    className?: string;
    parentPhone?: string;
    platform?: PlatformType;
    latitude?: number;
    longitude?: number;
    accuracy?: number;
    batteryLevel?: number;
    charging?: boolean;
    networkType?: NetworkType;
    currentApp?: string;
    currentWebsite?: string;
    isUninstalled?: boolean;
    isNoNetwork?: boolean;
  }): Promise<DeviceRecord> {
    const state = readLocalDB();
    const nowIso = new Date().toISOString();
    const uuid = (report.deviceUuid || report.deviceId || 'DEV-' + Math.random().toString(36).substring(2, 8).toUpperCase()).trim();

    const foundIndex = state.devices.findIndex(
      (d) => d.deviceUuid.toLowerCase() === uuid.toLowerCase() || (report.deviceId && d.id === report.deviceId)
    );
    let device: DeviceRecord;

    if (foundIndex === -1) {
      const newDevId = report.deviceId || 'dev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      device = {
        id: newDevId,
        userId: 'usr_default',
        deviceUuid: uuid,
        name: report.name?.trim() || 'Điện thoại di động',
        platform: report.platform || 'Android',
        studentName: report.studentName?.trim() || report.name?.trim() || 'Học sinh',
        studentId: report.studentId?.trim() || '',
        schoolName: report.schoolName?.trim() || 'Trường học',
        grade: report.grade?.trim() || '',
        className: report.className?.trim() || '',
        parentPhone: report.parentPhone?.trim() || '',
        currentApp: report.currentApp || 'Báo cáo GPS',
        currentWebsite: report.currentWebsite || 'DeviceMonitor',
        screenTimeMinutes: 5,
        blockedApps: [],
        blockedWebsites: [],
        status: report.isUninstalled ? 'OFFLINE' : 'ONLINE',
        batteryLevel: report.batteryLevel ?? 100,
        charging: Boolean(report.charging),
        networkType: report.networkType || (report.isNoNetwork ? 'NONE' : 'WIFI'),
        locationPermission: true,
        locationSharing: true,
        latitude: report.latitude,
        longitude: report.longitude,
        accuracy: report.accuracy,
        isUninstalled: Boolean(report.isUninstalled),
        uninstalledAt: report.isUninstalled ? nowIso : undefined,
        lastSeen: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      state.devices.push(device);

      state.activities.unshift({
        id: 'act_' + Date.now(),
        deviceId: device.id,
        deviceName: device.name,
        platform: device.platform,
        studentName: device.studentName,
        schoolName: device.schoolName,
        grade: device.grade,
        className: device.className,
        type: report.isUninstalled ? 'UNINSTALLED' : 'ONLINE',
        description: report.isUninstalled
          ? `⚠️ Thiết bị "${device.name}" của học sinh ${device.studentName} đã gửi tín hiệu gỡ cài đặt / ngừng theo dõi!`
          : `Thiết bị "${device.name}" đã kết nối và bắt đầu báo cáo vào hệ thống`,
        timestamp: nowIso,
      });
    } else {
      device = state.devices[foundIndex];
      if (report.name) device.name = report.name.trim();
      if (report.studentName) device.studentName = report.studentName.trim();
      if (report.studentId) device.studentId = report.studentId.trim();
      if (report.schoolName) device.schoolName = report.schoolName.trim();
      if (report.grade) device.grade = report.grade.trim();
      if (report.className) device.className = report.className.trim();
      if (report.parentPhone) device.parentPhone = report.parentPhone.trim();
      if (report.platform) device.platform = report.platform;
      if (report.currentApp) device.currentApp = report.currentApp;
      if (report.currentWebsite) device.currentWebsite = report.currentWebsite;

      if (report.isUninstalled) {
        device.isUninstalled = true;
        device.uninstalledAt = nowIso;
        device.status = 'OFFLINE';
        device.disconnectReason = 'Học sinh chủ động gửi tín hiệu gỡ ứng dụng';
        state.activities.unshift({
          id: 'act_' + Date.now(),
          deviceId: device.id,
          deviceName: device.name,
          platform: device.platform,
          studentName: device.studentName,
          schoolName: device.schoolName,
          grade: device.grade,
          className: device.className,
          type: 'UNINSTALLED',
          description: `⚠️ Học sinh ${device.studentName} (${device.className || 'Chưa rõ lớp'}) đã gỡ app / tắt theo dõi trên điện thoại!`,
          timestamp: nowIso,
        });
      } else {
        const wasTimedOut = device.isUninstalled && device.disconnectReason === 'Mất kết nối / Có thể đã gỡ cài đặt';
        device.isUninstalled = false;
        device.disconnectReason = undefined;
        device.status = 'ONLINE';
        if (wasTimedOut) {
          state.activities.unshift({
            id: 'act_' + Date.now(),
            deviceId: device.id,
            deviceName: device.name,
            platform: device.platform,
            studentName: device.studentName,
            schoolName: device.schoolName,
            grade: device.grade,
            className: device.className,
            type: 'ONLINE',
            description: `✅ KHÔI PHỤC KẾT NỐI: Thiết bị "${device.name}" (${device.studentName}) đã gửi lại tín hiệu nhịp tim bình thường sau thời gian mất kết nối.`,
            timestamp: nowIso,
          });
        }
      }

      if (report.isNoNetwork || report.networkType === 'NONE') {
        device.isNoNetwork = true;
        device.networkType = 'NONE';
        state.activities.unshift({
          id: 'act_' + Date.now(),
          deviceId: device.id,
          deviceName: device.name,
          platform: device.platform,
          studentName: device.studentName,
          schoolName: device.schoolName,
          grade: device.grade,
          className: device.className,
          type: 'NO_NETWORK',
          description: `🔴 Điện thoại "${device.name}" của học sinh ${device.studentName} đã mất kết nối mạng!`,
          timestamp: nowIso,
        });
      } else if (report.networkType) {
        device.networkType = report.networkType;
        device.isNoNetwork = false;
      }

      device.lastSeen = nowIso;
      device.updatedAt = nowIso;
      if (report.batteryLevel !== undefined) device.batteryLevel = report.batteryLevel;
      if (report.charging !== undefined) device.charging = Boolean(report.charging);
      if (report.latitude !== undefined && report.longitude !== undefined) {
        device.latitude = report.latitude;
        device.longitude = report.longitude;
        device.accuracy = report.accuracy;
      }
    }

    // App & Web Detection & Recording from Mobile Phone Telemetry
    if (report.currentApp && report.currentApp.trim()) {
      const appName = report.currentApp.trim();
      const prevApp = device.currentApp;
      device.currentApp = appName;

      // Mark other apps on this device as not running
      state.appUsages.forEach((a) => {
        if (a.deviceId === device.id) a.isRunning = false;
      });

      const existingApp = state.appUsages.find(
        (a) => a.deviceId === device.id && a.appName.toLowerCase() === appName.toLowerCase()
      );

      const isGame = /game|roblox|free fire|liên quân|pubg|genshin/i.test(appName);
      const isEdu = /k12|vnedu|học|zoom|meet|teams|classroom|sách|duolingo/i.test(appName);
      const isSocial = /tiktok|facebook|youtube|zalo|messenger|instagram|threads/i.test(appName);
      const cat = isGame ? 'GAME' : isEdu ? 'EDUCATION' : isSocial ? 'SOCIAL' : 'OTHER';
      const isBlocked = (device.blockedApps || []).some((b) => b.toLowerCase() === appName.toLowerCase());

      if (existingApp) {
        existingApp.durationMinutes += 1;
        existingApp.lastUsed = nowIso;
        existingApp.isRunning = !existingApp.isBlocked;
        existingApp.isBlocked = isBlocked;
      } else {
        const icon = isGame ? '🎮' : isEdu ? '📚' : isSocial ? '📱' : '⚙️';
        state.appUsages.push({
          id: 'app_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          deviceId: device.id,
          appName,
          packageName: 'app.' + appName.toLowerCase().replace(/[^a-z0-9]/g, ''),
          category: cat,
          icon,
          durationMinutes: 5,
          lastUsed: nowIso,
          isRunning: !isBlocked,
          isBlocked,
          riskLevel: isBlocked ? 'RESTRICTED' : isGame || isSocial ? 'WARNING' : 'SAFE',
        });
      }

      // If phone switched to a new app, log activity
      if (prevApp !== appName && appName !== 'Màn hình chính' && appName !== 'Báo cáo GPS') {
        state.activities.unshift({
          id: 'act_' + Date.now() + '_app',
          deviceId: device.id,
          deviceName: device.name,
          platform: device.platform,
          studentName: device.studentName,
          schoolName: device.schoolName,
          grade: device.grade,
          className: device.className,
          type: 'APP_OPENED',
          description: `📱 Phát hiện điện thoại học sinh ${device.studentName} (${device.className || 'Chưa rõ lớp'}) đang mở: "${appName}"`,
          timestamp: nowIso,
        });

        // Check if currently in class hours (Cảnh báo dùng trong giờ học)
        if (isCurrentlyInClassHours()) {
          device.inClassAlert = true;
          state.activities.unshift({
            id: 'act_' + Date.now() + '_inclass',
            deviceId: device.id,
            deviceName: device.name,
            platform: device.platform,
            studentName: device.studentName,
            schoolName: device.schoolName,
            grade: device.grade,
            className: device.className,
            type: 'IN_CLASS_ALERT',
            description: `🚨 CẢNH BÁO GIỜ HỌC: Học sinh ${device.studentName} đang dùng điện thoại ("${appName}") trong giờ học!`,
            timestamp: nowIso,
          });
        }
      }
    }

    if (report.currentWebsite && report.currentWebsite.trim()) {
      const webUrl = report.currentWebsite.trim();
      const prevWeb = device.currentWebsite;
      device.currentWebsite = webUrl;

      let domain = webUrl;
      try {
        domain = new URL(webUrl.startsWith('http') ? webUrl : `https://${webUrl}`).hostname.replace(/^www\./, '');
      } catch {
        domain = webUrl.replace(/^https?:\/\//, '').split('/')[0];
      }

      const isSocial = /facebook|tiktok|youtube|instagram/i.test(domain);
      const isGame = /roblox|poki|game|crazygames/i.test(domain);
      const isEdu = /edu|k12|hoc|quiz|google|wikipedia/i.test(domain);
      const cat = isGame ? 'GAME' : isEdu ? 'EDUCATION' : isSocial ? 'SOCIAL' : 'OTHER';
      const isBlocked = (device.blockedWebsites || []).some((b) => domain.toLowerCase().includes(b.toLowerCase()));

      state.webHistory.unshift({
        id: 'web_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        deviceId: device.id,
        url: webUrl.startsWith('http') ? webUrl : `https://${webUrl}`,
        domain,
        pageTitle: `Trang web: ${domain}`,
        category: cat,
        timestamp: nowIso,
        durationMinutes: 1,
        visitCount: 1,
        isBlocked,
        riskLevel: isBlocked ? 'RESTRICTED' : isGame || isSocial ? 'WARNING' : 'SAFE',
      });
      if (state.webHistory.length > 500) state.webHistory = state.webHistory.slice(0, 500);

      if (prevWeb !== webUrl && webUrl !== 'DeviceMonitor' && !webUrl.includes('onrender.com')) {
        state.activities.unshift({
          id: 'act_' + Date.now() + '_web',
          deviceId: device.id,
          deviceName: device.name,
          platform: device.platform,
          studentName: device.studentName,
          schoolName: device.schoolName,
          grade: device.grade,
          className: device.className,
          type: 'WEB_VISITED',
          description: `🌐 Học sinh ${device.studentName} vừa truy cập website: ${domain}`,
          timestamp: nowIso,
        });
      }
    }

    // Ensure device is upserted to Neon PostgreSQL (both new and updated devices)
    if (pgPool) {
      pgPool.query(
        `INSERT INTO devices (
          id, "userId", "deviceUuid", name, platform, "studentName", "studentId", "schoolName", grade, "className",
          "parentPhone", "currentApp", "currentWebsite", "batteryLevel", charging, "networkType",
          latitude, longitude, accuracy, "isUninstalled", "uninstalledAt", status, "lastSeen", "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          platform = EXCLUDED.platform,
          "studentName" = COALESCE(EXCLUDED."studentName", devices."studentName"),
          "studentId" = COALESCE(EXCLUDED."studentId", devices."studentId"),
          "schoolName" = COALESCE(EXCLUDED."schoolName", devices."schoolName"),
          grade = COALESCE(EXCLUDED.grade, devices.grade),
          "className" = COALESCE(EXCLUDED."className", devices."className"),
          "parentPhone" = COALESCE(EXCLUDED."parentPhone", devices."parentPhone"),
          "currentApp" = EXCLUDED."currentApp",
          "currentWebsite" = EXCLUDED."currentWebsite",
          "batteryLevel" = EXCLUDED."batteryLevel",
          charging = EXCLUDED.charging,
          "networkType" = EXCLUDED."networkType",
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          accuracy = EXCLUDED.accuracy,
          "isUninstalled" = EXCLUDED."isUninstalled",
          "uninstalledAt" = EXCLUDED."uninstalledAt",
          status = EXCLUDED.status,
          "lastSeen" = EXCLUDED."lastSeen",
          "updatedAt" = EXCLUDED."updatedAt"`,
        [
          device.id,
          device.userId || 'usr_default',
          device.deviceUuid,
          device.name,
          device.platform || 'Android',
          device.studentName || device.name,
          device.studentId || '',
          device.schoolName || '',
          device.grade || '',
          device.className || '',
          device.parentPhone || '',
          device.currentApp || 'Báo cáo GPS',
          device.currentWebsite || 'DeviceMonitor',
          device.batteryLevel ?? 100,
          Boolean(device.charging),
          device.networkType || 'WIFI',
          device.latitude,
          device.longitude,
          device.accuracy,
          Boolean(device.isUninstalled),
          device.uninstalledAt || null,
          device.status || 'ONLINE',
          nowIso,
          device.createdAt || nowIso,
          nowIso,
        ]
      ).catch((e: any) => console.warn('PG device upsert warning:', e.message));
    }

    // Record status
    const statusRecord: DeviceStatusRecord = {
      id: 'stat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      deviceId: device.id,
      batteryLevel: report.batteryLevel ?? device.batteryLevel ?? 100,
      charging: report.charging !== undefined ? Boolean(report.charging) : (device.charging ?? false),
      networkType: device.networkType || 'WIFI',
      locationPermission: true,
      locationSharing: true,
      status: device.status || 'ONLINE',
      timestamp: nowIso,
    };
    state.statuses.unshift(statusRecord);
    if (state.statuses.length > 500) state.statuses = state.statuses.slice(0, 500);

    if (pgPool) {
      pgPool.query(
        `INSERT INTO device_statuses (id, "deviceId", "batteryLevel", charging, "networkType", "locationPermission", "locationSharing", status, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [
          statusRecord.id,
          statusRecord.deviceId,
          statusRecord.batteryLevel,
          statusRecord.charging,
          statusRecord.networkType,
          statusRecord.locationPermission,
          statusRecord.locationSharing,
          statusRecord.status,
          statusRecord.timestamp,
        ]
      ).catch((e: any) => console.warn('PG status insert warning:', e.message));
    }

    // Record location if coordinates valid
    if (report.latitude !== undefined && report.longitude !== undefined && !isNaN(report.latitude) && !isNaN(report.longitude)) {
      const locRecord: DeviceLocationRecord = {
        id: 'loc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        deviceId: device.id,
        latitude: report.latitude,
        longitude: report.longitude,
        accuracy: report.accuracy,
        timestamp: nowIso,
        createdAt: nowIso,
      };
      // Chỉ thêm không bớt: Lưu giữ toàn bộ tọa độ di chuyển, không cắt ngắn hay xóa bớt
      state.locations.unshift(locRecord);

      if (pgPool) {
        pgPool.query(
          `INSERT INTO device_locations (id, "deviceId", latitude, longitude, accuracy, timestamp, "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (id) DO NOTHING`,
          [locRecord.id, locRecord.deviceId, locRecord.latitude, locRecord.longitude, locRecord.accuracy, nowIso, nowIso]
        ).catch((e: any) => console.warn('PG location insert error:', e.message));
      }
    }

    writeLocalDB(state);
    return enrichDevice(device, state);
  },

  async createDevice(device: DeviceRecord, initialStatus?: Partial<DeviceStatusRecord>): Promise<DeviceRecord> {
    const state = readLocalDB();
    const owner = state.users.find(u => u.id === device.userId);
    const finalDevice: DeviceRecord = {
      ...device,
      studentName: device.studentName || owner?.studentName || device.name,
      schoolName: device.schoolName || owner?.schoolName || 'THPT Chuyên Lê Hồng Phong',
      className: device.className || owner?.className || '10A1',
      currentApp: device.currentApp || 'Màn hình chính',
      currentWebsite: device.currentWebsite || 'google.com',
      screenTimeMinutes: device.screenTimeMinutes ?? 15,
      blockedApps: device.blockedApps || [],
      blockedWebsites: device.blockedWebsites || [],
    };
    state.devices.push(finalDevice);

    const newStatus: DeviceStatusRecord = {
      id: 'stat_' + Date.now(),
      deviceId: device.id,
      batteryLevel: initialStatus?.batteryLevel ?? 100,
      charging: initialStatus?.charging ?? false,
      networkType: initialStatus?.networkType ?? 'WIFI',
      locationPermission: initialStatus?.locationPermission ?? true,
      locationSharing: initialStatus?.locationSharing ?? true,
      status: initialStatus?.status ?? 'ONLINE',
      timestamp: new Date().toISOString(),
    };
    state.statuses.push(newStatus);

    // Seed default app & web usage for the new device so parent/teacher can manage immediately
    state.appUsages.push(
      {
        id: 'app_' + Date.now() + '_1',
        deviceId: device.id,
        appName: 'Google Classroom',
        packageName: 'com.google.android.apps.classroom',
        category: 'EDUCATION',
        icon: '📚',
        durationMinutes: 15,
        lastUsed: new Date().toISOString(),
        isRunning: true,
        isBlocked: false,
        riskLevel: 'SAFE',
      },
      {
        id: 'app_' + Date.now() + '_2',
        deviceId: device.id,
        appName: 'Zalo',
        packageName: 'com.zing.zalo',
        category: 'SOCIAL',
        icon: '💬',
        durationMinutes: 10,
        lastUsed: new Date().toISOString(),
        isRunning: false,
        isBlocked: false,
        riskLevel: 'SAFE',
      }
    );

    state.webHistory.push({
      id: 'web_' + Date.now() + '_1',
      deviceId: device.id,
      url: 'https://www.google.com',
      domain: 'google.com',
      pageTitle: 'Google Tìm kiếm học tập',
      category: 'EDUCATION',
      durationMinutes: 10,
      visitCount: 2,
      timestamp: new Date().toISOString(),
      isBlocked: false,
      riskLevel: 'SAFE',
    });

    state.activities.unshift({
      id: 'act_' + Date.now(),
      deviceId: finalDevice.id,
      deviceName: finalDevice.name,
      platform: finalDevice.platform,
      studentName: finalDevice.studentName,
      schoolName: finalDevice.schoolName,
      className: finalDevice.className,
      type: 'ONLINE',
      description: `Thiết bị ${finalDevice.name} (HS: ${finalDevice.studentName} - ${finalDevice.schoolName}) đã được đăng ký`,
      timestamp: new Date().toISOString(),
    });

    writeLocalDB(state);

    if (pgPool) {
      pgPool.query(
        `INSERT INTO devices (
          id, "userId", "deviceUuid", name, platform, "studentName", "studentId", "schoolName", grade, "className",
          "parentPhone", "currentApp", "currentWebsite", "batteryLevel", charging, "networkType",
          latitude, longitude, accuracy, "isUninstalled", "uninstalledAt", status, "lastSeen", "createdAt", "updatedAt"
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          platform = EXCLUDED.platform,
          "studentName" = EXCLUDED."studentName",
          "schoolName" = EXCLUDED."schoolName",
          "className" = EXCLUDED."className",
          "updatedAt" = EXCLUDED."updatedAt"`,
        [
          finalDevice.id,
          finalDevice.userId || 'usr_default',
          finalDevice.deviceUuid,
          finalDevice.name,
          finalDevice.platform,
          finalDevice.studentName,
          finalDevice.studentId || '',
          finalDevice.schoolName,
          finalDevice.grade || '',
          finalDevice.className,
          finalDevice.parentPhone || '',
          finalDevice.currentApp,
          finalDevice.currentWebsite,
          finalDevice.batteryLevel,
          Boolean(finalDevice.charging),
          finalDevice.networkType,
          finalDevice.latitude,
          finalDevice.longitude,
          finalDevice.accuracy,
          Boolean(finalDevice.isUninstalled),
          finalDevice.uninstalledAt || null,
          finalDevice.status,
          finalDevice.lastSeen || finalDevice.createdAt,
          finalDevice.createdAt,
          finalDevice.updatedAt,
        ]
      ).catch((e: any) => console.warn('Neon createDevice upsert error:', e.message));
    }

    return enrichDevice(finalDevice, state);
  },

  async updateDevice(id: string, requestingUserId: string, updates: Partial<DeviceRecord>): Promise<DeviceRecord | null> {
    const state = readLocalDB();
    const user = state.users.find(u => u.id === requestingUserId);
    const idx = state.devices.findIndex(d => d.id === id);
    if (idx === -1 || !user) return null;

    const enriched = enrichDevice(state.devices[idx], state);
    if (!canUserAccessDevice(user, enriched)) return null;

    state.devices[idx] = {
      ...state.devices[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    writeLocalDB(state);

    if (pgPool) {
      const d = state.devices[idx];
      pgPool.query(
        `UPDATE devices SET
          name = COALESCE($2, name),
          "studentName" = COALESCE($3, "studentName"),
          "schoolName" = COALESCE($4, "schoolName"),
          "className" = COALESCE($5, "className"),
          "parentPhone" = COALESCE($6, "parentPhone"),
          "updatedAt" = $7
        WHERE id = $1`,
        [id, d.name, d.studentName, d.schoolName, d.className, d.parentPhone, d.updatedAt]
      ).catch((e: any) => console.warn('Neon updateDevice error:', e.message));
    }

    return enrichDevice(state.devices[idx], state);
  },

  async deleteDevice(id: string, requestingUserId: string): Promise<boolean> {
    const state = readLocalDB();
    const user = state.users.find(u => u.id === requestingUserId);
    const raw = state.devices.find(d => d.id === id);
    if (!raw || !user) return false;
    const enriched = enrichDevice(raw, state);
    if (!canUserAccessDevice(user, enriched)) return false;

    state.devices = state.devices.filter(d => d.id !== id);
    state.locations = state.locations.filter(l => l.deviceId !== id);
    state.statuses = state.statuses.filter(s => s.deviceId !== id);
    state.activities = state.activities.filter(a => a.deviceId !== id);
    state.appUsages = state.appUsages.filter(a => a.deviceId !== id);
    state.webHistory = state.webHistory.filter(w => w.deviceId !== id);
    writeLocalDB(state);

    if (pgPool) {
      pgPool.query('DELETE FROM devices WHERE id = $1', [id]).catch((e: any) => console.warn('Neon deleteDevice error:', e.message));
    }

    return true;
  },

  async setDeviceUninstallStatus(
    deviceId: string,
    isUninstalled: boolean,
    requestingUserId: string
  ): Promise<DeviceRecord | null> {
    const state = readLocalDB();
    const user = state.users.find(u => u.id === requestingUserId);
    const d = state.devices.find(x => x.id === deviceId);
    if (!d || !user) return null;

    const enriched = enrichDevice(d, state);
    if (!canUserAccessDevice(user, enriched)) return null;

    const nowIso = new Date().toISOString();
    d.isUninstalled = isUninstalled;
    d.uninstalledAt = isUninstalled ? nowIso : undefined;
    d.status = isUninstalled ? 'OFFLINE' : 'ONLINE';
    d.disconnectReason = isUninstalled ? 'Đã ghi nhận gỡ cài đặt từ người quản trị / MDM' : undefined;
    d.updatedAt = nowIso;

    state.activities.unshift({
      id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      deviceId: d.id,
      deviceName: d.name,
      platform: d.platform,
      studentName: d.studentName,
      schoolName: d.schoolName,
      grade: d.grade,
      className: d.className,
      type: isUninstalled ? 'UNINSTALLED' : 'ONLINE',
      description: isUninstalled
        ? `⚠️ Quản trị viên đã đánh dấu thiết bị "${d.name}" (${d.studentName}) là ĐÃ GỠ ỨNG DỤNG / NGỪNG THEO DÕI.`
        : `✅ Khôi phục trạng thái: Thiết bị "${d.name}" (${d.studentName}) đã được đặt lại trạng thái hoạt động bình thường.`,
      timestamp: nowIso,
    });

    writeLocalDB(state, true);

    if (pgPool) {
      pgPool.query(
        `UPDATE devices SET "isUninstalled" = $1, "uninstalledAt" = $2, status = $3, "disconnectReason" = $4, "updatedAt" = $5 WHERE id = $6`,
        [isUninstalled, isUninstalled ? nowIso : null, isUninstalled ? 'OFFLINE' : 'ONLINE', d.disconnectReason || null, nowIso, d.id]
      ).catch((e: any) => console.warn('Neon setDeviceUninstallStatus error:', e.message));
    }

    return enrichDevice(d, state);
  },

  async checkHeartbeatTimeouts(thresholdMs: number = 180000): Promise<{
    checked: number;
    newlyTimedOut: number;
    activeCount: number;
    timedOutDevices: { id: string; name: string; studentName?: string; silenceMinutes: number }[];
  }> {
    const state = readLocalDB();
    const now = Date.now();
    let newlyTimedOut = 0;
    let activeCount = 0;
    const timedOutList: { id: string; name: string; studentName?: string; silenceMinutes: number }[] = [];

    for (const d of state.devices) {
      if (!d.lastSeen) continue;
      const lastSeenMs = new Date(d.lastSeen).getTime();
      const diffMs = now - lastSeenMs;

      if (diffMs > thresholdMs) {
        const silenceMinutes = Math.round(diffMs / 60000);
        const alreadyFlagged = d.isUninstalled && d.disconnectReason === 'Mất kết nối / Có thể đã gỡ cài đặt';

        d.status = 'OFFLINE';
        d.isUninstalled = true;
        d.disconnectReason = 'Mất kết nối / Có thể đã gỡ cài đặt';
        if (!d.uninstalledAt) {
          d.uninstalledAt = new Date().toISOString();
        }

        timedOutList.push({
          id: d.id,
          name: d.name,
          studentName: d.studentName,
          silenceMinutes,
        });

        if (!alreadyFlagged) {
          newlyTimedOut++;
          d.updatedAt = new Date().toISOString();
          state.activities.unshift({
            id: 'act_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            deviceId: d.id,
            deviceName: d.name,
            platform: d.platform,
            studentName: d.studentName,
            schoolName: d.schoolName,
            grade: d.grade,
            className: d.className,
            type: 'UNINSTALLED',
            description: `⚠️ CẢNH BÁO MDM: Thiết bị "${d.name}" (${d.studentName || 'Học sinh'}) mất kết nối quá thời gian quy định (> ${silenceMinutes} phút không có nhịp tim). Hệ thống phát hiện: Mất kết nối / Có thể đã gỡ cài đặt!`,
            timestamp: new Date().toISOString(),
          });

          if (pgPool) {
            pgPool.query(
              `UPDATE devices SET status = 'OFFLINE', "isUninstalled" = true, "uninstalledAt" = COALESCE("uninstalledAt", NOW()::text), "disconnectReason" = $1, "updatedAt" = NOW()::text WHERE id = $2`,
              ['Mất kết nối / Có thể đã gỡ cài đặt', d.id]
            ).catch((e: any) => console.warn('Neon heartbeat timeout warning:', e.message));
          }
        }
      } else {
        if (!d.isUninstalled) {
          activeCount++;
        }
      }
    }

    if (newlyTimedOut > 0) {
      writeLocalDB(state, true);
    }

    return {
      checked: state.devices.length,
      newlyTimedOut,
      activeCount,
      timedOutDevices: timedOutList,
    };
  },

  async clearAllDevices(requestingUserId: string): Promise<{ deletedCount: number }> {
    const state = readLocalDB();
    const user = state.users.find(u => u.id === requestingUserId);
    if (!user) return { deletedCount: 0 };

    let count = 0;
    if (user.role === 'ADMIN') {
      count = state.devices.length;
      state.devices = [];
      state.locations = [];
      state.statuses = [];
      state.activities = [];
      state.appUsages = [];
      state.webHistory = [];
      writeLocalDB(state, true);

      if (pgPool) {
        try {
          await pgPool.query('DELETE FROM activities');
          await pgPool.query('DELETE FROM app_usages');
          await pgPool.query('DELETE FROM web_history');
          await pgPool.query('DELETE FROM device_locations');
          await pgPool.query('DELETE FROM device_statuses');
          await pgPool.query('DELETE FROM devices');
        } catch (e: any) {
          console.warn('Neon clearAllDevices error:', e.message);
        }
      }
    } else {
      const accessibleIds = new Set(
        state.devices
          .filter(d => canUserAccessDevice(user, enrichDevice(d, state)))
          .map(d => d.id)
      );
      count = accessibleIds.size;
      state.devices = state.devices.filter(d => !accessibleIds.has(d.id));
      state.locations = state.locations.filter(l => !accessibleIds.has(l.deviceId));
      state.statuses = state.statuses.filter(s => !accessibleIds.has(s.deviceId));
      state.activities = state.activities.filter(a => !accessibleIds.has(a.deviceId));
      state.appUsages = state.appUsages.filter(a => !accessibleIds.has(a.deviceId));
      state.webHistory = state.webHistory.filter(w => !accessibleIds.has(w.deviceId));
      writeLocalDB(state, true);

      if (pgPool && accessibleIds.size > 0) {
        const idList = Array.from(accessibleIds);
        pgPool.query('DELETE FROM devices WHERE id = ANY($1)', [idList]).catch((e: any) => console.warn(e.message));
      }
    }

    return { deletedCount: count };
  },

  async clearAllSystemData(requestingUserId: string): Promise<{ deletedDevices: number; deletedUsers: number }> {
    const state = readLocalDB();
    const user = state.users.find(u => u.id === requestingUserId);
    if (!user || user.role !== 'ADMIN') {
      return { deletedDevices: 0, deletedUsers: 0 };
    }

    const devCount = state.devices.length;
    const nonAdminUsers = state.users.filter(u => u.role !== 'ADMIN');
    const userCount = nonAdminUsers.length;
    const nonAdminIds = new Set(nonAdminUsers.map(u => u.id));

    // Clear all telemetry and devices
    state.devices = [];
    state.locations = [];
    state.statuses = [];
    state.activities = [];
    state.appUsages = [];
    state.webHistory = [];

    // Keep only Admin accounts & active admin sessions
    state.users = state.users.filter(u => u.role === 'ADMIN');
    state.sessions = state.sessions.filter(s => !nonAdminIds.has(s.userId));

    writeLocalDB(state, true);

    if (pgPool) {
      try {
        await pgPool.query('DELETE FROM activities');
        await pgPool.query('DELETE FROM app_usages');
        await pgPool.query('DELETE FROM web_history');
        await pgPool.query('DELETE FROM device_locations');
        await pgPool.query('DELETE FROM device_statuses');
        await pgPool.query('DELETE FROM devices');
        await pgPool.query("DELETE FROM users WHERE role != 'ADMIN'");
      } catch (e: any) {
        console.warn('Neon clearAllSystemData error:', e.message);
      }
    }

    return { deletedDevices: devCount, deletedUsers: userCount };
  },

  // PHONE CONTACTS & SDT MANAGEMENT
  async getDeviceContacts(deviceId: string, requestingUserId: string): Promise<PhoneContact[] | null> {
    const state = readLocalDB();
    const user = state.users.find(u => u.id === requestingUserId);
    const dev = state.devices.find(d => d.id === deviceId);
    if (!dev || !user) return null;
    const enriched = enrichDevice(dev, state);
    if (!canUserAccessDevice(user, enriched)) return null;

    let contacts = dev.phoneContacts || [];
    if (contacts.length === 0 && dev.parentPhone) {
      contacts = [
        {
          id: 'con_' + dev.id + '_default',
          name: dev.ownerName && dev.ownerName !== 'Chưa rõ' ? dev.ownerName : 'Phụ huynh chính',
          phone: dev.parentPhone,
          relationship: 'Phụ huynh',
          isEmergencyAlert: true,
          createdAt: dev.createdAt || new Date().toISOString(),
        },
      ];
      dev.phoneContacts = contacts;
      writeLocalDB(state);
    }
    return contacts;
  },

  async addDeviceContact(
    deviceId: string,
    requestingUserId: string,
    contactData: { name: string; phone: string; relationship?: string; isEmergencyAlert?: boolean; notes?: string }
  ): Promise<PhoneContact[] | null> {
    const state = readLocalDB();
    const user = state.users.find(u => u.id === requestingUserId);
    const dev = state.devices.find(d => d.id === deviceId);
    if (!dev || !user) return null;
    const enriched = enrichDevice(dev, state);
    if (!canUserAccessDevice(user, enriched)) return null;

    const newContact: PhoneContact = {
      id: 'con_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: contactData.name.trim() || 'Người liên hệ',
      phone: contactData.phone.trim(),
      relationship: contactData.relationship?.trim() || 'Phụ huynh',
      isEmergencyAlert: contactData.isEmergencyAlert ?? true,
      notes: contactData.notes?.trim(),
      createdAt: new Date().toISOString(),
    };

    if (!dev.phoneContacts) dev.phoneContacts = [];
    dev.phoneContacts.push(newContact);
    if (!dev.parentPhone) dev.parentPhone = newContact.phone;

    state.activities.unshift({
      id: 'act_' + Date.now(),
      deviceId: dev.id,
      deviceName: dev.name,
      platform: dev.platform,
      studentName: dev.studentName,
      schoolName: dev.schoolName,
      className: dev.className,
      type: 'DEVICE_ACTIVE',
      description: `Thêm số điện thoại mới: ${newContact.name} (${newContact.phone} - ${newContact.relationship})`,
      timestamp: new Date().toISOString(),
    });

    writeLocalDB(state);
    return dev.phoneContacts;
  },

  async deleteDeviceContact(deviceId: string, contactId: string, requestingUserId: string): Promise<PhoneContact[] | null> {
    const state = readLocalDB();
    const user = state.users.find(u => u.id === requestingUserId);
    const dev = state.devices.find(d => d.id === deviceId);
    if (!dev || !user) return null;
    const enriched = enrichDevice(dev, state);
    if (!canUserAccessDevice(user, enriched)) return null;

    if (!dev.phoneContacts) dev.phoneContacts = [];
    const removedContact = dev.phoneContacts.find(c => c.id === contactId);
    dev.phoneContacts = dev.phoneContacts.filter(c => c.id !== contactId);

    // If removed was the main parentPhone, update to the next available contact or empty
    if (removedContact && dev.parentPhone && dev.parentPhone.replace(/\D/g, '') === removedContact.phone.replace(/\D/g, '')) {
      dev.parentPhone = dev.phoneContacts.length > 0 ? dev.phoneContacts[0].phone : '';
    }

    state.activities.unshift({
      id: 'act_' + Date.now(),
      deviceId: dev.id,
      deviceName: dev.name,
      platform: dev.platform,
      studentName: dev.studentName,
      schoolName: dev.schoolName,
      className: dev.className,
      type: 'DEVICE_ACTIVE',
      description: `Đã xoá số điện thoại ${removedContact ? `${removedContact.name} (${removedContact.phone})` : contactId} khỏi danh sách SĐT`,
      timestamp: new Date().toISOString(),
    });

    writeLocalDB(state);
    return dev.phoneContacts;
  },

  async clearDeviceContacts(deviceId: string, requestingUserId: string): Promise<boolean> {
    const state = readLocalDB();
    const user = state.users.find(u => u.id === requestingUserId);
    const dev = state.devices.find(d => d.id === deviceId);
    if (!dev || !user) return false;
    const enriched = enrichDevice(dev, state);
    if (!canUserAccessDevice(user, enriched)) return false;

    const count = dev.phoneContacts?.length || 0;
    dev.phoneContacts = [];
    dev.parentPhone = '';

    state.activities.unshift({
      id: 'act_' + Date.now(),
      deviceId: dev.id,
      deviceName: dev.name,
      platform: dev.platform,
      studentName: dev.studentName,
      schoolName: dev.schoolName,
      className: dev.className,
      type: 'DEVICE_ACTIVE',
      description: `Đã xoá toàn bộ danh sách số điện thoại (${count} SĐT) của thiết bị ${dev.name}`,
      timestamp: new Date().toISOString(),
    });

    writeLocalDB(state);
    return true;
  },

  // APP & WEB USAGE TELEMETRY AND BLOCKING
  async getDeviceUsage(deviceId: string): Promise<{ appUsages: AppUsageItem[]; webHistory: WebVisitItem[] }> {
    const state = readLocalDB();
    const appUsages = state.appUsages
      .filter(a => a.deviceId === deviceId)
      .sort((a, b) => b.durationMinutes - a.durationMinutes);
    const webHistory = state.webHistory
      .filter(w => w.deviceId === deviceId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return { appUsages, webHistory };
  },

  async recordAppAndWebUsage(
    deviceId: string,
    payload: {
      appName?: string;
      appCategory?: AppUsageItem['category'];
      appIcon?: string;
      durationMinutes?: number;
      websiteUrl?: string;
      websiteTitle?: string;
      webCategory?: WebVisitItem['category'];
    }
  ): Promise<{ appUsages: AppUsageItem[]; webHistory: WebVisitItem[] }> {
    const state = readLocalDB();
    const d = state.devices.find(x => x.id === deviceId);
    const nowIso = new Date().toISOString();

    if (d) {
      d.lastSeen = nowIso;
      d.updatedAt = nowIso;

      if (payload.appName && payload.appName.trim()) {
        const appName = payload.appName.trim();
        d.currentApp = appName;

        // Mark other apps on this device as not foreground
        state.appUsages.forEach(a => {
          if (a.deviceId === deviceId) a.isRunning = false;
        });

        const existingApp = state.appUsages.find(
          a => a.deviceId === deviceId && a.appName.toLowerCase() === appName.toLowerCase()
        );
        const addMins = payload.durationMinutes ?? 10;

        if (existingApp) {
          existingApp.durationMinutes += addMins;
          existingApp.lastUsed = nowIso;
          existingApp.isRunning = !existingApp.isBlocked;
        } else {
          const cat = payload.appCategory || 'SOCIAL';
          const isBlocked = (d.blockedApps || []).some(b => b.toLowerCase() === appName.toLowerCase());
          state.appUsages.push({
            id: 'app_' + Date.now(),
            deviceId,
            appName,
            packageName: 'app.' + appName.toLowerCase().replace(/[^a-z0-9]/g, ''),
            category: cat,
            icon: payload.appIcon || (cat === 'GAME' ? '🎮' : cat === 'EDUCATION' ? '📚' : '📱'),
            durationMinutes: addMins,
            lastUsed: nowIso,
            isRunning: !isBlocked,
            isBlocked,
            riskLevel: isBlocked ? 'RESTRICTED' : cat === 'GAME' || cat === 'SOCIAL' ? 'WARNING' : 'SAFE',
          });
        }

        state.activities.unshift({
          id: 'act_' + Date.now() + '_app',
          deviceId: d.id,
          deviceName: d.name,
          platform: d.platform,
          studentName: d.studentName,
          schoolName: d.schoolName,
          className: d.className,
          type: 'APP_OPENED',
          description: `Học sinh ${d.studentName || d.name} mở ứng dụng "${appName}" (+${addMins} phút)`,
          timestamp: nowIso,
        });
      }

      if (payload.websiteUrl && payload.websiteUrl.trim()) {
        let rawUrl = payload.websiteUrl.trim();
        if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
          rawUrl = 'https://' + rawUrl;
        }
        let domain = rawUrl;
        try {
          domain = new URL(rawUrl).hostname.replace(/^www\./, '');
        } catch {
          domain = rawUrl.replace(/^https?:\/\//, '').split('/')[0];
        }

        d.currentWebsite = domain;
        const isBlocked = (d.blockedWebsites || []).some(b => b.toLowerCase() === domain.toLowerCase());
        const webCat = payload.webCategory || 'OTHER';

        const existingWeb = state.webHistory.find(
          w => w.deviceId === deviceId && w.domain.toLowerCase() === domain.toLowerCase()
        );
        if (existingWeb) {
          existingWeb.visitCount += 1;
          existingWeb.durationMinutes += payload.durationMinutes ?? 5;
          existingWeb.timestamp = nowIso;
          existingWeb.url = rawUrl;
          if (payload.websiteTitle) existingWeb.pageTitle = payload.websiteTitle;
        } else {
          state.webHistory.unshift({
            id: 'web_' + Date.now(),
            deviceId,
            url: rawUrl,
            domain,
            pageTitle: payload.websiteTitle || `Trang web ${domain}`,
            category: webCat,
            durationMinutes: payload.durationMinutes ?? 5,
            visitCount: 1,
            timestamp: nowIso,
            isBlocked,
            riskLevel: isBlocked ? 'RESTRICTED' : webCat === 'GAME' || webCat === 'SOCIAL' ? 'WARNING' : 'SAFE',
          });
        }

        state.activities.unshift({
          id: 'act_' + Date.now() + '_web',
          deviceId: d.id,
          deviceName: d.name,
          platform: d.platform,
          studentName: d.studentName,
          schoolName: d.schoolName,
          className: d.className,
          type: 'WEB_VISITED',
          description: `Học sinh ${d.studentName || d.name} truy cập website "${domain}"`,
          timestamp: nowIso,
        });
      }
    }

    writeLocalDB(state);
    return this.getDeviceUsage(deviceId);
  },

  async toggleBlockItem(
    deviceId: string,
    targetType: 'APP' | 'WEB',
    targetName: string,
    actorName: string
  ): Promise<{ device: DeviceRecord; appUsages: AppUsageItem[]; webHistory: WebVisitItem[] } | null> {
    const state = readLocalDB();
    const d = state.devices.find(x => x.id === deviceId);
    if (!d) return null;

    const cleanName = targetName.trim();
    const nowIso = new Date().toISOString();

    if (targetType === 'APP') {
      d.blockedApps = d.blockedApps || [];
      const existsIdx = d.blockedApps.findIndex(x => x.toLowerCase() === cleanName.toLowerCase());
      let blockedNow = false;
      if (existsIdx >= 0) {
        d.blockedApps.splice(existsIdx, 1);
        blockedNow = false;
      } else {
        d.blockedApps.push(cleanName);
        blockedNow = true;
      }

      const appItem = state.appUsages.find(
        a => a.deviceId === deviceId && a.appName.toLowerCase() === cleanName.toLowerCase()
      );
      if (appItem) {
        appItem.isBlocked = blockedNow;
        appItem.riskLevel = blockedNow ? 'RESTRICTED' : appItem.category === 'EDUCATION' ? 'SAFE' : 'WARNING';
        if (blockedNow) appItem.isRunning = false;
      } else if (blockedNow) {
        state.appUsages.push({
          id: 'app_' + Date.now(),
          deviceId,
          appName: cleanName,
          packageName: 'app.' + cleanName.toLowerCase().replace(/[^a-z0-9]/g, ''),
          category: 'OTHER',
          icon: '🚫',
          durationMinutes: 0,
          lastUsed: nowIso,
          isRunning: false,
          isBlocked: true,
          riskLevel: 'RESTRICTED',
        });
      }

      state.activities.unshift({
        id: 'act_' + Date.now(),
        deviceId: d.id,
        deviceName: d.name,
        platform: d.platform,
        studentName: d.studentName,
        schoolName: d.schoolName,
        className: d.className,
        type: 'POLICY_UPDATED',
        description: `${actorName} đã ${blockedNow ? 'CHẶN' : 'MỞ KHÓA'} ứng dụng "${cleanName}" trên máy của ${d.studentName || d.name}`,
        timestamp: nowIso,
      });
    } else {
      const cleanDomain = cleanName.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      d.blockedWebsites = d.blockedWebsites || [];
      const existsIdx = d.blockedWebsites.findIndex(x => x.toLowerCase() === cleanDomain.toLowerCase());
      let blockedNow = false;
      if (existsIdx >= 0) {
        d.blockedWebsites.splice(existsIdx, 1);
        blockedNow = false;
      } else {
        d.blockedWebsites.push(cleanDomain);
        blockedNow = true;
      }

      const webItem = state.webHistory.find(
        w => w.deviceId === deviceId && w.domain.toLowerCase() === cleanDomain.toLowerCase()
      );
      if (webItem) {
        webItem.isBlocked = blockedNow;
        webItem.riskLevel = blockedNow ? 'RESTRICTED' : webItem.category === 'EDUCATION' ? 'SAFE' : 'WARNING';
      } else if (blockedNow) {
        state.webHistory.unshift({
          id: 'web_' + Date.now(),
          deviceId,
          url: 'https://' + cleanDomain,
          domain: cleanDomain,
          pageTitle: `Website bị chặn (${cleanDomain})`,
          category: 'OTHER',
          durationMinutes: 0,
          visitCount: 0,
          timestamp: nowIso,
          isBlocked: true,
          riskLevel: 'RESTRICTED',
        });
      }

      state.activities.unshift({
        id: 'act_' + Date.now(),
        deviceId: d.id,
        deviceName: d.name,
        platform: d.platform,
        studentName: d.studentName,
        schoolName: d.schoolName,
        className: d.className,
        type: 'POLICY_UPDATED',
        description: `${actorName} đã ${blockedNow ? 'CHẶN' : 'BỎ CHẶN'} website "${cleanDomain}" trên máy của ${d.studentName || d.name}`,
        timestamp: nowIso,
      });
    }

    writeLocalDB(state);
    const usage = await this.getDeviceUsage(deviceId);
    return {
      device: enrichDevice(d, state),
      ...usage,
    };
  },

  // LOCATIONS - Cơ chế CHỈ THÊM KHÔNG BỚT (Toàn bộ tọa độ GPS được lưu vĩnh viễn)
  async recordLocation(loc: DeviceLocationRecord): Promise<DeviceLocationRecord> {
    const state = readLocalDB();
    // Chỉ thêm không bớt: bảo toàn vĩnh viễn toàn bộ lịch sử điểm di chuyển
    state.locations.unshift(loc);

    const d = state.devices.find(x => x.id === loc.deviceId);
    if (d) {
      d.lastSeen = loc.timestamp;
      d.updatedAt = loc.timestamp;
      d.latitude = loc.latitude;
      d.longitude = loc.longitude;
      if (loc.accuracy) d.accuracy = loc.accuracy;

      state.activities.unshift({
        id: 'act_' + Date.now(),
        deviceId: d.id,
        deviceName: d.name,
        platform: d.platform,
        studentName: d.studentName,
        schoolName: d.schoolName,
        className: d.className,
        type: 'LOCATION_UPDATE',
        description: `Cập nhật tọa độ GPS (${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)})`,
        timestamp: loc.timestamp,
      });
    }

    if (pgPool) {
      pgPool.query(
        `INSERT INTO device_locations (id, "deviceId", latitude, longitude, accuracy, timestamp, "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [loc.id, loc.deviceId, loc.latitude, loc.longitude, loc.accuracy || null, loc.timestamp, loc.createdAt || loc.timestamp]
      ).catch((e: any) => console.warn('PG recordLocation error:', e.message));
    }

    writeLocalDB(state);
    return loc;
  },

  async getLatestLocation(deviceId: string): Promise<DeviceLocationRecord | null> {
    const state = readLocalDB();
    return state.locations
      .filter(l => l.deviceId === deviceId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] || null;
  },

  async getLocationHistory(deviceId: string, range?: string): Promise<DeviceLocationRecord[]> {
    let cutoff: Date | null = null;
    const now = new Date();
    if (range === 'today') {
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === '7days') {
      cutoff = new Date(now.getTime() - 7 * 86400000);
    } else if (range === '30days') {
      cutoff = new Date(now.getTime() - 30 * 86400000);
    } // If range === 'all' or empty, cutoff remains null (lấy toàn bộ từ trước đến nay - chỉ thêm không bớt)

    const state = readLocalDB();
    const localMatches = state.locations
      .filter(l => l.deviceId === deviceId && (!cutoff || new Date(l.timestamp) >= cutoff))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (pgPool) {
      try {
        let query = `SELECT id, "deviceId", latitude, longitude, accuracy, timestamp, "createdAt"
                     FROM device_locations
                     WHERE "deviceId" = $1`;
        const params: any[] = [deviceId];
        if (cutoff) {
          query += ` AND timestamp >= $2`;
          params.push(cutoff.toISOString());
        }
        query += ` ORDER BY timestamp DESC`;

        const res = await pgPool.query(query, params);
        if (res.rows && res.rows.length > 0) {
          const map = new Map<string, DeviceLocationRecord>();
          for (const l of res.rows) {
            map.set(l.id, l as DeviceLocationRecord);
          }
          for (const l of localMatches) {
            if (!map.has(l.id)) {
              map.set(l.id, l);
            }
          }
          return Array.from(map.values())
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        }
      } catch (err: any) {
        console.warn('Neon getLocationHistory warning:', err.message);
      }
    }

    return localMatches;
  },

  // Lấy toàn bộ lịch sử di chuyển của tất cả thiết bị (Chỉ thêm không bớt)
  async getAllMovementLocations(range?: string, deviceId?: string): Promise<(DeviceLocationRecord & { deviceName?: string; studentName?: string; className?: string; schoolName?: string })[]> {
    let cutoff: Date | null = null;
    const now = new Date();
    if (range === 'today') {
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === '7days') {
      cutoff = new Date(now.getTime() - 7 * 86400000);
    } else if (range === '30days') {
      cutoff = new Date(now.getTime() - 30 * 86400000);
    }

    const state = readLocalDB();
    const devMap = new Map(state.devices.map(d => [d.id, d]));

    let locations = [...state.locations];
    if (deviceId && deviceId !== 'ALL') {
      locations = locations.filter(l => l.deviceId === deviceId);
    }
    if (cutoff) {
      locations = locations.filter(l => new Date(l.timestamp) >= cutoff!);
    }

    if (pgPool) {
      try {
        let query = `SELECT id, "deviceId", latitude, longitude, accuracy, timestamp, "createdAt" FROM device_locations`;
        const params: any[] = [];
        const conditions: string[] = [];

        if (deviceId && deviceId !== 'ALL') {
          conditions.push(`"deviceId" = $${params.length + 1}`);
          params.push(deviceId);
        }
        if (cutoff) {
          conditions.push(`timestamp >= $${params.length + 1}`);
          params.push(cutoff.toISOString());
        }
        if (conditions.length > 0) {
          query += ` WHERE ` + conditions.join(' AND ');
        }
        query += ` ORDER BY timestamp DESC LIMIT 50000`;

        const res = await pgPool.query(query, params);
        if (res.rows && res.rows.length > 0) {
          const map = new Map<string, DeviceLocationRecord>();
          for (const l of res.rows) {
            map.set(l.id, l as DeviceLocationRecord);
          }
          for (const l of locations) {
            if (!map.has(l.id)) {
              map.set(l.id, l);
            }
          }
          locations = Array.from(map.values());
        }
      } catch (err: any) {
        console.warn('Neon getAllMovementLocations warning:', err.message);
      }
    }

    return locations
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .map(loc => {
        const d = devMap.get(loc.deviceId);
        return {
          ...loc,
          deviceName: d?.name || 'Thiết bị',
          studentName: d?.studentName || d?.name || 'Học sinh',
          className: d?.className || '',
          schoolName: d?.schoolName || '',
        };
      });
  },

  // STATUS & HEARTBEAT
  async recordStatus(status: DeviceStatusRecord): Promise<DeviceStatusRecord> {
    const state = readLocalDB();
    const oldStatus = state.statuses
      .filter(s => s.deviceId === status.deviceId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    state.statuses.unshift(status);

    const d = state.devices.find(x => x.id === status.deviceId);
    if (d) {
      d.lastSeen = status.timestamp;
      d.updatedAt = status.timestamp;

      if (!oldStatus || oldStatus.status !== status.status) {
        state.activities.unshift({
          id: 'act_' + Date.now(),
          deviceId: d.id,
          deviceName: d.name,
          platform: d.platform,
          studentName: d.studentName,
          schoolName: d.schoolName,
          className: d.className,
          type: status.status === 'ONLINE' ? 'ONLINE' : status.status === 'IDLE' ? 'IDLE' : 'OFFLINE',
          description: `Trạng thái thiết bị đổi thành ${status.status}`,
          timestamp: status.timestamp,
        });
      }
      if (oldStatus && !oldStatus.charging && status.charging) {
        state.activities.unshift({
          id: 'act_' + (Date.now() + 1),
          deviceId: d.id,
          deviceName: d.name,
          platform: d.platform,
          studentName: d.studentName,
          schoolName: d.schoolName,
          className: d.className,
          type: 'CHARGING_STARTED',
          description: `Thiết bị bắt đầu sạc pin (${status.batteryLevel}%)`,
          timestamp: status.timestamp,
        });
      }
      if (status.batteryLevel <= 20 && (!oldStatus || oldStatus.batteryLevel > 20)) {
        state.activities.unshift({
          id: 'act_' + (Date.now() + 2),
          deviceId: d.id,
          deviceName: d.name,
          platform: d.platform,
          studentName: d.studentName,
          schoolName: d.schoolName,
          className: d.className,
          type: 'BATTERY_LOW',
          description: `Cảnh báo: Pin thiết bị xuống mức yếu (${status.batteryLevel}%)`,
          timestamp: status.timestamp,
        });
      }
    }

    writeLocalDB(state);
    return status;
  },

  async getLatestStatus(deviceId: string): Promise<DeviceStatusRecord | null> {
    const state = readLocalDB();
    return state.statuses
      .filter(s => s.deviceId === deviceId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] || null;
  },

  // SESSIONS
  async createSession(session: SessionRecord): Promise<SessionRecord> {
    const state = readLocalDB();
    state.sessions.push(session);
    writeLocalDB(state);
    return session;
  },

  async deleteSession(token: string): Promise<void> {
    const state = readLocalDB();
    state.sessions = state.sessions.filter(s => s.token !== token);
    writeLocalDB(state);
  },

  // ACTIVITIES
  async getAllActivities(limit = 80): Promise<ActivityEvent[]> {
    const state = readLocalDB();
    if (pgPool) {
      try {
        const res = await pgPool.query('SELECT * FROM activities ORDER BY timestamp DESC LIMIT $1', [limit]);
        if (res.rows && res.rows.length > 0) {
          const map = new Map<string, ActivityEvent>();
          for (const a of res.rows) {
            map.set(a.id, a as ActivityEvent);
          }
          for (const a of state.activities) {
            if (!map.has(a.id)) map.set(a.id, a);
          }
          return Array.from(map.values())
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);
        }
      } catch (err: any) {
        console.warn('Neon getAllActivities warning:', err.message);
      }
    }
    return state.activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  },

  async getActivitiesForUser(userId?: string, limit = 80): Promise<ActivityEvent[]> {
    if (!userId) {
      return this.getAllActivities(limit);
    }
    const devices = await this.getAccessibleDevices(userId);
    const deviceIds = new Set(devices.map(d => d.id));

    const all = await this.getAllActivities(limit * 2);
    return all.filter(a => deviceIds.has(a.deviceId)).slice(0, limit);
  },

  async getActivitiesForDevice(deviceId: string, limit = 50): Promise<ActivityEvent[]> {
    const all = await this.getAllActivities(limit * 2);
    return all.filter(a => a.deviceId === deviceId).slice(0, limit);
  },

  // DATABASE STATS FOR NEON AND LOCAL
  async getDatabaseStats(): Promise<{
    isNeonConnected: boolean;
    totalUsers: number;
    totalDevices: number;
    totalLocations: number;
    neonUsersCount?: number;
    neonDevicesCount?: number;
    neonLocationsCount?: number;
    databaseEngine: string;
  }> {
    const state = readLocalDB();
    let neonUsersCount: number | undefined;
    let neonDevicesCount: number | undefined;
    let neonLocationsCount: number | undefined;

    if (pgPool && isPostgresConnected) {
      try {
        const [uRes, dRes, lRes] = await Promise.all([
          pgPool.query('SELECT COUNT(*) FROM users'),
          pgPool.query('SELECT COUNT(*) FROM devices'),
          pgPool.query('SELECT COUNT(*) FROM device_locations'),
        ]);
        neonUsersCount = parseInt(uRes.rows[0]?.count || '0', 10);
        neonDevicesCount = parseInt(dRes.rows[0]?.count || '0', 10);
        neonLocationsCount = parseInt(lRes.rows[0]?.count || '0', 10);
      } catch (err: any) {
        console.warn('Neon stats query warning:', err.message);
      }
    }

    return {
      isNeonConnected: Boolean(isPostgresConnected && pgPool),
      totalUsers: neonUsersCount ?? state.users.length,
      totalDevices: neonDevicesCount ?? state.devices.length,
      totalLocations: neonLocationsCount ?? state.locations.length,
      neonUsersCount,
      neonDevicesCount,
      neonLocationsCount,
      databaseEngine: isPostgresConnected && pgPool ? 'Neon PostgreSQL (Production)' : 'Local Persistent Engine (Active)',
    };
  },
};
