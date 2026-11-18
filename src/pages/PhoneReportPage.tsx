import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Battery,
  Zap,
  Radio,
  Play,
  Square,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  Trash2,
  WifiOff,
  GraduationCap,
  Globe,
  Music,
  Tv,
  Gamepad2,
  MessageSquare,
  BookOpen,
  School,
  Home,
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
  const [deviceUuid] = useState<string>(() => {
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
    const val = localStorage.getItem('reporter_student_name');
    return val !== null ? val : '';
  });

  const [studentId, setStudentId] = useState<string>(() => {
    const val = localStorage.getItem('reporter_student_id');
    return val !== null ? val : '';
  });

  const [schoolName, setSchoolName] = useState<string>(() => {
    const val = localStorage.getItem('reporter_school_name');
    return val !== null ? val : '';
  });

  const [grade, setGrade] = useState<string>(() => {
    const val = localStorage.getItem('reporter_grade');
    return val !== null ? val : '';
  });

  const [className, setClassName] = useState<string>(() => {
    const val = localStorage.getItem('reporter_class_name');
    return val !== null ? val : '';
  });

  const [parentPhone, setParentPhone] = useState<string>(() => {
    const val = localStorage.getItem('reporter_parent_phone');
    return val !== null ? val : '';
  });

  const [serverUrl] = useState<string>(() => {
    return (
      localStorage.getItem('reporter_server_url') ||
      (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : DEFAULT_SERVER_URL)
    );
  });

  const [currentApp, setCurrentApp] = useState<string>(() => {
    const val = localStorage.getItem('reporter_current_app');
    return val !== null ? val : 'Màn hình chính';
  });
  const [currentWebsite, setCurrentWebsite] = useState<string>(() => {
    const val = localStorage.getItem('reporter_current_website');
    return val !== null ? val : '';
  });

  const [isReporting, setIsReporting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Chưa bật báo cáo');
  const [reportCount, setReportCount] = useState<number>(0);
  const [lastReportTime, setLastReportTime] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [isUninstalled, setIsUninstalled] = useState<boolean>(false);
  const [confirmUninstallOpen, setConfirmUninstallOpen] = useState<boolean>(false);

  const handleClearAllFields = () => {
    setStudentName('');
    setStudentId('');
    setSchoolName('');
    setGrade('');
    setClassName('');
    setParentPhone('');
    setDeviceName('');
    setCurrentApp('');
    setCurrentWebsite('');

    localStorage.removeItem('reporter_student_name');
    localStorage.removeItem('reporter_student_id');
    localStorage.removeItem('reporter_school_name');
    localStorage.removeItem('reporter_grade');
    localStorage.removeItem('reporter_class_name');
    localStorage.removeItem('reporter_parent_phone');
    localStorage.removeItem('reporter_device_name');
    localStorage.removeItem('reporter_current_app');
    localStorage.removeItem('reporter_current_website');

    setStatusMessage('Đã làm trống tất cả các trường nhập liệu');
    setLastError(null);
  };

  const handleFillDemoData = () => {
    const sName = 'Nguyễn Minh Quân';
    const sId = 'HS' + Math.floor(1000 + Math.random() * 9000);
    const sSchool = 'THPT Chuyên Lê Hồng Phong';
    const sGrade = 'Khối 10';
    const sClass = '10A1';
    const sPhone = '0901234567';
    const sDev = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'iPhone Học Sinh' : 'Điện Thoại Android';
    const sApp = 'Màn hình chính';
    const sWeb = 'google.com';

    setStudentName(sName);
    setStudentId(sId);
    setSchoolName(sSchool);
    setGrade(sGrade);
    setClassName(sClass);
    setParentPhone(sPhone);
    setDeviceName(sDev);
    setCurrentApp(sApp);
    setCurrentWebsite(sWeb);

    localStorage.setItem('reporter_student_name', sName);
    localStorage.setItem('reporter_student_id', sId);
    localStorage.setItem('reporter_school_name', sSchool);
    localStorage.setItem('reporter_grade', sGrade);
    localStorage.setItem('reporter_class_name', sClass);
    localStorage.setItem('reporter_parent_phone', sPhone);
    localStorage.setItem('reporter_device_name', sDev);
    localStorage.setItem('reporter_current_app', sApp);
    localStorage.setItem('reporter_current_website', sWeb);

    setStatusMessage('Đã điền thông tin mẫu');
  };

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

  const platform = /iPhone|iPad|iPod/.test(navigator.userAgent) ? 'iOS' : 'Android';

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

    const handleOnline = () => {
      setIsOffline(false);
      setNetworkType('WIFI');
      sendReport(undefined, false);
    };

    const handleOffline = () => {
      setIsOffline(true);
      setNetworkType('NONE');
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

      const res = await api.reportDeviceTelemetry(payload);
      if (res.success) {
        setReportCount((c) => c + 1);
        setLastReportTime(new Date().toLocaleTimeString('vi-VN'));
        setLastError(null);
        setStatusMessage(
          forceUninstall
            ? 'Đã gửi thông báo gỡ ứng dụng lên máy chủ'
            : 'Đang truyền GPS và pin định kỳ 5 giây'
        );
      } else {
        setLastError(res.message || 'Lỗi gửi dữ liệu lên máy chủ');
      }

      if (serverUrl && !window.location.origin.includes('qu-n-l-s1k1.onrender.com')) {
        try {
          fetch(`${serverUrl}/api/devices/report`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            mode: 'cors',
            body: JSON.stringify(payload),
          }).catch(() => {});
        } catch {}
      }
    } catch (err: any) {
      setLastError(err.message || 'Không thể kết nối máy chủ');
    }
  };

  const handleStartReporting = async () => {
    setLastError(null);
    setIsUninstalled(false);
    setStatusMessage('Đang kích hoạt định vị GPS');

    localStorage.setItem('reporter_device_name', deviceName);
    localStorage.setItem('reporter_student_name', studentName);
    localStorage.setItem('reporter_student_id', studentId);
    localStorage.setItem('reporter_school_name', schoolName);
    localStorage.setItem('reporter_grade', grade);
    localStorage.setItem('reporter_class_name', className);
    localStorage.setItem('reporter_parent_phone', parentPhone);

    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      } catch {}
    }

    if (!('geolocation' in navigator)) {
      setLastError('Trình duyệt không hỗ trợ định vị Geolocation');
      return;
    }

    setIsReporting(true);

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
      () => {
        setStatusMessage('Đang đợi tín hiệu vệ tinh GPS');
        sendReport();
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 4000,
      }
    );

    intervalIdRef.current = setInterval(() => {
      sendReport();
    }, 5000);

    sendReport();
  };

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

  const handleUninstallConfirm = async () => {
    setConfirmUninstallOpen(false);
    handleStopReporting();
    setIsUninstalled(true);
    setStatusMessage('Đã gửi tín hiệu gỡ ứng dụng tới máy chủ');
    await sendReport(undefined, true);
    await api.uninstallDeviceTelemetry({
      deviceUuid,
      studentName,
    });
  };

  const handleCopyLink = () => {
    const link = `${DEFAULT_SERVER_URL}/report`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  const quickApps = [
    { name: 'TikTok', icon: <Music className="w-4 h-4" strokeWidth={1.5} /> },
    { name: 'YouTube', icon: <Tv className="w-4 h-4" strokeWidth={1.5} /> },
    { name: 'Liên Quân Mobile', icon: <Gamepad2 className="w-4 h-4" strokeWidth={1.5} /> },
    { name: 'Roblox', icon: <Gamepad2 className="w-4 h-4" strokeWidth={1.5} /> },
    { name: 'Facebook', icon: <MessageSquare className="w-4 h-4" strokeWidth={1.5} /> },
    { name: 'Zalo', icon: <Smartphone className="w-4 h-4" strokeWidth={1.5} /> },
    { name: 'K12Online', icon: <BookOpen className="w-4 h-4" strokeWidth={1.5} /> },
    { name: 'vnEdu', icon: <School className="w-4 h-4" strokeWidth={1.5} /> },
    { name: 'Màn hình chính', icon: <Home className="w-4 h-4" strokeWidth={1.5} /> },
  ];

  return (
    <div className="dark min-h-screen bg-[var(--bg)] text-[var(--text-primary)]">
      <div className="p-4 sm:p-6 max-w-lg mx-auto min-h-screen flex flex-col justify-between">
        <div>
          {/* Top Header */}
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[var(--radius-control)] bg-[var(--accent-soft)] border border-[var(--accent-border)] flex items-center justify-center text-[var(--accent-ink)]">
                <Radio className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <div>
                <h1 className="font-semibold text-base tracking-tight text-[var(--text-primary)] leading-tight">
                  Trình báo cáo thiết bị học sinh
                </h1>
                <p className="text-[11px] text-[var(--success)] font-mono truncate max-w-[210px] mt-1">
                  {DEFAULT_SERVER_URL.replace('https://', '')}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="h-8 px-3 rounded-[var(--radius-control)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-medium text-[var(--text-primary)] flex items-center gap-1.5 transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer"
            >
              <span>Bảng điều khiển</span>
              <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>

          {/* Network & Offline Alert Banner */}
          {isOffline && (
            <div className="mb-3 p-3 rounded-[var(--radius-control)] bg-[var(--warning-soft)] border border-[var(--warning-border)] text-[var(--warning)] text-xs flex items-center gap-2">
              <WifiOff className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <span>
                Điện thoại đang mất mạng Internet. Hệ thống quản lý sẽ ghi nhận trạng thái ngoại tuyến.
              </span>
            </div>
          )}

          {/* Uninstalled Alert Banner */}
          {isUninstalled && (
            <div className="mb-3 p-3 rounded-[var(--radius-control)] bg-[var(--danger-soft)] border border-[var(--danger-border)] text-[var(--danger)] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <span>
                Đã gửi trạng thái gỡ cài đặt tới Quản trị viên, Giáo viên và Phụ huynh.
              </span>
            </div>
          )}

          {/* Status Card */}
          <div className="p-4 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  isReporting && !isOffline
                    ? 'bg-[var(--success)] telemetry-live-dot'
                    : isOffline
                    ? 'bg-[var(--warning)]'
                    : 'bg-[var(--text-muted)]'
                }`}
              />
              <div>
                <div className="font-semibold text-[var(--text-primary)]">{statusMessage}</div>
                {lastReportTime && (
                  <div className="text-[11px] font-mono tabular-nums text-[var(--text-muted)] mt-1">
                    Gần nhất: {lastReportTime}
                  </div>
                )}
              </div>
            </div>
            {isReporting && (
              <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-mono font-medium bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success-border)]">
                Đang truyền
              </span>
            )}
          </div>

          {lastError && (
            <div className="mt-3 p-3 rounded-[var(--radius-control)] bg-[var(--danger-soft)] border border-[var(--danger-border)] text-[var(--danger)] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <span>{lastError}</span>
            </div>
          )}

          {/* Student & School Info Form */}
          <div className="mt-4 p-4 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[var(--accent-ink)]" strokeWidth={1.5} />
                <span>Thông tin học sinh đăng ký</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearAllFields}
                  className="h-7 px-2 rounded-[6px] bg-[var(--danger-soft)] hover:bg-[#A82834] text-[var(--danger)] hover:text-white border border-[var(--danger-border)] text-[11px] font-medium flex items-center gap-1 transition-[color,background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>Làm trống</span>
                </button>
                <button
                  type="button"
                  onClick={handleFillDemoData}
                  className="h-7 px-2 rounded-[6px] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] text-[11px] font-medium transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer"
                >
                  Mẫu thử
                </button>
                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                  {platform} · {networkType}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
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
                  className="w-full h-9 px-3 bg-[var(--bg)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
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
                  className="w-full h-9 px-3 bg-[var(--bg)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs font-mono text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                Trường học
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => {
                  setSchoolName(e.target.value);
                  localStorage.setItem('reporter_school_name', e.target.value);
                }}
                placeholder="VD: THPT Chuyên Lê Hồng Phong"
                className="w-full h-9 px-3 bg-[var(--bg)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                  Khối học
                </label>
                <select
                  value={grade}
                  onChange={(e) => {
                    setGrade(e.target.value);
                    localStorage.setItem('reporter_grade', e.target.value);
                  }}
                  className="w-full h-9 px-3 bg-[var(--bg)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)]"
                >
                  <option value="">Chọn khối</option>
                  {GRADE_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
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
                  className="w-full h-9 px-3 bg-[var(--bg)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
                  SĐT phụ huynh
                </label>
                <input
                  type="text"
                  value={parentPhone}
                  onChange={(e) => {
                    setParentPhone(e.target.value);
                    localStorage.setItem('reporter_parent_phone', e.target.value);
                  }}
                  placeholder="VD: 0901234567"
                  className="w-full h-9 px-3 bg-[var(--bg)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs font-mono text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-[var(--text-secondary)] mb-1">
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
                  className="w-full h-9 px-3 bg-[var(--bg)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div className="pt-1 text-[11px] text-[var(--text-muted)] flex items-center justify-between font-mono">
              <span>UUID máy</span>
              <span className="truncate max-w-[190px]">{deviceUuid}</span>
            </div>
          </div>

          {/* App & Website Monitoring Selector */}
          <div className="mt-4 p-4 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isReporting ? 'bg-[var(--success)] telemetry-live-dot' : 'bg-[var(--text-muted)]'
                  }`}
                />
                <h3 className="font-semibold text-xs text-[var(--text-primary)]">
                  Báo cáo ứng dụng và website đang mở
                </h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-[6px] bg-[var(--accent-soft)] text-[var(--accent-ink)] border border-[var(--accent-border)]">
                Đồng bộ máy chủ
              </span>
            </div>

            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Chọn hoặc nhập ứng dụng và website đang dùng trên điện thoại để kiểm thử báo cáo trực tiếp.
            </p>

            <div>
              <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-2 flex items-center justify-between">
                <span>Ứng dụng đang mở</span>
                <strong className="text-[var(--success)] font-mono font-medium">{currentApp}</strong>
              </label>
              <div className="grid grid-cols-3 gap-2">
                {quickApps.map((app) => (
                  <button
                    type="button"
                    key={app.name}
                    onClick={() => {
                      setCurrentApp(app.name);
                      localStorage.setItem('reporter_current_app', app.name);
                      sendReport(undefined, false, false, app.name, currentWebsite);
                    }}
                    className={`h-9 px-2 rounded-[var(--radius-control)] text-[11px] font-medium flex items-center justify-center gap-1.5 transition-[color,background-color,border-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer border ${
                      currentApp === app.name
                        ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] border-[var(--accent-border)]'
                        : 'bg-[var(--bg)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {app.icon}
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
                  placeholder="Hoặc nhập tên ứng dụng khác"
                  className="w-full h-9 px-3 bg-[var(--bg)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-medium text-[var(--text-secondary)] mb-2 flex items-center justify-between">
                <span>Trang web đang truy cập</span>
                <strong className="text-[var(--accent-ink)] font-mono font-medium text-[11px] truncate max-w-[170px]">
                  {currentWebsite}
                </strong>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
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
                    className={`h-7 px-2 rounded-[6px] text-[11px] font-mono font-medium transition-[color,background-color,border-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer border ${
                      currentWebsite.includes(site)
                        ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] border-[var(--accent-border)]'
                        : 'bg-[var(--bg)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]'
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
                placeholder="VD: vnedu.vn hoặc youtube.com"
                className="w-full h-9 px-3 bg-[var(--bg)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)] font-mono"
              />
            </div>
          </div>

          {/* Start / Stop Button */}
          <div className="mt-4 space-y-2">
            {!isReporting ? (
              <button
                onClick={handleStartReporting}
                className="w-full h-12 px-6 rounded-[var(--radius-control)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] font-semibold text-sm flex items-center justify-center gap-2 transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer"
              >
                <Play className="w-4 h-4" strokeWidth={1.5} />
                <span>Bắt đầu báo cáo GPS, ứng dụng và pin</span>
              </button>
            ) : (
              <button
                onClick={handleStopReporting}
                className="w-full h-12 px-6 rounded-[var(--radius-control)] bg-[var(--warning-soft)] hover:opacity-90 border border-[var(--warning-border)] text-[var(--warning)] font-semibold text-sm flex items-center justify-center gap-2 transition-[opacity] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer"
              >
                <Square className="w-4 h-4" strokeWidth={1.5} />
                <span>Tạm dừng báo cáo</span>
              </button>
            )}

            {/* Inline Confirmation Uninstall Button */}
            {!confirmUninstallOpen ? (
              <button
                onClick={() => setConfirmUninstallOpen(true)}
                className="w-full h-10 px-4 rounded-[var(--radius-control)] bg-[var(--danger-soft)] hover:bg-[#A82834] border border-[var(--danger-border)] text-[var(--danger)] hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-[color,background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer"
              >
                <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                <span>Gửi tín hiệu gỡ cài đặt / Ngừng theo dõi</span>
              </button>
            ) : (
              <div className="p-3 rounded-[var(--radius-control)] bg-[var(--danger-soft)] border border-[var(--danger-border)] space-y-2 text-xs">
                <p className="text-[var(--danger)] font-medium">
                  Máy chủ của Giáo viên và Phụ huynh sẽ lập tức ghi nhận cảnh báo gỡ cài đặt. Xác nhận gửi tín hiệu này?
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmUninstallOpen(false)}
                    className="flex-1 h-8 rounded-[6px] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--text-primary)] font-medium cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleUninstallConfirm}
                    className="flex-1 h-8 rounded-[6px] bg-[#A82834] text-white font-medium cursor-pointer"
                  >
                    Xác nhận gỡ theo dõi
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Real-time Telemetry Status */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="p-4 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-[var(--accent-ink)] font-medium">
                <Globe className="w-4 h-4" strokeWidth={1.5} />
                <span>Đang truyền về máy chủ</span>
              </div>
              <div className="text-xs font-semibold text-[var(--text-primary)] truncate">
                {currentApp || 'Màn hình chính'}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] truncate font-mono">
                {currentWebsite || 'google.com'}
              </div>
            </div>

            <div className="p-4 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-medium">
                {battery.charging ? (
                  <Zap className="w-4 h-4 text-[var(--warning)]" strokeWidth={1.5} />
                ) : (
                  <Battery className="w-4 h-4 text-[var(--success)]" strokeWidth={1.5} />
                )}
                <span>Tình trạng pin</span>
              </div>
              <div className="text-sm font-semibold font-mono tabular-nums text-[var(--text-primary)] flex items-center gap-1.5">
                <span>{battery.level}%</span>
                {battery.charging && (
                  <span className="text-[11px] font-sans font-normal text-[var(--warning)]">
                    Đang sạc
                  </span>
                )}
              </div>
              <div className="text-[11px] text-[var(--text-muted)] font-mono">
                Mạng {networkType}
              </div>
            </div>
          </div>

          {/* Report Stats */}
          <div className="mt-3 p-3 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between text-xs">
            <span className="text-[var(--text-secondary)]">Số gói tin đã truyền</span>
            <span className="font-mono tabular-nums font-semibold text-[var(--accent-ink)]">
              {reportCount} gói tin
            </span>
          </div>
        </div>

        {/* Footer Share Card */}
        <div className="mt-6 pt-4 border-t border-[var(--border)] space-y-3">
          <button
            onClick={handleCopyLink}
            className="w-full h-10 px-4 rounded-[var(--radius-control)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-medium text-[var(--text-primary)] flex items-center justify-center gap-2 transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer"
          >
            {copiedLink ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[var(--success)]" strokeWidth={1.5} />
                <span className="text-[var(--success)] font-medium">
                  Đã sao chép liên kết báo cáo
                </span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-[var(--text-muted)]" strokeWidth={1.5} />
                <span className="font-mono text-[11px] truncate">
                  {DEFAULT_SERVER_URL}/report
                </span>
              </>
            )}
          </button>
          <div className="text-center text-[11px] text-[var(--text-muted)]">
            DeviceMonitor · Neon PostgreSQL
          </div>
        </div>
      </div>
    </div>
  );
};
