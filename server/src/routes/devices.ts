import { Router, Response } from 'express';
import { dbService } from '../db/db.ts';
import { requireAuth, requireApproved, optionalAuth, AuthenticatedRequest } from '../middleware/auth.ts';
import { notifyDeviceEvent } from '../services/realtime.ts';
import {
  DeviceRecord,
  DeviceLocationRecord,
  DeviceStatusRecord,
  PlatformType,
  DeviceStatusType,
  NetworkType,
  UsageCategory,
} from '../types/index.ts';

const router = Router();
router.use(optionalAuth);

// Telemetry and report routes: allow without requiring admin token; ALL OTHER ROUTES REQUIRE LOGIN
router.use(async (req: any, res: Response, next: any) => {
  // 1. Always allow direct phone report and uninstall beacon from student phones
  if (
    req.method === 'POST' &&
    (req.path === '/report' ||
      req.path.endsWith('/report') ||
      req.path === '/uninstall' ||
      req.path.endsWith('/uninstall'))
  ) {
    return next();
  }

  // 2. Mobile telemetry routes allow X-Device-Uuid / deviceUuid
  const isTelemetryPost =
    req.method === 'POST' &&
    (req.path.endsWith('/location') || req.path.endsWith('/heartbeat') || req.path.endsWith('/usage'));

  if (isTelemetryPost) {
    const deviceUuid = req.headers['x-device-uuid'] || req.body?.deviceUuid || req.query?.deviceUuid;
    const segments = req.path.split('/').filter(Boolean);
    const deviceId = segments[0];
    if (deviceUuid && deviceId) {
      const dev = await dbService.getDeviceById(deviceId);
      if (dev && dev.deviceUuid.toLowerCase() === String(deviceUuid).toLowerCase().trim()) {
        req.deviceByUuid = dev;
        return next();
      }
    }
  }

  // 3. All viewing, map, status, history and management routes: BẮT BUỘC ĐĂNG NHẬP
  return requireAuth(req, res, () => {
    return requireApproved(req, res, next);
  });
});

// Helper to check device access
async function getDeviceWithAccessCheck(
  deviceId: string,
  _userId: string | undefined,
  res: Response,
  _req?: any
): Promise<DeviceRecord | null> {
  const rawExists = await dbService.getDeviceById(deviceId);
  if (!rawExists) {
    res.status(404).json({
      success: false,
      message: 'Không tìm thấy thiết bị này',
    });
    return null;
  }
  return rawExists;
}

// POST /api/devices/report - Direct Phone Telemetry Report (link để điện thoại báo vào)
router.post('/report', async (req: any, res: Response): Promise<any> => {
  try {
    const {
      deviceUuid,
      deviceId,
      name,
      studentName,
      studentId,
      schoolName,
      grade,
      className,
      parentPhone,
      platform,
      latitude,
      longitude,
      accuracy,
      batteryLevel,
      charging,
      networkType,
      currentApp,
      currentWebsite,
      isUninstalled,
      isNoNetwork,
    } = req.body;

    const lat = latitude !== undefined && latitude !== null ? Number(latitude) : undefined;
    const lng = longitude !== undefined && longitude !== null ? Number(longitude) : undefined;
    const acc = accuracy !== undefined && accuracy !== null ? Number(accuracy) : undefined;
    const bat =
      batteryLevel !== undefined && batteryLevel !== null
        ? Math.min(100, Math.max(0, parseInt(batteryLevel, 10)))
        : 100;

    const device = await dbService.recordDirectReport({
      deviceUuid,
      deviceId,
      name,
      studentName,
      studentId,
      schoolName,
      grade,
      className,
      parentPhone,
      platform: ['iOS', 'Android', 'Tablet'].includes(platform) ? platform : 'Android',
      latitude: lat !== undefined && !isNaN(lat) ? lat : undefined,
      longitude: lng !== undefined && !isNaN(lng) ? lng : undefined,
      accuracy: acc !== undefined && !isNaN(acc) ? acc : undefined,
      batteryLevel: isNaN(bat) ? 100 : bat,
      charging: Boolean(charging),
      networkType: networkType || (isNoNetwork ? 'NONE' : 'WIFI'),
      currentApp,
      currentWebsite,
      isUninstalled: Boolean(isUninstalled),
      isNoNetwork: Boolean(isNoNetwork),
    });

    // Realtime notification broadcast
    if (isUninstalled) {
      notifyDeviceEvent(device, 'APP_UNINSTALLED');
    } else if (isNoNetwork || networkType === 'NONE') {
      notifyDeviceEvent(device, 'NO_NETWORK');
    } else if (device.inClassAlert) {
      notifyDeviceEvent(device, 'IN_CLASS_USAGE');
    } else if (networkType === 'WIFI') {
      notifyDeviceEvent(device, 'WIFI_CONNECTED');
    } else {
      notifyDeviceEvent(device, 'DEVICE_ACTIVE');
    }

    return res.status(200).json({
      success: true,
      message: isUninstalled
        ? 'Đã ghi nhận tín hiệu gỡ ứng dụng'
        : 'Báo cáo vị trí và tình trạng máy thành công',
      data: device,
    });
  } catch (error: any) {
    console.error('Phone report error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi ghi nhận báo cáo từ điện thoại',
      error: error.message,
    });
  }
});

// POST /api/devices/uninstall - Explicit Uninstall / Disconnect signal from student
router.post('/uninstall', async (req: any, res: Response): Promise<any> => {
  try {
    const { deviceUuid, deviceId, studentName } = req.body;
    const dev = await dbService.recordDirectReport({
      deviceUuid,
      deviceId,
      studentName,
      isUninstalled: true,
    });
    notifyDeviceEvent(dev, 'APP_UNINSTALLED');
    return res.json({
      success: true,
      message: 'Đã ghi nhận trạng thái gỡ cài đặt',
      data: dev,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi ghi nhận gỡ cài đặt',
      error: error.message,
    });
  }
});

// GET /api/devices - List accessible devices (bắt buộc đăng nhập)
router.get('/', requireAuth, requireApproved, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const devices = await dbService.getAccessibleDevices(req.user!.userId);
    return res.json({
      success: true,
      data: devices,
    });
  } catch (error) {
    console.error('Fetch devices error:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách thiết bị',
    });
  }
});

// POST /api/devices - Register/Add new student device (bắt buộc đăng nhập)
router.post('/', requireAuth, requireApproved, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const {
      name,
      platform,
      osVersion,
      appVersion,
      deviceUuid,
      studentName,
      schoolName,
      className,
      currentApp,
      currentWebsite,
    } = req.body;
    const errors: Record<string, string> = {};

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.name = 'Tên thiết bị không được để trống';
    }

    const validPlatforms: PlatformType[] = ['iOS', 'Android', 'Tablet'];
    if (!platform || !validPlatforms.includes(platform)) {
      errors.platform = 'Nền tảng phải là iOS, Android hoặc Tablet';
    }

    let finalUuid = deviceUuid;
    if (!finalUuid || typeof finalUuid !== 'string') {
      finalUuid =
        'DEV-' +
        Math.random().toString(36).substring(2, 8).toUpperCase() +
        '-' +
        Date.now().toString(36).toUpperCase();
    } else {
      const existing = await dbService.findDeviceByUuid(finalUuid.trim());
      if (existing) {
        errors.deviceUuid = 'Mã UUID thiết bị đã tồn tại trong hệ thống';
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu thiết bị không hợp lệ',
        errors,
      });
    }

    const userId = (req as any).user?.userId || 'usr_default';
    const currentUser = (req as any).user ? await dbService.findUserById((req as any).user.userId) : null;
    const deviceId = 'dev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const nowIso = new Date().toISOString();

    const newDevice: DeviceRecord = {
      id: deviceId,
      userId,
      name: name.trim(),
      deviceUuid: finalUuid.trim(),
      platform: platform as PlatformType,
      osVersion: osVersion ? String(osVersion).trim() : undefined,
      appVersion: appVersion ? String(appVersion).trim() : '2.1.0',
      studentName: studentName ? String(studentName).trim() : currentUser?.studentName || name.trim(),
      schoolName: schoolName ? String(schoolName).trim() : currentUser?.schoolName || 'THPT Chuyên Lê Hồng Phong',
      className: className ? String(className).trim() : currentUser?.className || '10A1',
      currentApp: currentApp ? String(currentApp).trim() : 'Google Classroom',
      currentWebsite: currentWebsite ? String(currentWebsite).trim() : 'google.com',
      screenTimeMinutes: 15,
      blockedApps: [],
      blockedWebsites: [],
      lastSeen: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const created = await dbService.createDevice(newDevice, {
      batteryLevel: 100,
      charging: false,
      networkType: 'WIFI',
      locationPermission: true,
      locationSharing: true,
      status: 'ONLINE',
    });

    return res.status(201).json({
      success: true,
      message: 'Thêm thiết bị học sinh mới thành công',
      data: created,
    });
  } catch (error) {
    console.error('Create device error:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể thêm thiết bị mới',
    });
  }
});

// GET /api/devices/:id - Get device details
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const device = await getDeviceWithAccessCheck(req.params.id, req.user!.userId, res);
    if (!device) return;

    return res.json({
      success: true,
      data: device,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi tải chi tiết thiết bị',
    });
  }
});

// PATCH /api/devices/:id - Update device & student info
router.patch('/:id', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const device = await getDeviceWithAccessCheck(req.params.id, req.user!.userId, res);
    if (!device) return;

    const { name, platform, osVersion, appVersion, studentName, schoolName, className } = req.body;
    const updates: Partial<DeviceRecord> = {};

    if (name && typeof name === 'string' && name.trim().length > 0) {
      updates.name = name.trim();
    }
    if (platform && ['iOS', 'Android', 'Tablet'].includes(platform)) {
      updates.platform = platform as PlatformType;
    }
    if (osVersion !== undefined) {
      updates.osVersion = String(osVersion).trim();
    }
    if (appVersion !== undefined) {
      updates.appVersion = String(appVersion).trim();
    }
    if (studentName !== undefined) {
      updates.studentName = String(studentName).trim();
    }
    if (schoolName !== undefined) {
      updates.schoolName = String(schoolName).trim();
    }
    if (className !== undefined) {
      updates.className = String(className).trim();
    }

    const updated = await dbService.updateDevice(device.id, req.user!.userId, updates);

    return res.json({
      success: true,
      message: 'Cập nhật thiết bị thành công',
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Không thể cập nhật thiết bị',
    });
  }
});

// DELETE /api/devices/:id - Delete device
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const device = await getDeviceWithAccessCheck(req.params.id, req.user!.userId, res);
    if (!device) return;

    await dbService.deleteDevice(device.id, req.user!.userId);

    return res.json({
      success: true,
      message: 'Đã xóa thiết bị khỏi hệ thống',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Không thể xóa thiết bị',
    });
  }
});

// GET /api/devices/:id/usage - Get App Usage & Web History for a device
router.get('/:id/usage', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const device = await getDeviceWithAccessCheck(req.params.id, req.user!.userId, res);
    if (!device) return;

    const usage = await dbService.getDeviceUsage(device.id);
    return res.json({
      success: true,
      data: usage,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi tải lịch sử sử dụng App & Web',
    });
  }
});

// POST /api/devices/:id/usage - Record App & Web telemetry (from Mobile App or Simulator)
router.post('/:id/usage', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const device = await getDeviceWithAccessCheck(req.params.id, req.user?.userId, res, req);
    if (!device) return;

    const {
      appName,
      appCategory,
      appIcon,
      durationMinutes,
      websiteUrl,
      websiteTitle,
      webCategory,
    } = req.body;

    const updatedUsage = await dbService.recordAppAndWebUsage(device.id, {
      appName,
      appCategory: appCategory as UsageCategory,
      appIcon,
      durationMinutes: durationMinutes ? Number(durationMinutes) : 10,
      websiteUrl,
      websiteTitle,
      webCategory: webCategory as UsageCategory,
    });

    return res.status(201).json({
      success: true,
      message: 'Đã ghi nhận dữ liệu sử dụng App & Web',
      data: updatedUsage,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi ghi nhận dữ liệu App & Web',
    });
  }
});

// POST /api/devices/:id/toggle-block - Block or Unblock an App or Website on the device
router.post('/:id/toggle-block', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const device = await getDeviceWithAccessCheck(req.params.id, req.user!.userId, res);
    if (!device) return;

    const { targetType, targetName } = req.body;
    if (!targetType || !['APP', 'WEB'].includes(targetType) || !targetName || !String(targetName).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp tên Ứng dụng hoặc Website cần chặn/mở khóa',
      });
    }

    const roleLabel =
      req.user!.role === 'ADMIN'
        ? `Admin (${req.user!.name})`
        : req.user!.role === 'TEACHER'
        ? `GVCN (${req.user!.name})`
        : `Phụ huynh (${req.user!.name})`;

    const result = await dbService.toggleBlockItem(
      device.id,
      targetType as 'APP' | 'WEB',
      String(targetName),
      roleLabel
    );

    return res.json({
      success: true,
      message: `Đã cập nhật chính sách quản lý ${targetType === 'APP' ? 'ứng dụng' : 'website'} "${targetName}"`,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật trạng thái chặn App/Web',
    });
  }
});

// POST /api/devices/:id/location - Send GPS location
router.post('/:id/location', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const device = await getDeviceWithAccessCheck(req.params.id, req.user?.userId, res, req);
    if (!device) return;

    const { latitude, longitude, accuracy, timestamp } = req.body;
    const errors: Record<string, string> = {};

    const lat = Number(latitude);
    const lng = Number(longitude);
    const acc = accuracy !== undefined ? Number(accuracy) : undefined;

    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.latitude = 'Vĩ độ (latitude) phải nằm trong khoảng từ -90 đến 90';
    }

    if (isNaN(lng) || lng < -180 || lng > 180) {
      errors.longitude = 'Kinh độ (longitude) phải nằm trong khoảng từ -180 đến 180';
    }

    if (acc !== undefined && (isNaN(acc) || acc < 0)) {
      errors.accuracy = 'Độ chính xác (accuracy) phải là số dương';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu vị trí không hợp lệ',
        errors,
      });
    }

    const locRecord: DeviceLocationRecord = {
      id: 'loc_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      deviceId: device.id,
      latitude: lat,
      longitude: lng,
      accuracy: acc,
      timestamp: timestamp ? new Date(timestamp).toISOString() : new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const saved = await dbService.recordLocation(locRecord);

    return res.status(201).json({
      success: true,
      message: 'Cập nhật vị trí thành công',
      data: saved,
    });
  } catch (error) {
    console.error('Record location error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi ghi nhận vị trí thiết bị',
    });
  }
});

// GET /api/devices/:id/location - Get latest location
router.get('/:id/location', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const device = await getDeviceWithAccessCheck(req.params.id, req.user!.userId, res);
    if (!device) return;

    const loc = await dbService.getLatestLocation(device.id);

    return res.json({
      success: true,
      data: loc,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi tải vị trí thiết bị',
    });
  }
});

// GET /api/devices/:id/location-history - Get history with filter
router.get('/:id/location-history', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const device = await getDeviceWithAccessCheck(req.params.id, req.user!.userId, res);
    if (!device) return;

    const range = (req.query.range as string) || 'today';
    const history = await dbService.getLocationHistory(device.id, range);

    return res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi tải lịch sử vị trí',
    });
  }
});

// POST /api/devices/:id/heartbeat - Send status telemetry
router.post('/:id/heartbeat', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const device = await getDeviceWithAccessCheck(req.params.id, req.user?.userId, res, req);
    if (!device) return;

    const { batteryLevel, charging, networkType, status, locationPermission, locationSharing } = req.body;

    const battery = batteryLevel !== undefined ? Math.min(100, Math.max(0, parseInt(batteryLevel, 10))) : 100;
    const validStatuses: DeviceStatusType[] = ['ONLINE', 'IDLE', 'OFFLINE'];
    const validStatus = validStatuses.includes(status) ? status : 'ONLINE';
    const validNetworks: NetworkType[] = ['WIFI', '4G', '5G', 'ETHERNET', 'UNKNOWN'];
    const validNetwork = validNetworks.includes(networkType) ? networkType : 'WIFI';

    const statusRecord: DeviceStatusRecord = {
      id: 'stat_' + Date.now(),
      deviceId: device.id,
      batteryLevel: isNaN(battery) ? 100 : battery,
      charging: Boolean(charging),
      networkType: validNetwork,
      locationPermission: locationPermission !== undefined ? Boolean(locationPermission) : true,
      locationSharing: locationSharing !== undefined ? Boolean(locationSharing) : true,
      status: validStatus,
      timestamp: new Date().toISOString(),
    };

    const saved = await dbService.recordStatus(statusRecord);

    return res.json({
      success: true,
      message: 'Nhận tín hiệu heartbeat thành công',
      data: saved,
    });
  } catch (error) {
    console.error('Heartbeat error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi xử lý heartbeat',
    });
  }
});

// GET /api/devices/:id/status - Get latest status
router.get('/:id/status', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const device = await getDeviceWithAccessCheck(req.params.id, req.user!.userId, res);
    if (!device) return;

    const status = await dbService.getLatestStatus(device.id);

    return res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi tải trạng thái thiết bị',
    });
  }
});

// GET /api/devices/:id/activity - Get activity events for this device
router.get('/:id/activity', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const device = await getDeviceWithAccessCheck(req.params.id, req.user!.userId, res);
    if (!device) return;

    const activities = await dbService.getActivitiesForDevice(device.id);

    return res.json({
      success: true,
      data: activities,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi tải hoạt động thiết bị',
    });
  }
});

export default router;
