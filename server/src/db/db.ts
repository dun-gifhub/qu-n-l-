import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import {
  UserRecord,
  DeviceRecord,
  DeviceLocationRecord,
  DeviceStatusRecord,
  SessionRecord,
  ActivityEvent,
} from '../types/index.ts';

interface DBState {
  users: UserRecord[];
  devices: DeviceRecord[];
  locations: DeviceLocationRecord[];
  statuses: DeviceStatusRecord[];
  sessions: SessionRecord[];
  activities: ActivityEvent[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'database.json');

// Global pg pool if DATABASE_URL is available
let pgPool: Pool | null = null;
let isPostgresConnected = false;

// Initialize database
export async function initDatabase(): Promise<{ isPostgres: boolean }> {
  const dbUrl = process.env.DATABASE_URL;

  if (dbUrl && dbUrl.startsWith('postgresql://') && !dbUrl.includes('user:password@ep-xyz')) {
    try {
      pgPool = new Pool({
        connectionString: dbUrl,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
      });

      // Test connection
      const client = await pgPool.connect();
      console.log(' Successfully connected to Neon PostgreSQL database.');
      isPostgresConnected = true;

      // Ensure tables exist in Neon
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          "passwordHash" TEXT NOT NULL,
          "createdAt" TIMESTAMPTZ DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS devices (
          id VARCHAR(64) PRIMARY KEY,
          "userId" VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
          name VARCHAR(255) NOT NULL,
          "deviceUuid" VARCHAR(255) UNIQUE NOT NULL,
          platform VARCHAR(64) NOT NULL,
          "osVersion" VARCHAR(64),
          "appVersion" VARCHAR(64),
          "lastSeen" TIMESTAMPTZ DEFAULT NOW(),
          "createdAt" TIMESTAMPTZ DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS device_locations (
          id VARCHAR(64) PRIMARY KEY,
          "deviceId" VARCHAR(64) REFERENCES devices(id) ON DELETE CASCADE,
          latitude DOUBLE PRECISION NOT NULL,
          longitude DOUBLE PRECISION NOT NULL,
          accuracy DOUBLE PRECISION,
          timestamp TIMESTAMPTZ DEFAULT NOW(),
          "createdAt" TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS device_statuses (
          id VARCHAR(64) PRIMARY KEY,
          "deviceId" VARCHAR(64) REFERENCES devices(id) ON DELETE CASCADE,
          "batteryLevel" INT DEFAULT 100,
          charging BOOLEAN DEFAULT FALSE,
          "networkType" VARCHAR(64) DEFAULT 'WIFI',
          "locationPermission" BOOLEAN DEFAULT TRUE,
          "locationSharing" BOOLEAN DEFAULT TRUE,
          status VARCHAR(32) DEFAULT 'ONLINE',
          timestamp TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS sessions (
          id VARCHAR(64) PRIMARY KEY,
          "userId" VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
          token TEXT UNIQUE NOT NULL,
          "userAgent" TEXT,
          "ipAddress" TEXT,
          "expiresAt" TIMESTAMPTZ NOT NULL,
          "createdAt" TIMESTAMPTZ DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS activities (
          id VARCHAR(64) PRIMARY KEY,
          "deviceId" VARCHAR(64) REFERENCES devices(id) ON DELETE CASCADE,
          "deviceName" VARCHAR(255) NOT NULL,
          platform VARCHAR(64) NOT NULL,
          type VARCHAR(64) NOT NULL,
          description TEXT NOT NULL,
          timestamp TIMESTAMPTZ DEFAULT NOW(),
          metadata JSONB
        );
      `);

      client.release();
      return { isPostgres: true };
    } catch (err) {
      console.warn('⚠️ Could not connect to Neon PostgreSQL, falling back to local persistent store:', (err as Error).message);
      pgPool = null;
      isPostgresConnected = false;
    }
  }

  // Fallback persistent file-based store
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DATA_FILE)) {
    const emptyState: DBState = {
      users: [],
      devices: [],
      locations: [],
      statuses: [],
      sessions: [],
      activities: [],
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(emptyState, null, 2), 'utf-8');
  }

  return { isPostgres: false };
}

function readLocalDB(): DBState {
  if (!fs.existsSync(DATA_FILE)) {
    return { users: [], devices: [], locations: [], statuses: [], sessions: [], activities: [] };
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { users: [], devices: [], locations: [], statuses: [], sessions: [], activities: [] };
  }
}

function writeLocalDB(state: DBState): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

// Database Service Implementation
export const dbService = {
  isPostgres(): boolean {
    return isPostgresConnected && pgPool !== null;
  },

  // USERS
  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const normEmail = email.toLowerCase().trim();
    if (this.isPostgres()) {
      const res = await pgPool!.query('SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1', [normEmail]);
      return res.rows[0] || null;
    }
    const state = readLocalDB();
    return state.users.find(u => u.email.toLowerCase() === normEmail) || null;
  },

  async findUserById(id: string): Promise<UserRecord | null> {
    if (this.isPostgres()) {
      const res = await pgPool!.query('SELECT * FROM users WHERE id = $1 LIMIT 1', [id]);
      return res.rows[0] || null;
    }
    const state = readLocalDB();
    return state.users.find(u => u.id === id) || null;
  },

  async createUser(user: UserRecord): Promise<UserRecord> {
    if (this.isPostgres()) {
      await pgPool!.query(
        'INSERT INTO users (id, name, email, "passwordHash", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6)',
        [user.id, user.name, user.email.toLowerCase().trim(), user.passwordHash, user.createdAt, user.updatedAt]
      );
      return user;
    }
    const state = readLocalDB();
    state.users.push(user);
    writeLocalDB(state);
    return user;
  },

  async updateUser(id: string, updates: Partial<UserRecord>): Promise<UserRecord | null> {
    if (this.isPostgres()) {
      const sets: string[] = [];
      const values: any[] = [];
      let i = 1;
      if (updates.name) {
        sets.push(`name = $${i++}`);
        values.push(updates.name);
      }
      if (updates.passwordHash) {
        sets.push(`"passwordHash" = $${i++}`);
        values.push(updates.passwordHash);
      }
      sets.push(`"updatedAt" = $${i++}`);
      values.push(new Date().toISOString());
      values.push(id);
      const query = `UPDATE users SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`;
      const res = await pgPool!.query(query, values);
      return res.rows[0] || null;
    }
    const state = readLocalDB();
    const idx = state.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    state.users[idx] = { ...state.users[idx], ...updates, updatedAt: new Date().toISOString() };
    writeLocalDB(state);
    return state.users[idx];
  },

  // DEVICES
  async getDevicesByUser(userId: string): Promise<DeviceRecord[]> {
    if (this.isPostgres()) {
      const devRes = await pgPool!.query(
        'SELECT * FROM devices WHERE "userId" = $1 ORDER BY "updatedAt" DESC',
        [userId]
      );
      const devices: DeviceRecord[] = devRes.rows;

      for (const d of devices) {
        const statRes = await pgPool!.query(
          'SELECT * FROM device_statuses WHERE "deviceId" = $1 ORDER BY timestamp DESC LIMIT 1',
          [d.id]
        );
        const locRes = await pgPool!.query(
          'SELECT * FROM device_locations WHERE "deviceId" = $1 ORDER BY timestamp DESC LIMIT 1',
          [d.id]
        );
        if (statRes.rows[0]) {
          const s = statRes.rows[0];
          d.status = s.status;
          d.batteryLevel = s.batteryLevel;
          d.charging = s.charging;
          d.networkType = s.networkType;
          d.locationPermission = s.locationPermission;
          d.locationSharing = s.locationSharing;
        }
        if (locRes.rows[0]) {
          const l = locRes.rows[0];
          d.latitude = l.latitude;
          d.longitude = l.longitude;
          d.accuracy = l.accuracy;
        }
      }
      return devices;
    }

    const state = readLocalDB();
    const userDevices = state.devices.filter(d => d.userId === userId);
    return userDevices.map(d => {
      const latestStatus = state.statuses
        .filter(s => s.deviceId === d.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      const latestLoc = state.locations
        .filter(l => l.deviceId === d.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

      return {
        ...d,
        status: latestStatus?.status || 'OFFLINE',
        batteryLevel: latestStatus?.batteryLevel ?? 100,
        charging: latestStatus?.charging ?? false,
        networkType: latestStatus?.networkType || 'WIFI',
        locationPermission: latestStatus?.locationPermission ?? true,
        locationSharing: latestStatus?.locationSharing ?? true,
        latitude: latestLoc?.latitude,
        longitude: latestLoc?.longitude,
        accuracy: latestLoc?.accuracy,
      };
    });
  },

  async getDeviceById(deviceId: string, userId?: string): Promise<DeviceRecord | null> {
    if (this.isPostgres()) {
      const query = userId
        ? 'SELECT * FROM devices WHERE id = $1 AND "userId" = $2 LIMIT 1'
        : 'SELECT * FROM devices WHERE id = $1 LIMIT 1';
      const params = userId ? [deviceId, userId] : [deviceId];
      const res = await pgPool!.query(query, params);
      const d = res.rows[0];
      if (!d) return null;

      const statRes = await pgPool!.query(
        'SELECT * FROM device_statuses WHERE "deviceId" = $1 ORDER BY timestamp DESC LIMIT 1',
        [d.id]
      );
      const locRes = await pgPool!.query(
        'SELECT * FROM device_locations WHERE "deviceId" = $1 ORDER BY timestamp DESC LIMIT 1',
        [d.id]
      );

      if (statRes.rows[0]) {
        const s = statRes.rows[0];
        d.status = s.status;
        d.batteryLevel = s.batteryLevel;
        d.charging = s.charging;
        d.networkType = s.networkType;
        d.locationPermission = s.locationPermission;
        d.locationSharing = s.locationSharing;
      }
      if (locRes.rows[0]) {
        const l = locRes.rows[0];
        d.latitude = l.latitude;
        d.longitude = l.longitude;
        d.accuracy = l.accuracy;
      }
      return d;
    }

    const state = readLocalDB();
    const d = state.devices.find(x => x.id === deviceId && (!userId || x.userId === userId));
    if (!d) return null;

    const latestStatus = state.statuses
      .filter(s => s.deviceId === d.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    const latestLoc = state.locations
      .filter(l => l.deviceId === d.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    return {
      ...d,
      status: latestStatus?.status || 'OFFLINE',
      batteryLevel: latestStatus?.batteryLevel ?? 100,
      charging: latestStatus?.charging ?? false,
      networkType: latestStatus?.networkType || 'WIFI',
      locationPermission: latestStatus?.locationPermission ?? true,
      locationSharing: latestStatus?.locationSharing ?? true,
      latitude: latestLoc?.latitude,
      longitude: latestLoc?.longitude,
      accuracy: latestLoc?.accuracy,
    };
  },

  async findDeviceByUuid(uuid: string): Promise<DeviceRecord | null> {
    if (this.isPostgres()) {
      const res = await pgPool!.query('SELECT * FROM devices WHERE "deviceUuid" = $1 LIMIT 1', [uuid]);
      return res.rows[0] || null;
    }
    const state = readLocalDB();
    return state.devices.find(d => d.deviceUuid.toLowerCase() === uuid.toLowerCase()) || null;
  },

  async createDevice(device: DeviceRecord, initialStatus?: Partial<DeviceStatusRecord>): Promise<DeviceRecord> {
    if (this.isPostgres()) {
      await pgPool!.query(
        'INSERT INTO devices (id, "userId", name, "deviceUuid", platform, "osVersion", "appVersion", "lastSeen", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
        [device.id, device.userId, device.name, device.deviceUuid, device.platform, device.osVersion, device.appVersion, device.lastSeen, device.createdAt, device.updatedAt]
      );
      // Insert initial status
      const statusId = 'stat_' + Date.now();
      await pgPool!.query(
        'INSERT INTO device_statuses (id, "deviceId", "batteryLevel", charging, "networkType", "locationPermission", "locationSharing", status, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [
          statusId,
          device.id,
          initialStatus?.batteryLevel ?? 100,
          initialStatus?.charging ?? false,
          initialStatus?.networkType ?? 'WIFI',
          initialStatus?.locationPermission ?? true,
          initialStatus?.locationSharing ?? true,
          initialStatus?.status ?? 'ONLINE',
          new Date().toISOString(),
        ]
      );
      return (await this.getDeviceById(device.id))!;
    }

    const state = readLocalDB();
    state.devices.push(device);
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

    state.activities.unshift({
      id: 'act_' + Date.now(),
      deviceId: device.id,
      deviceName: device.name,
      platform: device.platform,
      type: 'ONLINE',
      description: `Thiết bị ${device.name} đã được thêm vào hệ thống`,
      timestamp: new Date().toISOString(),
    });

    writeLocalDB(state);
    return {
      ...device,
      status: newStatus.status,
      batteryLevel: newStatus.batteryLevel,
      charging: newStatus.charging,
      networkType: newStatus.networkType,
      locationPermission: newStatus.locationPermission,
      locationSharing: newStatus.locationSharing,
    };
  },

  async updateDevice(id: string, userId: string, updates: Partial<DeviceRecord>): Promise<DeviceRecord | null> {
    const existing = await this.getDeviceById(id, userId);
    if (!existing) return null;

    if (this.isPostgres()) {
      const sets: string[] = [];
      const values: any[] = [];
      let i = 1;
      if (updates.name) {
        sets.push(`name = $${i++}`);
        values.push(updates.name);
      }
      if (updates.platform) {
        sets.push(`platform = $${i++}`);
        values.push(updates.platform);
      }
      if (updates.osVersion !== undefined) {
        sets.push(`"osVersion" = $${i++}`);
        values.push(updates.osVersion);
      }
      if (updates.appVersion !== undefined) {
        sets.push(`"appVersion" = $${i++}`);
        values.push(updates.appVersion);
      }
      sets.push(`"updatedAt" = $${i++}`);
      values.push(new Date().toISOString());
      values.push(id);
      values.push(userId);

      const query = `UPDATE devices SET ${sets.join(', ')} WHERE id = $${i++} AND "userId" = $${i} RETURNING *`;
      await pgPool!.query(query, values);
      return this.getDeviceById(id, userId);
    }

    const state = readLocalDB();
    const idx = state.devices.findIndex(d => d.id === id && d.userId === userId);
    if (idx === -1) return null;

    state.devices[idx] = {
      ...state.devices[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    writeLocalDB(state);
    return this.getDeviceById(id, userId);
  },

  async deleteDevice(id: string, userId: string): Promise<boolean> {
    const existing = await this.getDeviceById(id, userId);
    if (!existing) return false;

    if (this.isPostgres()) {
      await pgPool!.query('DELETE FROM devices WHERE id = $1 AND "userId" = $2', [id, userId]);
      return true;
    }

    const state = readLocalDB();
    state.devices = state.devices.filter(d => !(d.id === id && d.userId === userId));
    state.locations = state.locations.filter(l => l.deviceId !== id);
    state.statuses = state.statuses.filter(s => s.deviceId !== id);
    state.activities = state.activities.filter(a => a.deviceId !== id);
    writeLocalDB(state);
    return true;
  },

  // LOCATIONS
  async recordLocation(loc: DeviceLocationRecord): Promise<DeviceLocationRecord> {
    if (this.isPostgres()) {
      await pgPool!.query(
        'INSERT INTO device_locations (id, "deviceId", latitude, longitude, accuracy, timestamp, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [loc.id, loc.deviceId, loc.latitude, loc.longitude, loc.accuracy, loc.timestamp, loc.createdAt]
      );
      await pgPool!.query('UPDATE devices SET "lastSeen" = $1, "updatedAt" = $1 WHERE id = $2', [loc.timestamp, loc.deviceId]);
      return loc;
    }

    const state = readLocalDB();
    state.locations.unshift(loc);
    // keep max 500 locations per device to prevent unbounded file growth
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
        type: 'LOCATION_UPDATE',
        description: `Cập nhật tọa độ GPS (${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)})`,
        timestamp: loc.timestamp,
      });
    }

    writeLocalDB(state);
    return loc;
  },

  async getLatestLocation(deviceId: string): Promise<DeviceLocationRecord | null> {
    if (this.isPostgres()) {
      const res = await pgPool!.query(
        'SELECT * FROM device_locations WHERE "deviceId" = $1 ORDER BY timestamp DESC LIMIT 1',
        [deviceId]
      );
      return res.rows[0] || null;
    }
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

    if (this.isPostgres()) {
      const res = await pgPool!.query(
        'SELECT * FROM device_locations WHERE "deviceId" = $1 AND timestamp >= $2 ORDER BY timestamp DESC LIMIT 300',
        [deviceId, cutoff.toISOString()]
      );
      return res.rows;
    }

    const state = readLocalDB();
    return state.locations
      .filter(l => l.deviceId === deviceId && new Date(l.timestamp) >= cutoff)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 300);
  },

  // STATUS & HEARTBEAT
  async recordStatus(status: DeviceStatusRecord): Promise<DeviceStatusRecord> {
    if (this.isPostgres()) {
      await pgPool!.query(
        'INSERT INTO device_statuses (id, "deviceId", "batteryLevel", charging, "networkType", "locationPermission", "locationSharing", status, timestamp) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
        [status.id, status.deviceId, status.batteryLevel, status.charging, status.networkType, status.locationPermission, status.locationSharing, status.status, status.timestamp]
      );
      await pgPool!.query('UPDATE devices SET "lastSeen" = $1, "updatedAt" = $1 WHERE id = $2', [status.timestamp, status.deviceId]);
      return status;
    }

    const state = readLocalDB();
    const oldStatus = state.statuses
      .filter(s => s.deviceId === status.deviceId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];

    state.statuses.unshift(status);

    const d = state.devices.find(x => x.id === status.deviceId);
    if (d) {
      d.lastSeen = status.timestamp;
      d.updatedAt = status.timestamp;

      // Activity events for key changes
      if (!oldStatus || oldStatus.status !== status.status) {
        state.activities.unshift({
          id: 'act_' + Date.now(),
          deviceId: d.id,
          deviceName: d.name,
          platform: d.platform,
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
    if (this.isPostgres()) {
      const res = await pgPool!.query(
        'SELECT * FROM device_statuses WHERE "deviceId" = $1 ORDER BY timestamp DESC LIMIT 1',
        [deviceId]
      );
      return res.rows[0] || null;
    }
    const state = readLocalDB();
    return state.statuses
      .filter(s => s.deviceId === deviceId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] || null;
  },

  // SESSIONS
  async createSession(session: SessionRecord): Promise<SessionRecord> {
    if (this.isPostgres()) {
      await pgPool!.query(
        'INSERT INTO sessions (id, "userId", token, "userAgent", "ipAddress", "expiresAt", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [session.id, session.userId, session.token, session.userAgent, session.ipAddress, session.expiresAt, session.createdAt]
      );
      return session;
    }
    const state = readLocalDB();
    state.sessions.push(session);
    writeLocalDB(state);
    return session;
  },

  async deleteSession(token: string): Promise<void> {
    if (this.isPostgres()) {
      await pgPool!.query('DELETE FROM sessions WHERE token = $1', [token]);
      return;
    }
    const state = readLocalDB();
    state.sessions = state.sessions.filter(s => s.token !== token);
    writeLocalDB(state);
  },

  // ACTIVITIES
  async getActivitiesForUser(userId: string, limit = 50): Promise<ActivityEvent[]> {
    const devices = await this.getDevicesByUser(userId);
    const deviceIds = new Set(devices.map(d => d.id));

    if (this.isPostgres()) {
      if (deviceIds.size === 0) return [];
      const idArray = Array.from(deviceIds);
      const placeholders = idArray.map((_, i) => `$${i + 1}`).join(',');
      const res = await pgPool!.query(
        `SELECT * FROM activities WHERE "deviceId" IN (${placeholders}) ORDER BY timestamp DESC LIMIT ${limit}`,
        idArray
      );
      return res.rows;
    }

    const state = readLocalDB();
    return state.activities
      .filter(a => deviceIds.has(a.deviceId))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  },

  async getActivitiesForDevice(deviceId: string, limit = 50): Promise<ActivityEvent[]> {
    if (this.isPostgres()) {
      const res = await pgPool!.query(
        'SELECT * FROM activities WHERE "deviceId" = $1 ORDER BY timestamp DESC LIMIT $2',
        [deviceId, limit]
      );
      return res.rows;
    }
    const state = readLocalDB();
    return state.activities
      .filter(a => a.deviceId === deviceId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  },
};
