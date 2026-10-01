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
      id: 'usr_admin_' + Date.now().toString(36),
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

  if (dbUrl && dbUrl.startsWith('postgresql://') && !dbUrl.includes('user:password@ep-xyz')) {
    try {
      pgPool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 3000,
      });

      pgPool.on('error', (err) => {
        console.warn('PostgreSQL pool background warning (using local persistent store):', err.message);
      });

      const client = await pgPool.connect();
      console.log('Successfully connected to Neon PostgreSQL database.');
      isPostgresConnected = true;

      // Auto-create required tables in Neon PostgreSQL if not exist
      await client.query(`
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
      `);

      // Sync existing devices from Neon into local state
      try {
        const devRes = await client.query('SELECT * FROM devices');
        if (devRes.rows && devRes.rows.length > 0) {
          const state = readLocalDB();
          state.devices = devRes.rows;
          writeLocalDB(state);
        }
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

function readLocalDB(): DBState {
  if (!fs.existsSync(DATA_FILE)) {
    const empty = createInitialEmptyState();
    ensureDefaultAdmin(empty);
    fs.writeFileSync(DATA_FILE, JSON.stringify(empty, null, 2), 'utf-8');
    return empty;
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
    return ensureDefaultAdmin(state);
  } catch {
    const empty = createInitialEmptyState();
    ensureDefaultAdmin(empty);
    return empty;
  }
}

function writeLocalDB(state: DBState): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
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

  // Time calculation for real-time heartbeat
  const lastSeenMs = d.lastSeen ? new Date(d.lastSeen).getTime() : 0;
  const isHeartbeatFresh = (Date.now() - lastSeenMs) <= 30000; // within 30s
  const isOnlineComputed = !d.isUninstalled && isHeartbeatFresh && d.networkType !== 'NONE';
  const computedStatus = d.isUninstalled ? 'OFFLINE' : (isOnlineComputed ? 'ONLINE' : 'OFFLINE');
  const isNoNet = d.networkType === 'NONE' || Boolean(d.isNoNetwork);
  const inClass = computedStatus === 'ONLINE' && isCurrentlyInClassHours();

  // Suspected uninstalled: if marked uninstalled OR if was online and silent > 60s
  const isSuspectedUninstalled = Boolean(d.isUninstalled) || (!isHeartbeatFresh && Boolean(d.lastSeen) && (Date.now() - lastSeenMs > 60000) && d.isUninstalled !== false && !isNoNet);

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
    return state.users.find(u => u.email.toLowerCase() === normEmail) || null;
  },

  async findUserByEmailOrPhone(identifier: string): Promise<UserRecord | null> {
    if (!identifier) return null;
    const raw = String(identifier).toLowerCase().trim().replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '');
    const cleanDigits = raw.replace(/\D/g, '');
    const state = readLocalDB();
    return (
      state.users.find((u) => {
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
      }) || null
    );
  },

  async findUserById(id: string): Promise<UserRecord | null> {
    const state = readLocalDB();
    return state.users.find(u => u.id === id) || null;
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
    return user;
  },

  async updateUser(id: string, updates: Partial<UserRecord>): Promise<UserRecord | null> {
    const state = readLocalDB();
    const idx = state.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    state.users[idx] = {
      ...state.users[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
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
    state.users[idx].approvalStatus = approvalStatus;
    state.users[idx].approvedBy = adminName;
    state.users[idx].approvedAt = new Date().toISOString();
    state.users[idx].updatedAt = new Date().toISOString();
    writeLocalDB(state);
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
    return true;
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

      if (pgPool) {
        pgPool.query(
          `INSERT INTO devices (id, "userId", "deviceUuid", name, platform, "studentName", "schoolName", "className", "currentApp", "currentWebsite", "batteryLevel", charging, "networkType", latitude, longitude, accuracy, "lastSeen", "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
           ON CONFLICT (id) DO UPDATE SET "lastSeen" = $17, "updatedAt" = $19`,
          [
            device.id,
            device.userId,
            device.deviceUuid,
            device.name,
            device.platform,
            device.studentName,
            device.schoolName,
            device.className,
            device.currentApp,
            device.currentWebsite,
            device.batteryLevel,
            device.charging,
            device.networkType,
            device.latitude,
            device.longitude,
            device.accuracy,
            nowIso,
            nowIso,
            nowIso,
          ]
        ).catch((e: any) => console.warn('PG device insert error:', e.message));
      }
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
        device.isUninstalled = false;
        device.status = 'ONLINE';
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
      state.locations.unshift(locRecord);
      if (state.locations.length > 1000) state.locations = state.locations.slice(0, 1000);

      if (pgPool) {
        pgPool.query(
          `INSERT INTO device_locations (id, "deviceId", latitude, longitude, accuracy, timestamp, "createdAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
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
    return true;
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

  // LOCATIONS
  async recordLocation(loc: DeviceLocationRecord): Promise<DeviceLocationRecord> {
    const state = readLocalDB();
    state.locations.unshift(loc);
    const devLocs = state.locations.filter(l => l.deviceId === loc.deviceId);
    if (devLocs.length > 500) {
      state.locations = state.locations.filter(l => l.deviceId !== loc.deviceId || devLocs.slice(0, 500).includes(l));
    }

    const d = state.devices.find(x => x.id === loc.deviceId);
    if (d) {
      d.lastSeen = loc.timestamp;
      d.updatedAt = loc.timestamp;
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
    let cutoff = new Date(0);
    const now = new Date();
    if (range === 'today') {
      cutoff = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (range === '7days') {
      cutoff = new Date(now.getTime() - 7 * 86400000);
    } else if (range === '30days') {
      cutoff = new Date(now.getTime() - 30 * 86400000);
    }

    const state = readLocalDB();
    return state.locations
      .filter(l => l.deviceId === deviceId && new Date(l.timestamp) >= cutoff)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 300);
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

    const state = readLocalDB();
    return state.activities
      .filter(a => deviceIds.has(a.deviceId))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  },

  async getActivitiesForDevice(deviceId: string, limit = 50): Promise<ActivityEvent[]> {
    const state = readLocalDB();
    return state.activities
      .filter(a => a.deviceId === deviceId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  },
};
