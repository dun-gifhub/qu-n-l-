export type PlatformType = 'iOS' | 'Android' | 'Tablet';
export type DeviceStatusType = 'ONLINE' | 'IDLE' | 'OFFLINE';
export type NetworkType = 'WIFI' | '4G' | '5G' | 'ETHERNET' | 'UNKNOWN' | 'NONE';
export type UserRole = 'ADMIN' | 'TEACHER' | 'PARENT';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type UsageCategory = 'EDUCATION' | 'SOCIAL' | 'GAME' | 'ENTERTAINMENT' | 'UTILITY' | 'OTHER';
export type RiskLevel = 'SAFE' | 'WARNING' | 'RESTRICTED';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  approvalStatus: ApprovalStatus;
  schoolName?: string;
  grade?: string;
  className?: string;
  studentName?: string;
  childStudentId?: string;
  phone?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppUsageItem {
  id: string;
  deviceId: string;
  appName: string;
  packageName: string;
  category: UsageCategory;
  icon: string;
  durationMinutes: number;
  lastUsed: string;
  isRunning: boolean;
  isBlocked: boolean;
  riskLevel: RiskLevel;
}

export interface WebVisitItem {
  id: string;
  deviceId: string;
  url: string;
  domain: string;
  pageTitle: string;
  category: UsageCategory;
  durationMinutes: number;
  visitCount: number;
  timestamp: string;
  isBlocked: boolean;
  riskLevel: RiskLevel;
}

export interface DeviceRecord {
  id: string;
  userId: string;
  name: string;
  deviceUuid: string;
  platform: PlatformType;
  osVersion?: string;
  appVersion?: string;
  studentName?: string;
  studentId?: string;
  schoolName?: string;
  grade?: string;
  className?: string;
  parentPhone?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerRole?: UserRole;
  currentApp?: string;
  currentWebsite?: string;
  screenTimeMinutes?: number;
  blockedApps?: string[];
  blockedWebsites?: string[];
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
  isUninstalled?: boolean;
  uninstalledAt?: string;
  inClassAlert?: boolean;
  isNoNetwork?: boolean;
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
  studentName?: string;
  schoolName?: string;
  grade?: string;
  className?: string;
  type:
    | 'ONLINE'
    | 'OFFLINE'
    | 'IDLE'
    | 'LOCATION_UPDATE'
    | 'BATTERY_LOW'
    | 'CHARGING_STARTED'
    | 'CHARGING_STOPPED'
    | 'APP_OPENED'
    | 'WEB_VISITED'
    | 'POLICY_UPDATED'
    | 'UNINSTALLED'
    | 'NO_NETWORK'
    | 'IN_CLASS_ALERT';
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AuthUserPayload {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  schoolName?: string;
  grade?: string;
  className?: string;
  approvalStatus: ApprovalStatus;
}
