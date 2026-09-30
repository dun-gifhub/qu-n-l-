import { ApiResponse, Device, DeviceLocation, DeviceStatus, ActivityEvent, User } from '../types/index.ts';

const API_BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await res.json();
    return data;
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Lỗi kết nối máy chủ. Vui lòng thử lại sau.',
    };
  }
}

export const api = {
  // Health
  checkHealth: () => request<{ message: string; timestamp: string; database: { type: string; status: string } }>('/health'),

  // Auth
  register: (body: { name: string; email: string; password: string; confirmPassword: string }) =>
    request<User>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),

  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  logout: () => request<null>('/auth/logout', { method: 'POST' }),

  getMe: () => request<User>('/auth/me'),

  updateProfile: (body: { name?: string; currentPassword?: string; newPassword?: string }) =>
    request<User>('/auth/me', { method: 'PATCH', body: JSON.stringify(body) }),

  // Devices
  getDevices: () => request<Device[]>('/devices'),

  getDeviceById: (id: string) => request<Device>(`/devices/${id}`),

  createDevice: (body: { name: string; platform: string; osVersion?: string; appVersion?: string; deviceUuid?: string }) =>
    request<Device>('/devices', { method: 'POST', body: JSON.stringify(body) }),

  updateDevice: (id: string, body: { name?: string; platform?: string; osVersion?: string; appVersion?: string }) =>
    request<Device>(`/devices/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),

  deleteDevice: (id: string) => request<null>(`/devices/${id}`, { method: 'DELETE' }),

  // Telemetry (Mobile App endpoints)
  sendLocation: (id: string, body: { latitude: number; longitude: number; accuracy?: number; timestamp?: string }) =>
    request<DeviceLocation>(`/devices/${id}/location`, { method: 'POST', body: JSON.stringify(body) }),

  getLatestLocation: (id: string) => request<DeviceLocation>(`/devices/${id}/location`),

  getLocationHistory: (id: string, range: string = 'today') =>
    request<DeviceLocation[]>(`/devices/${id}/location-history?range=${range}`),

  sendHeartbeat: (id: string, body: {
    batteryLevel?: number;
    charging?: boolean;
    networkType?: string;
    status?: string;
    locationPermission?: boolean;
    locationSharing?: boolean;
  }) => request<DeviceStatus>(`/devices/${id}/heartbeat`, { method: 'POST', body: JSON.stringify(body) }),

  getDeviceStatus: (id: string) => request<DeviceStatus>(`/devices/${id}/status`),

  getDeviceActivity: (id: string) => request<ActivityEvent[]>(`/devices/${id}/activity`),

  // Activity
  getAllActivity: () => request<ActivityEvent[]>('/activity'),
};
