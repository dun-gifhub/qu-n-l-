export type PlatformType = 'iOS' | 'Android' | 'Tablet';
export type DeviceStatusType = 'ONLINE' | 'IDLE' | 'OFFLINE';
export type NetworkType = 'WIFI' | '4G' | '5G' | 'ETHERNET' | 'UNKNOWN';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceRecord {
  id: string;
  userId: string;
  name: string;
  deviceUuid: string;
  platform: PlatformType;
  osVersion?: string;
  appVersion?: string;
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
  status?: DeviceStatusType;
  batteryLevel?: number;
  charging?: boolean;
  networkType?: NetworkType;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  locationPermission?: boolean;
  locationSharing?: boolean;
}

export interface DeviceLocationRecord {
  id: string;
  deviceId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  createdAt: string;
}

export interface DeviceStatusRecord {
  id: string;
  deviceId: string;
  batteryLevel: number;
  charging: boolean;
  networkType: NetworkType;
  locationPermission: boolean;
  locationSharing: boolean;
  status: DeviceStatusType;
  timestamp: string;
}

export interface SessionRecord {
  id: string;
  userId: string;
  token: string;
  userAgent?: string;
  ipAddress?: string;
  expiresAt: string;
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  deviceId: string;
  deviceName: string;
  platform: PlatformType;
  type: 'ONLINE' | 'OFFLINE' | 'IDLE' | 'LOCATION_UPDATE' | 'BATTERY_LOW' | 'CHARGING_STARTED' | 'CHARGING_STOPPED';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AuthUserPayload {
  userId: string;
  email: string;
  name: string;
}
