export type PlatformType = 'iOS' | 'Android' | 'Tablet';
export type DeviceStatusType = 'ONLINE' | 'IDLE' | 'OFFLINE';
export type NetworkType = 'WIFI' | '4G' | '5G' | 'ETHERNET' | 'UNKNOWN';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

export interface Device {
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

export interface DeviceLocation {
  id: string;
  deviceId: string;
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  createdAt: string;
}

export interface DeviceStatus {
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

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string>;
}
