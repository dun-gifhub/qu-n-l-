import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  MapPin,
  Battery,
  Zap,
  Wifi,
  Radio,
  Play,
  Square,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  Navigation,
  Shield,
  Trash2,
  WifiOff,
  Building,
  GraduationCap,
  Users,
  Globe,
} from 'lucide-react';
import { api } from '../services/api.ts';

interface PhoneReportPageProps {
  navigate: (path: string) => void;
}

const DEFAULT_SERVER_URL = 'https://qu-n-l-s1k1.onrender.com';

const GRADE_OPTIONS = [
  'Khối 6',
  'Khối 7',
  'Khối 8',
  'Khối 9',
  'Khối 10',
  'Khối 11',
  'Khối 12',
  'Khối Đại Học / Khác',
];

export const PhoneReportPage: React.FC<PhoneReportPageProps> = ({ navigate }) => {
  // Device ID / UUID saved in localStorage
  const [deviceUuid, setDeviceUuid] = useState<string>(() => {
    const saved = localStorage.getItem('reporter_device_uuid');
    if (saved) return saved;
    const generated =
      'DEV-' +
      Math.random().toString(36).substring(2, 8).toUpperCase() +
      '-' +
      Date.now().toString(36).toUpperCase();
    localStorage.setItem('reporter_device_uuid', generated);
    return generated;
  });

  const [deviceName, setDeviceName] = useState<string>(() => {
    return (
      localStorage.getItem('reporter_device_name') ||
      (/iPhone|iPad|iPod/.test(navigator.userAgent)
        ? 'iPhone Học Sinh'
        : /Android/.test(navigator.userAgent)
        ? 'Điện Thoại Android'
        : 'Điện Thoại Di Động')
    );
  });

  const [studentName, setStudentName] = useState<string>(() => {
    return localStorage.getItem('reporter_student_name') || 'Nguyễn Minh Quân';
  });

  const [studentId, setStudentId] = useState<string>(() => {
    return localStorage.getItem('reporter_student_id') || 'HS' + Math.floor(1000 + Math.random() * 9000);
  });

  const [schoolName, setSchoolName] = useState<string>(() => {
    return localStorage.getItem('reporter_school_name') || 'THPT Chuyên Lê Hồng Phong';
  });

  const [grade, setGrade] = useState<string>(() => {
    return localStorage.getItem('reporter_grade') || 'Khối 10';
  });

  const [className, setClassName] = useState<string>(() => {
    return localStorage.getItem('reporter_class_name') || '10A1';
  });

  const [parentPhone, setParentPhone] = useState<string>(() => {
    return localStorage.getItem('reporter_parent_phone') || '0901234567';
  });

  const [serverUrl, setServerUrl] = useState<string>(() => {
    return (
      localStorage.getItem('reporter_server_url') ||
      (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : DEFAULT_SERVER_URL)
    );
  });

  const [currentApp, setCurrentApp] = useState<string>(() => {
    return localStorage.getItem('reporter_current_app') || 'Màn hình chính';
  });
  const [currentWebsite, setCurrentWebsite] = useState<string>(() => {
    return localStorage.getItem('reporter_current_website') || 'google.com';
  });

  const [isReporting, setIsReporting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Chưa bật báo cáo');
  const [reportCount, setReportCount] = useState<number>(0);
  const [lastReportTime, setLastReportTime] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [isUninstalled, setIsUninstalled] = useState<boolean>(false);

  // Live telemetry state
  const [coords, setCoords] = useState<{
    latitude: number;
    longitude: number;
    accuracy?: number;
    speed?: number | null;
  } | null>(null);

  const [battery, setBattery] = useState<{
    level: number;
    charging: boolean;
  }>({ level: 85, charging: false });

  const [networkType, setNetworkType] = useState<string>('WIFI');

  const watchIdRef = useRef<number | null>(null);
  const intervalIdRef = useRef<any>(null);
  const wakeLockRef = useRef<any>(null);

  // Detect platform
  const platform = /iPhone|iPad|iPod/.test(navigator.userAgent)
    ? 'iOS'
    : /Android/.test(navigator.userAgent)
    ? 'Android'
    : 'Android';

  // Read Battery API
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((batt: any) => {
        const update = () => {
          setBattery({
            level: Math.round(batt.level * 100),
            charging: batt.charging,
          });
        };
        update();
        batt.addEventListener('levelchange', update);
        batt.addEventListener('chargingchange', update);
      });
    }

    // Read Network Info
    const handleOnline = () => {
      setIsOffline(false);
      setNetworkType('WIFI');
      sendReport(undefined, false);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setNetworkType('NONE');
      // Fire offline event to server
      sendReport(undefined, false, true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const conn = (navigator as any).connection;
    if (conn) {
      const updateNet = () => {
        const type = conn.effectiveType || conn.type || 'WIFI';
        setNetworkType(type.toUpperCase());
      };
      updateNet();
      conn.addEventListener('change', updateNet);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Before unload handler: notify server that device tab was closed / disconnected
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (isReporting) {
        const data = JSON.stringify({
          deviceUuid,
          studentName,
          isUninstalled: true,
        });
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/devices/uninstall', data);
        }
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isReporting, deviceUuid, studentName]);

  // Auto-detect when student switches apps or minimizes browser
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        const backgroundApp = 'Ứng dụng chạy ngầm / Rời màn hình';
        setCurrentApp(backgroundApp);
        sendReport(undefined, false, false, backgroundApp);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isReporting, currentApp, currentWebsite]);

  // Function to send telemetry to server
  const sendReport = async (
    overrideCoords?: { latitude: number; longitude: number; accuracy?: number },
    forceUninstall: boolean = false,
    forceNoNetwork: boolean = false,
    overrideApp?: string,
    overrideWeb?: string
  ) => {
    const targetCoords = overrideCoords || coords;
    const activeApp = overrideApp || currentApp || 'Màn hình chính';
    const activeWeb = overrideWeb || currentWebsite || 'google.com';

    try {
      const payload = {
        deviceUuid,
        name: deviceName.trim() || 'Điện thoại di động',
        studentName: studentName.trim() || 'Học sinh',
        studentId: studentId.trim(),
        schoolName: schoolName.trim(),
        grade: grade.trim(),
        className: className.trim(),
        parentPhone: parentPhone.trim(),
        platform: platform as any,
        latitude: targetCoords?.latitude,
        longitude: targetCoords?.longitude,
        accuracy: targetCoords?.accuracy,
        batteryLevel: battery.level,
        charging: battery.charging,
        networkType: forceNoNetwork ? 'NONE' : networkType,
        currentApp: activeApp,
        currentWebsite: activeWeb,
        isUninstalled: forceUninstall,
        isNoNetwork: forceNoNetwork || isOffline,
      };

      // Primary send via client API (routes to relative /api or configured backend)
      const res = await api.reportDeviceTelemetry(payload);
      if (res.success) {
        setReportCount((c) => c + 1);
        setLastReportTime(new Date().toLocaleTimeString('vi-VN'));
        setLastError(null);
        setStatusMessage(
          forceUninstall
            ? 'Đã gửi thông báo gỡ app lên máy chủ'
            : 'Đang truyền GPS & Pin về Render (qu-n-l-s1k1)'
        );
      } else {
        setLastError(res.message || 'Lỗi gửi dữ liệu lên máy chủ');
      }

      // Also attempt background sync to Render target if different host
      if (serverUrl && !window.location.origin.includes('qu-n-l-s1k1.onrender.com')) {
        try {
          fetch(`${serverUrl}/api/devices/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            mode: 'cors',
            body: JSON.stringify(payload),
          }).catch(() => {});
        } catch {
          // ignore background cross-origin mirror
        }
      }
    } catch (err: any) {
      setLastError(err.message || 'Không thể kết nối máy chủ');
    }
  };

  // Start reporting
  const handleStartReporting = async () => {
    setLastError(null);
    setIsUninstalled(false);
    setStatusMessage('Đang kích hoạt định vị GPS...');

    // Save inputs
    localStorage.setItem('reporter_device_name', deviceName);
    localStorage.setItem('reporter_student_name', studentName);
    localStorage.setItem('reporter_student_id', studentId);
    localStorage.setItem('reporter_school_name', schoolName);
    localStorage.setItem('reporter_grade', grade);
    localStorage.setItem('reporter_class_name', className);
    localStorage.setItem('reporter_parent_phone', parentPhone);

    // Request Screen Wake Lock if available
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      } catch {
        // Ignored
      }
    }

    if (!('geolocation' in navigator)) {
      setLastError('Trình duyệt không hỗ trợ định vị Geolocation');
      return;
    }

    setIsReporting(true);

    // Watch position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const curCoords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          speed: pos.coords.speed,
        };
        setCoords(curCoords);
        sendReport(curCoords);
      },
      (err) => {
        console.warn('GPS error:', err.message);
        setStatusMessage('Đang đợi tín hiệu vệ tinh GPS...');
        sendReport();
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 4000,
      }
    );

    // Periodic heartbeat every 5 seconds for live 1-second auto refresh on dashboard
    intervalIdRef.current = setInterval(() => {
      sendReport();
    }, 5000);

    // Initial send
    sendReport();
  };

  // Stop reporting
  const handleStopReporting = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {});
      wakeLockRef.current = null;
    }
    setIsReporting(false);
    setStatusMessage('Đã dừng báo cáo');
  };

  // Uninstall / Disconnect action: triggers alert on web
  const handleUninstall = async () => {
    if (
      !window.confirm(
        'Bạn có chắc chắn muốn gỡ ứng dụng / huỷ theo dõi trên máy này? Hệ thống máy chủ của Giáo viên và Phụ huynh sẽ lập tức phát hiện và phát cảnh báo!'
      )
    ) {
      return;
    }
    handleStopReporting();
    setIsUninstalled(true);
    setStatusMessage('⚠️ Đã gửi tín hiệu gỡ ứng dụng tới máy chủ!');
    await sendReport(undefined, true);
    await api.uninstallDeviceTelemetry({
      deviceUuid,
      studentName,
    });
  };

  // Send sample location
  const sendSampleLocation = (city: 'HCM' | 'HN' | 'DN') => {
    let mockLat = 10.7769;
    let mockLng = 106.7009;
    if (city === 'HN') {
      mockLat = 21.0285;
      mockLng = 105.8542;
    } else if (city === 'DN') {
      mockLat = 16.0544;
      mockLng = 108.2022;
    }
    // Random jitter so points update
    mockLat += (Math.random() - 0.5) * 0.005;
    mockLng += (Math.random() - 0.5) * 0.005;

    const sample = { latitude: mockLat, longitude: mockLng, accuracy: 12 };
    setCoords(sample);
    sendReport(sample);
  };

  const handleCopyLink = () => {
    const link = `${DEFAULT_SERVER_URL}/report`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 max-w-lg mx-auto flex flex-col justify-between">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="font-extrabold text-base tracking-tight text-white leading-tight">
                Ứng Dụng Báo Cáo Học Sinh
              </h1>
              <p className="text-[11px] text-emerald-400 font-medium truncate max-w-[210px]">
                {DEFAULT_SERVER_URL.replace('https://', '')}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 flex items-center gap-1 transition cursor-pointer"
          >
            <span>Màn hình</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Network & Offline Alert Banner */}
        {isOffline && (
          <div className="mb-3 p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Điện thoại đang mất mạng Internet!</strong> Hệ thống trên web sẽ tự động phát hiện trạng thái này.
            </span>
          </div>
        )}

        {/* Uninstalled Alert Banner */}
        {isUninstalled && (
          <div className="mb-3 p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              <strong>Cảnh báo:</strong> Đã gửi trạng thái gỡ cài đặt đến Quản trị viên, Giáo viên và Phụ huynh!
            </span>
          </div>
        )}

        {/* Status Pill Card */}
        <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-3 h-3 rounded-full ${
                isReporting && !isOffline
                  ? 'bg-emerald-500 animate-ping'
                  : isOffline
                  ? 'bg-amber-500'
                  : 'bg-slate-600'
              }`}
            />
            <div>
              <div className="font-bold text-slate-200">{statusMessage}</div>
              {lastReportTime && (
                <div className="text-[10px] text-slate-400">Gần nhất: {lastReportTime}</div>
              )}
            </div>
          </div>
          {isReporting && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              TRỰC TIẾP
            </span>
          )}
        </div>

        {lastError && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{lastError}</span>
          </div>
        )}

        {/* Student & School Info Form */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-3">
          <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-indigo-400" />
              <span>THÔNG TIN HỌC SINH ĐĂNG KÝ</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {platform} · {networkType}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Họ tên học sinh
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => {
                  setStudentName(e.target.value);
                  localStorage.setItem('reporter_student_name', e.target.value);
                }}
                placeholder="VD: Nguyễn Minh Quân"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Mã học sinh
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => {
                  setStudentId(e.target.value);
                  localStorage.setItem('reporter_student_id', e.target.value);
                }}
                placeholder="VD: HS1024"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              Trường học (Báo về cho Giáo viên trường này)
            </label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => {
                setSchoolName(e.target.value);
                localStorage.setItem('reporter_school_name', e.target.value);
              }}
              placeholder="VD: THPT Chuyên Lê Hồng Phong"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Khối học
              </label>
              <select
                value={grade}
                onChange={(e) => {
                  setGrade(e.target.value);
                  localStorage.setItem('reporter_grade', e.target.value);
                }}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Lớp học
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => {
                  setClassName(e.target.value);
                  localStorage.setItem('reporter_class_name', e.target.value);
                }}
                placeholder="VD: 10A1"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                SĐT Phụ huynh (kết nối với cha/mẹ)
              </label>
              <input
                type="text"
                value={parentPhone}
                onChange={(e) => {
                  setParentPhone(e.target.value);
                  localStorage.setItem('reporter_parent_phone', e.target.value);
                }}
                placeholder="VD: 0901234567"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                Tên điện thoại
              </label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => {
                  setDeviceName(e.target.value);
                  localStorage.setItem('reporter_device_name', e.target.value);
                }}
                placeholder="iPhone 13 của Quân"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="pt-1 text-[10px] text-slate-500 flex items-center justify-between font-mono">
            <span>UUID máy:</span>
            <span className="truncate max-w-[190px]">{deviceUuid}</span>
          </div>
        </div>

        {/* Real-time App & Website Monitoring on Phone */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-900 border border-indigo-500/30 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h3 className="font-extrabold text-xs text-white uppercase tracking-wider">
                Giám Sát App & Website Đang Mở
              </h3>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold">
              Báo về máy chủ
            </span>
          </div>

          <p className="text-[11px] text-slate-400">
            Hệ thống tự động phát hiện ứng dụng hoặc trang web học sinh đang xem trên điện thoại và báo ngay về màn hình Quản trị viên, Giáo viên, Phụ huynh.
          </p>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Ứng dụng điện thoại đang mở:</span>
              <strong className="text-emerald-400 font-mono">{currentApp}</strong>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { name: 'TikTok', icon: '🎵' },
                { name: 'YouTube', icon: '📺' },
                { name: 'Liên Quân Mobile', icon: '🎮' },
                { name: 'Roblox', icon: '🕹️' },
                { name: 'Facebook', icon: '💬' },
                { name: 'Zalo', icon: '📱' },
                { name: 'K12Online', icon: '📚' },
                { name: 'vnEdu', icon: '🏫' },
                { name: 'Màn hình chính', icon: '🏠' },
              ].map((app) => (
                <button
                  type="button"
                  key={app.name}
                  onClick={() => {
                    setCurrentApp(app.name);
                    localStorage.setItem('reporter_current_app', app.name);
                    sendReport(undefined, false, false, app.name, currentWebsite);
                  }}
                  className={`py-2 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer border ${
                    currentApp === app.name
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{app.icon}</span>
                  <span className="truncate">{app.name}</span>
                </button>
              ))}
            </div>

            <div className="mt-2">
              <input
                type="text"
                value={currentApp}
                onChange={(e) => {
                  setCurrentApp(e.target.value);
                  localStorage.setItem('reporter_current_app', e.target.value);
                }}
                onBlur={() => sendReport(undefined, false, false, currentApp, currentWebsite)}
                placeholder="Hoặc nhập tên ứng dụng khác..."
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Trang web đang truy cập:</span>
              <strong className="text-indigo-400 font-mono text-[11px] truncate max-w-[170px]">{currentWebsite}</strong>
            </label>
            <div className="flex flex-wrap gap-1 mb-2">
              {[
                'youtube.com',
                'tiktok.com',
                'facebook.com',
                'k12online.vn',
                'vnedu.vn',
                'roblox.com',
                'google.com',
              ].map((site) => (
                <button
                  type="button"
                  key={site}
                  onClick={() => {
                    setCurrentWebsite(site);
                    localStorage.setItem('reporter_current_website', site);
                    sendReport(undefined, false, false, currentApp, site);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-semibold transition cursor-pointer border ${
                    currentWebsite.includes(site)
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {site}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={currentWebsite}
              onChange={(e) => {
                setCurrentWebsite(e.target.value);
                localStorage.setItem('reporter_current_website', e.target.value);
              }}
              onBlur={() => sendReport(undefined, false, false, currentApp, currentWebsite)}
              placeholder="VD: https://vnedu.vn hoặc youtube.com"
              className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            />
          </div>
        </div>

        {/* Big Start / Stop Button */}
        <div className="mt-5 space-y-2">
          {!isReporting ? (
            <button
              onClick={handleStartReporting}
              className="w-full py-4 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-base shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-3 transition-all cursor-pointer transform active:scale-98"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>BẮT ĐẦU BÁO CÁO APP, WEB & PIN</span>
            </button>
          ) : (
            <button
              onClick={handleStopReporting}
              className="w-full py-4 px-6 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-base shadow-lg shadow-amber-600/30 flex items-center justify-center gap-3 transition-all cursor-pointer transform active:scale-98"
            >
              <Square className="w-5 h-5 fill-current" />
              <span>TẠM DỪNG BÁO CÁO</span>
            </button>
          )}

          {/* Uninstall Button */}
          <button
            onClick={handleUninstall}
            className="w-full py-2.5 px-4 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/50 text-rose-300 font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>Gỡ Cài Đặt / Ngừng Theo Dõi (Tự Báo Về Web)</span>
          </button>
        </div>

        {/* Real-time Telemetry Status */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {/* Active App & Web Status */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-semibold">
              <Globe className="w-3.5 h-3.5" />
              <span>Đang Truyền Về Server</span>
            </div>
            <div className="text-xs font-bold text-white truncate">
              {currentApp || 'Màn hình chính'}
            </div>
            <div className="text-[10px] text-slate-400 truncate font-mono">
              {currentWebsite || 'google.com'}
            </div>
          </div>

          {/* Battery Status */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
              {battery.charging ? (
                <Zap className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Battery className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>Tình trạng Pin</span>
            </div>
            <div className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>{battery.level}%</span>
              {battery.charging && (
                <span className="text-[10px] font-normal text-amber-400">(Đang sạc)</span>
              )}
            </div>
            <div className="text-[10px] text-slate-400">
              Mạng: <span className="font-semibold text-slate-300">{networkType}</span>
            </div>
          </div>
        </div>

        {/* Report Stats */}
        <div className="mt-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Số gói tin App & Web đã truyền:</span>
          <span className="font-mono font-bold text-indigo-400">{reportCount} gói tin</span>
        </div>
      </div>

      {/* Footer Share Card */}
      <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-3">
        <button
          onClick={handleCopyLink}
          className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center justify-center gap-2 transition cursor-pointer"
        >
          {copiedLink ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 font-bold">
                Đã sao chép link https://qu-n-l-s1k1.onrender.com/report!
              </span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4 text-slate-400" />
              <span>Sao chép link https://qu-n-l-s1k1.onrender.com/report</span>
            </>
          )}
        </button>
        <div className="text-center text-[10px] text-slate-500">
          DeviceMonitor &bull; Máy chủ Render: https://qu-n-l-s1k1.onrender.com &bull; Neon PostgreSQL
        </div>
      </div>
    </div>
  );
};
