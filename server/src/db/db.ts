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
  ApprovalStatus,
  UserRole,
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

function createInitialSeedState(): DBState {
  const now = new Date();
  const isoNow = now.toISOString();
  const minAgo = (m: number) => new Date(now.getTime() - m * 60000).toISOString();
  const passwordHash = bcrypt.hashSync('123456', 10);

  const users: UserRecord[] = [
    {
      id: 'usr_admin_supreme',
      name: 'Quản Trị Viên Tối Thượng (Admin)',
      email: 'admin@devicemonitor.vn',
      passwordHash,
      role: 'ADMIN',
      approvalStatus: 'APPROVED',
      schoolName: 'Toàn Hệ Thống Giáo Dục',
      phone: '0901234567',
      createdAt: minAgo(10000),
      updatedAt: isoNow,
    },
    {
      id: 'usr_teacher_lhp',
      name: 'Cô Nguyễn Thị Lan (GVCN)',
      email: 'gv.lan@lehongphong.edu.vn',
      passwordHash,
      role: 'TEACHER',
      approvalStatus: 'APPROVED',
      schoolName: 'THPT Chuyên Lê Hồng Phong',
      className: '10A1',
      phone: '0912345678',
      approvedBy: 'Quản Trị Viên Tối Thượng (Admin)',
      approvedAt: minAgo(5000),
      createdAt: minAgo(6000),
      updatedAt: isoNow,
    },
    {
      id: 'usr_teacher_nd_pending',
      name: 'Thầy Trần Văn Hùng (GVCN)',
      email: 'gv.hung@nguyendu.edu.vn',
      passwordHash,
      role: 'TEACHER',
      approvalStatus: 'PENDING',
      schoolName: 'THCS Nguyễn Du',
      className: '8A2',
      phone: '0987654321',
      createdAt: minAgo(180),
      updatedAt: minAgo(180),
    },
    {
      id: 'usr_parent_minh',
      name: 'PH Nguyễn Hoàng Minh',
      email: 'ph.minh@gmail.com',
      passwordHash,
      role: 'PARENT',
      approvalStatus: 'APPROVED',
      schoolName: 'THPT Chuyên Lê Hồng Phong',
      className: '10A1',
      studentName: 'Nguyễn Minh Khôi, Nguyễn Ngọc Ánh',
      phone: '0933445566',
      approvedBy: 'Quản Trị Viên Tối Thượng (Admin)',
      approvedAt: minAgo(4000),
      createdAt: minAgo(4500),
      updatedAt: isoNow,
    },
    {
      id: 'usr_parent_tuan',
      name: 'PH Trần Anh Tuấn',
      email: 'ph.tuan@gmail.com',
      passwordHash,
      role: 'PARENT',
      approvalStatus: 'APPROVED',
      schoolName: 'THPT Chuyên Lê Hồng Phong',
      className: '10A2',
      studentName: 'Trần Quốc Bảo',
      phone: '0944556677',
      approvedBy: 'Quản Trị Viên Tối Thượng (Admin)',
      approvedAt: minAgo(3200),
      createdAt: minAgo(3500),
      updatedAt: isoNow,
    },
    {
      id: 'usr_parent_hoa_pending',
      name: 'PH Lê Thị Thanh Hoa',
      email: 'ph.hoa@gmail.com',
      passwordHash,
      role: 'PARENT',
      approvalStatus: 'PENDING',
      schoolName: 'THCS Nguyễn Du',
      className: '8A2',
      studentName: 'Lê Hoàng Nam',
      phone: '0977889900',
      createdAt: minAgo(95),
      updatedAt: minAgo(95),
    },
  ];

  const devices: DeviceRecord[] = [
    {
      id: 'dev_student_khoi',
      userId: 'usr_parent_minh',
      name: 'iPhone 15 Pro - Minh Khôi',
      deviceUuid: 'DEV-KHOI-10A1-LHP',
      platform: 'iOS',
      osVersion: 'iOS 18.1',
      appVersion: '2.1.0',
      studentName: 'Nguyễn Minh Khôi',
      schoolName: 'THPT Chuyên Lê Hồng Phong',
      className: '10A1',
      currentApp: 'TikTok',
      currentWebsite: 'tiktok.com/@studywithme',
      screenTimeMinutes: 145,
      blockedApps: ['Liên Quân Mobile'],
      blockedWebsites: ['roblox.com'],
      lastSeen: minAgo(2),
      createdAt: minAgo(4000),
      updatedAt: minAgo(2),
    },
    {
      id: 'dev_student_anh',
      userId: 'usr_parent_minh',
      name: 'iPad Air 5 - Ngọc Ánh',
      deviceUuid: 'DEV-ANH-10A1-LHP',
      platform: 'Tablet',
      osVersion: 'iPadOS 18.0',
      appVersion: '2.1.0',
      studentName: 'Nguyễn Ngọc Ánh',
      schoolName: 'THPT Chuyên Lê Hồng Phong',
      className: '10A1',
      currentApp: 'Google Classroom',
      currentWebsite: 'hocmai.vn/khoa-hoc-toan-10',
      screenTimeMinutes: 92,
      blockedApps: [],
      blockedWebsites: [],
      lastSeen: minAgo(5),
      createdAt: minAgo(3900),
      updatedAt: minAgo(5),
    },
    {
      id: 'dev_student_bao',
      userId: 'usr_parent_tuan',
      name: 'Samsung Galaxy S24 - Quốc Bảo',
      deviceUuid: 'DEV-BAO-10A2-LHP',
      platform: 'Android',
      osVersion: 'Android 14',
      appVersion: '2.1.0',
      studentName: 'Trần Quốc Bảo',
      schoolName: 'THPT Chuyên Lê Hồng Phong',
      className: '10A2',
      currentApp: 'Liên Quân Mobile',
      currentWebsite: 'lienquan.garena.vn',
      screenTimeMinutes: 210,
      blockedApps: [],
      blockedWebsites: [],
      lastSeen: minAgo(1),
      createdAt: minAgo(3000),
      updatedAt: minAgo(1),
    },
    {
      id: 'dev_student_nam',
      userId: 'usr_parent_hoa_pending',
      name: 'Xiaomi Redmi Note 13 - Hoàng Nam',
      deviceUuid: 'DEV-NAM-8A2-ND',
      platform: 'Android',
      osVersion: 'Android 14',
      appVersion: '2.0.5',
      studentName: 'Lê Hoàng Nam',
      schoolName: 'THCS Nguyễn Du',
      className: '8A2',
      currentApp: 'YouTube',
      currentWebsite: 'youtube.com/watch?v=english-grade-8',
      screenTimeMinutes: 118,
      blockedApps: ['Free Fire'],
      blockedWebsites: [],
      lastSeen: minAgo(14),
      createdAt: minAgo(2000),
      updatedAt: minAgo(14),
    },
  ];

  const statuses: DeviceStatusRecord[] = [
    {
      id: 'stat_seed_1',
      deviceId: 'dev_student_khoi',
      batteryLevel: 78,
      charging: false,
      networkType: '5G',
      locationPermission: true,
      locationSharing: true,
      status: 'ONLINE',
      timestamp: minAgo(2),
    },
    {
      id: 'stat_seed_2',
      deviceId: 'dev_student_anh',
      batteryLevel: 92,
      charging: true,
      networkType: 'WIFI',
      locationPermission: true,
      locationSharing: true,
      status: 'ONLINE',
      timestamp: minAgo(5),
    },
    {
      id: 'stat_seed_3',
      deviceId: 'dev_student_bao',
      batteryLevel: 34,
      charging: false,
      networkType: '4G',
      locationPermission: true,
      locationSharing: true,
      status: 'ONLINE',
      timestamp: minAgo(1),
    },
    {
      id: 'stat_seed_4',
      deviceId: 'dev_student_nam',
      batteryLevel: 64,
      charging: false,
      networkType: 'WIFI',
      locationPermission: true,
      locationSharing: true,
      status: 'IDLE',
      timestamp: minAgo(14),
    },
  ];

  const locations: DeviceLocationRecord[] = [
    {
      id: 'loc_seed_1',
      deviceId: 'dev_student_khoi',
      latitude: 10.7638,
      longitude: 106.6822,
      accuracy: 4.5,
      timestamp: minAgo(2),
      createdAt: minAgo(2),
    },
    {
      id: 'loc_seed_1b',
      deviceId: 'dev_student_khoi',
      latitude: 10.7625,
      longitude: 106.6810,
      accuracy: 5.0,
      timestamp: minAgo(45),
      createdAt: minAgo(45),
    },
    {
      id: 'loc_seed_2',
      deviceId: 'dev_student_anh',
      latitude: 10.7642,
      longitude: 106.6825,
      accuracy: 3.8,
      timestamp: minAgo(5),
      createdAt: minAgo(5),
    },
    {
      id: 'loc_seed_3',
      deviceId: 'dev_student_bao',
      latitude: 10.7651,
      longitude: 106.6818,
      accuracy: 6.2,
      timestamp: minAgo(1),
      createdAt: minAgo(1),
    },
    {
      id: 'loc_seed_4',
      deviceId: 'dev_student_nam',
      latitude: 10.7732,
      longitude: 106.6945,
      accuracy: 5.0,
      timestamp: minAgo(14),
      createdAt: minAgo(14),
    },
  ];

  const appUsages: AppUsageItem[] = [
    // Minh Khôi
    {
      id: 'app_khoi_1',
      deviceId: 'dev_student_khoi',
      appName: 'TikTok',
      packageName: 'com.zhiliaoapp.musically',
      category: 'SOCIAL',
      icon: '🎵',
      durationMinutes: 58,
      lastUsed: minAgo(2),
      isRunning: true,
      isBlocked: false,
      riskLevel: 'WARNING',
    },
    {
      id: 'app_khoi_2',
      deviceId: 'dev_student_khoi',
      appName: 'Google Classroom',
      packageName: 'com.google.android.apps.classroom',
      category: 'EDUCATION',
      icon: '📚',
      durationMinutes: 42,
      lastUsed: minAgo(30),
      isRunning: false,
      isBlocked: false,
      riskLevel: 'SAFE',
    },
    {
      id: 'app_khoi_3',
      deviceId: 'dev_student_khoi',
      appName: 'Zalo',
      packageName: 'com.zing.zalo',
      category: 'SOCIAL',
      icon: '💬',
      durationMinutes: 25,
      lastUsed: minAgo(18),
      isRunning: true,
      isBlocked: false,
      riskLevel: 'SAFE',
    },
    {
      id: 'app_khoi_4',
      deviceId: 'dev_student_khoi',
      appName: 'Liên Quân Mobile',
      packageName: 'com.garena.game.kgvn',
      category: 'GAME',
      icon: '🎮',
      durationMinutes: 20,
      lastUsed: minAgo(120),
      isRunning: false,
      isBlocked: true,
      riskLevel: 'RESTRICTED',
    },
    // Ngọc Ánh
    {
      id: 'app_anh_1',
      deviceId: 'dev_student_anh',
      appName: 'Google Classroom',
      packageName: 'com.google.android.apps.classroom',
      category: 'EDUCATION',
      icon: '📚',
      durationMinutes: 50,
      lastUsed: minAgo(5),
      isRunning: true,
      isBlocked: false,
      riskLevel: 'SAFE',
    },
    {
      id: 'app_anh_2',
      deviceId: 'dev_student_anh',
      appName: 'Duolingo',
      packageName: 'com.duolingo',
      category: 'EDUCATION',
      icon: '🦉',
      durationMinutes: 27,
      lastUsed: minAgo(25),
      isRunning: false,
      isBlocked: false,
      riskLevel: 'SAFE',
    },
    {
      id: 'app_anh_3',
      deviceId: 'dev_student_anh',
      appName: 'YouTube',
      packageName: 'com.google.android.youtube',
      category: 'ENTERTAINMENT',
      icon: '▶️',
      durationMinutes: 15,
      lastUsed: minAgo(60),
      isRunning: false,
      isBlocked: false,
      riskLevel: 'SAFE',
    },
    // Quốc Bảo
    {
      id: 'app_bao_1',
      deviceId: 'dev_student_bao',
      appName: 'Liên Quân Mobile',
      packageName: 'com.garena.game.kgvn',
      category: 'GAME',
      icon: '🎮',
      durationMinutes: 115,
      lastUsed: minAgo(1),
      isRunning: true,
      isBlocked: false,
      riskLevel: 'WARNING',
    },
    {
      id: 'app_bao_2',
      deviceId: 'dev_student_bao',
      appName: 'Discord',
      packageName: 'com.discord',
      category: 'SOCIAL',
      icon: '🎧',
      durationMinutes: 55,
      lastUsed: minAgo(10),
      isRunning: true,
      isBlocked: false,
      riskLevel: 'WARNING',
    },
    {
      id: 'app_bao_3',
      deviceId: 'dev_student_bao',
      appName: 'VietJack Học Tập',
      packageName: 'com.vietjack.app',
      category: 'EDUCATION',
      icon: '📖',
      durationMinutes: 40,
      lastUsed: minAgo(90),
      isRunning: false,
      isBlocked: false,
      riskLevel: 'SAFE',
    },
    // Hoàng Nam
    {
      id: 'app_nam_1',
      deviceId: 'dev_student_nam',
      appName: 'YouTube',
      packageName: 'com.google.android.youtube',
      category: 'ENTERTAINMENT',
      icon: '▶️',
      durationMinutes: 68,
      lastUsed: minAgo(14),
      isRunning: true,
      isBlocked: false,
      riskLevel: 'SAFE',
    },
    {
      id: 'app_nam_2',
      deviceId: 'dev_student_nam',
      appName: 'Free Fire',
      packageName: 'com.dts.freefireth',
      category: 'GAME',
      icon: '🔥',
      durationMinutes: 50,
      lastUsed: minAgo(180),
      isRunning: false,
      isBlocked: true,
      riskLevel: 'RESTRICTED',
    },
  ];

  const webHistory: WebVisitItem[] = [
    // Minh Khôi
    {
      id: 'web_khoi_1',
      deviceId: 'dev_student_khoi',
      url: 'https://www.tiktok.com/@studywithme',
      domain: 'tiktok.com',
      pageTitle: 'TikTok - Video xu hướng & giải trí',
      category: 'SOCIAL',
      durationMinutes: 35,
      visitCount: 12,
      timestamp: minAgo(3),
      isBlocked: false,
      riskLevel: 'WARNING',
    },
    {
      id: 'web_khoi_2',
      deviceId: 'dev_student_khoi',
      url: 'https://vietjack.com/toan-10-kn/index.jsp',
      domain: 'vietjack.com',
      pageTitle: 'Giải bài tập Toán 10 Kết nối tri thức - VietJack',
      category: 'EDUCATION',
      durationMinutes: 40,
      visitCount: 6,
      timestamp: minAgo(28),
      isBlocked: false,
      riskLevel: 'SAFE',
    },
    {
      id: 'web_khoi_3',
      deviceId: 'dev_student_khoi',
      url: 'https://www.roblox.com/games',
      domain: 'roblox.com',
      pageTitle: 'Roblox - Trò chơi trực tuyến',
      category: 'GAME',
      durationMinutes: 12,
      visitCount: 3,
      timestamp: minAgo(150),
      isBlocked: true,
      riskLevel: 'RESTRICTED',
    },
    // Ngọc Ánh
    {
      id: 'web_anh_1',
      deviceId: 'dev_student_anh',
      url: 'https://hocmai.vn/khoa-hoc-toan-10',
      domain: 'hocmai.vn',
      pageTitle: 'Học Mãi - Hệ thống giáo dục trực tuyến Việt Nam',
      category: 'EDUCATION',
      durationMinutes: 48,
      visitCount: 8,
      timestamp: minAgo(5),
      isBlocked: false,
      riskLevel: 'SAFE',
    },
    {
      id: 'web_anh_2',
      deviceId: 'dev_student_anh',
      url: 'https://vi.wikipedia.org/wiki/V%C4%83n_h%E1%BB%8Dc_Vi%E1%BB%87t_Nam',
      domain: 'vi.wikipedia.org',
      pageTitle: 'Văn học Việt Nam – Wikipedia tiếng Việt',
      category: 'EDUCATION',
      durationMinutes: 22,
      visitCount: 4,
      timestamp: minAgo(40),
      isBlocked: false,
      riskLevel: 'SAFE',
    },
    // Quốc Bảo
    {
      id: 'web_bao_1',
      deviceId: 'dev_student_bao',
      url: 'https://lienquan.garena.vn/tin-tuc',
      domain: 'lienquan.garena.vn',
      pageTitle: 'Cổng thông tin Liên Quân Mobile Garena',
      category: 'GAME',
      durationMinutes: 45,
      visitCount: 15,
      timestamp: minAgo(2),
      isBlocked: false,
      riskLevel: 'WARNING',
    },
    {
      id: 'web_bao_2',
      deviceId: 'dev_student_bao',
      url: 'https://www.facebook.com/groups/thptlehongphong',
      domain: 'facebook.com',
      pageTitle: 'Hội học sinh THPT Chuyên Lê Hồng Phong - Facebook',
      category: 'SOCIAL',
      durationMinutes: 30,
      visitCount: 9,
      timestamp: minAgo(35),
      isBlocked: false,
      riskLevel: 'WARNING',
    },
    // Hoàng Nam
    {
      id: 'web_nam_1',
      deviceId: 'dev_student_nam',
      url: 'https://www.youtube.com/watch?v=english-grade-8',
      domain: 'youtube.com',
      pageTitle: 'Bài giảng Tiếng Anh lớp 8 - Global Success',
      category: 'EDUCATION',
      durationMinutes: 52,
      visitCount: 7,
      timestamp: minAgo(14),
      isBlocked: false,
      riskLevel: 'SAFE',
    },
  ];

  const activities: ActivityEvent[] = [
    {
      id: 'act_seed_1',
      deviceId: 'dev_student_bao',
      deviceName: 'Samsung Galaxy S24 - Quốc Bảo',
      platform: 'Android',
      studentName: 'Trần Quốc Bảo',
      schoolName: 'THPT Chuyên Lê Hồng Phong',
      className: '10A2',
      type: 'APP_OPENED',
      description: 'Học sinh Trần Quốc Bảo đang mở ứng dụng Liên Quân Mobile (115 phút hôm nay)',
      timestamp: minAgo(1),
    },
    {
      id: 'act_seed_2',
      deviceId: 'dev_student_khoi',
      deviceName: 'iPhone 15 Pro - Minh Khôi',
      platform: 'iOS',
      studentName: 'Nguyễn Minh Khôi',
      schoolName: 'THPT Chuyên Lê Hồng Phong',
      className: '10A1',
      type: 'WEB_VISITED',
      description: 'Truy cập website tiktok.com/@studywithme trên trình duyệt Safari',
      timestamp: minAgo(2),
    },
    {
      id: 'act_seed_3',
      deviceId: 'dev_student_anh',
      deviceName: 'iPad Air 5 - Ngọc Ánh',
      platform: 'Tablet',
      studentName: 'Nguyễn Ngọc Ánh',
      schoolName: 'THPT Chuyên Lê Hồng Phong',
      className: '10A1',
      type: 'APP_OPENED',
      description: 'Đang học trực tuyến trên ứng dụng Google Classroom & website hocmai.vn',
      timestamp: minAgo(5),
    },
    {
      id: 'act_seed_4',
      deviceId: 'dev_student_khoi',
      deviceName: 'iPhone 15 Pro - Minh Khôi',
      platform: 'iOS',
      studentName: 'Nguyễn Minh Khôi',
      schoolName: 'THPT Chuyên Lê Hồng Phong',
      className: '10A1',
      type: 'POLICY_UPDATED',
      description: 'Phụ huynh đã bật chặn ứng dụng Liên Quân Mobile và tên miền roblox.com',
      timestamp: minAgo(20),
    },
  ];

  return {
    users,
    devices,
    locations,
    statuses,
    sessions: [],
    activities,
    appUsages,
    webHistory,
  };
}

export async function initDatabase(): Promise<{ isPostgres: boolean }> {
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl && dbUrl.startsWith('postgresql://') && !dbUrl.includes('user:password@ep-xyz')) {
    try {
      pgPool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 1500,
      });

      const client = await pgPool.connect();
      console.log('Successfully connected to Neon PostgreSQL database.');
      isPostgresConnected = true;
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

  let needsSeed = !fs.existsSync(DATA_FILE);
  if (!needsSeed) {
    try {
      const current = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8')) as Partial<DBState>;
      if (!current.users || current.users.length === 0 || !current.users.some(u => u.role === 'ADMIN')) {
        needsSeed = true;
      } else {
        // Ensure new arrays exist on existing local DB
        let mutated = false;
        if (!current.appUsages) {
          current.appUsages = createInitialSeedState().appUsages;
          mutated = true;
        }
        if (!current.webHistory) {
          current.webHistory = createInitialSeedState().webHistory;
          mutated = true;
        }
        for (const u of current.users) {
          if (!u.role) {
            u.role = 'PARENT';
            mutated = true;
          }
          if (!u.approvalStatus) {
            u.approvalStatus = 'APPROVED';
            mutated = true;
          }
        }
        if (mutated) {
          fs.writeFileSync(DATA_FILE, JSON.stringify(current, null, 2), 'utf-8');
        }
      }
    } catch {
      needsSeed = true;
    }
  }

  if (needsSeed) {
    const seedState = createInitialSeedState();
    fs.writeFileSync(DATA_FILE, JSON.stringify(seedState, null, 2), 'utf-8');
  }

  return { isPostgres: isPostgresConnected };
}

function readLocalDB(): DBState {
  if (!fs.existsSync(DATA_FILE)) {
    const seeded = createInitialSeedState();
    fs.writeFileSync(DATA_FILE, JSON.stringify(seeded, null, 2), 'utf-8');
    return seeded;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      users: parsed.users || [],
      devices: parsed.devices || [],
      locations: parsed.locations || [],
      statuses: parsed.statuses || [],
      sessions: parsed.sessions || [],
      activities: parsed.activities || [],
      appUsages: parsed.appUsages || [],
      webHistory: parsed.webHistory || [],
    };
  } catch {
    return createInitialSeedState();
  }
}

function writeLocalDB(state: DBState): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
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

  return {
    ...d,
    studentName: d.studentName || owner?.studentName || d.name,
    schoolName: d.schoolName || owner?.schoolName || 'Chưa cập nhật trường',
    className: d.className || owner?.className || '',
    ownerName: owner?.name || 'Chưa rõ',
    ownerEmail: owner?.email || '',
    ownerRole: owner?.role || 'PARENT',
    currentApp: d.currentApp || runningApp?.appName || 'Màn hình chính',
    currentWebsite: d.currentWebsite || latestWeb?.domain || 'Chưa mở trình duyệt',
    screenTimeMinutes: totalScreenTime > 0 ? totalScreenTime : (d.screenTimeMinutes ?? 0),
    blockedApps: d.blockedApps || devApps.filter(a => a.isBlocked).map(a => a.appName),
    blockedWebsites: d.blockedWebsites || state.webHistory.filter(w => w.deviceId === d.id && w.isBlocked).map(w => w.domain),
    status: latestStatus?.status || d.status || 'OFFLINE',
    batteryLevel: latestStatus?.batteryLevel ?? d.batteryLevel ?? 100,
    charging: latestStatus?.charging ?? d.charging ?? false,
    networkType: latestStatus?.networkType || d.networkType || 'WIFI',
    locationPermission: latestStatus?.locationPermission ?? true,
    locationSharing: latestStatus?.locationSharing ?? true,
    latitude: latestLoc?.latitude ?? d.latitude,
    longitude: latestLoc?.longitude ?? d.longitude,
    accuracy: latestLoc?.accuracy ?? d.accuracy,
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
    return Boolean(teacherSchool && deviceSchool && teacherSchool === deviceSchool);
  }
  // PARENT: only their own child's devices
  return device.userId === user.id;
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

  // DEVICES (with Role-Based Access: Admin sees all, Teacher sees same school, Parent sees own children)
  async getAccessibleDevices(userId: string): Promise<DeviceRecord[]> {
    const state = readLocalDB();
    const user = state.users.find(u => u.id === userId);
    if (!user) return [];

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
  async getActivitiesForUser(userId: string, limit = 80): Promise<ActivityEvent[]> {
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
