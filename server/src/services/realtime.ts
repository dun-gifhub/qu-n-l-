import { Response } from 'express';
import { DeviceRecord } from '../types/index.ts';

export interface RealtimeNotification {
  id: string;
  type: 'WIFI_CONNECTED' | 'NO_NETWORK' | 'IN_CLASS_USAGE' | 'APP_UNINSTALLED' | 'LOCATION_UPDATE' | 'DEVICE_ACTIVE';
  title: string;
  message: string;
  deviceId: string;
  deviceName: string;
  studentName: string;
  schoolName?: string;
  className?: string;
  latitude?: number;
  longitude?: number;
  timestamp: string;
  severity: 'info' | 'warning' | 'emergency';
}

const clients = new Set<Response>();

export function registerClient(res: Response): void {
  clients.add(res);

  // Send initial connection confirmation
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', message: 'SSE Stream Connected' })}\n\n`);

  res.on('close', () => {
    clients.delete(res);
  });
}

export function broadcastNotification(notification: RealtimeNotification): void {
  const payload = `data: ${JSON.stringify(notification)}\n\n`;
  for (const client of clients) {
    try {
      client.write(payload);
    } catch {
      clients.delete(client);
    }
  }
}

export function notifyDeviceEvent(
  device: DeviceRecord,
  eventType: 'WIFI_CONNECTED' | 'NO_NETWORK' | 'IN_CLASS_USAGE' | 'APP_UNINSTALLED' | 'DEVICE_ACTIVE',
  customMessage?: string
): void {
  const nowIso = new Date().toISOString();
  let severity: 'info' | 'warning' | 'emergency' = 'info';
  let title = 'Thông báo thiết bị';
  let message = customMessage || '';

  switch (eventType) {
    case 'APP_UNINSTALLED':
      severity = 'emergency';
      title = '🚨 CẢNH BÁO GỠ CÀI ĐẶT ỨNG DỤNG!';
      message = `Học sinh ${device.studentName} (${device.className || 'Chưa rõ lớp'} - ${device.schoolName || 'Trường'}) vừa gửi tín hiệu gỡ cài đặt hoặc tắt ứng dụng theo dõi!`;
      break;
    case 'NO_NETWORK':
      severity = 'warning';
      title = '🔴 Mất kết nối mạng';
      message = `Điện thoại "${device.name}" của học sinh ${device.studentName} đã mất kết nối Wi-Fi/Internet.`;
      break;
    case 'IN_CLASS_USAGE':
      severity = 'warning';
      title = '⚠️ Sử dụng điện thoại trong giờ học';
      message = `Phát hiện học sinh ${device.studentName} (${device.className || ''}) đang mở ứng dụng "${device.currentApp || 'Màn hình'}" trong khung giờ học.`;
      break;
    case 'WIFI_CONNECTED':
      severity = 'info';
      title = '🟢 Đã kết nối mạng Wi-Fi';
      message = `Thiết bị của học sinh ${device.studentName} đã kết nối lại mạng Wi-Fi trường/nhà.`;
      break;
    case 'DEVICE_ACTIVE':
      severity = 'info';
      title = '📱 Thiết bị đang hoạt động';
      message = `Học sinh ${device.studentName} đang hoạt động trên thiết bị (${device.currentApp || 'Sử dụng máy'}).`;
      break;
  }

  broadcastNotification({
    id: 'notif_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    type: eventType,
    title,
    message,
    deviceId: device.id,
    deviceName: device.name,
    studentName: device.studentName || device.name,
    schoolName: device.schoolName,
    className: device.className,
    latitude: device.latitude,
    longitude: device.longitude,
    timestamp: nowIso,
    severity,
  });
}
