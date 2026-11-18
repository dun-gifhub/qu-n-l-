import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Device, DeviceLocation } from '../types/index.ts';
import { DeviceMap } from '../components/Map/DeviceMap.tsx';
import {
  Smartphone,
  Plus,
  Search,
  RefreshCw,
  Battery,
  Zap,
  Wifi,
  ArrowRight,
  Trash2,
  GraduationCap,
  ChevronDown,
  ExternalLink,
  MapPin,
  Navigation,
  Copy,
  Check,
} from 'lucide-react';

interface DevicesPageProps {
  navigate: (path: string) => void;
  onOpenAddDevice: () => void;
  onOpenSimulator?: (deviceId?: string) => void;
}

type EnrichedMovementLocation = DeviceLocation & {
  deviceName?: string;
  studentName?: string;
  className?: string;
  schoolName?: string;
};

export const DevicesPage: React.FC<DevicesPageProps> = ({
  navigate,
  onOpenAddDevice,
}) => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    'ALL' | 'ONLINE' | 'IN_CLASS' | 'NO_NET' | 'UNINSTALLED'
  >('ALL');

  const [viewMode, setViewMode] = useState<'devices' | 'movement_history'>('devices');

  const [movementLocations, setMovementLocations] = useState<EnrichedMovementLocation[]>([]);
  const [movementLoading, setMovementLoading] = useState(false);
  const [movementRange, setMovementRange] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [selectedMovementDeviceId, setSelectedMovementDeviceId] = useState<string>('ALL');
  const [copiedGps, setCopiedGps] = useState(false);

  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);

  const loadDevices = async () => {
    const res = await api.getDevices();
    if (res.success && res.data) {
      setDevices(res.data);
    }
    setIsLoading(false);
  };

  const loadMovementHistory = async () => {
    setMovementLoading(true);
    try {
      const res = await api.getAllMovementHistory(movementRange, selectedMovementDeviceId);
      if (res.success && res.data) {
        setMovementLocations(res.data);
      }
    } finally {
      setMovementLoading(false);
    }
  };

  const handleClearAllDevices = async () => {
    setIsClearingAll(true);
    try {
      const res = await api.clearAllDevices();
      if (res.success) {
        setDevices([]);
        setMovementLocations([]);
        setConfirmClearAll(false);
      }
    } finally {
      setIsClearingAll(false);
      loadDevices();
    }
  };

  useEffect(() => {
    loadDevices();
    const interval = setInterval(() => {
      if (!document.hidden) {
        loadDevices();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [user?.id]);

  useEffect(() => {
    if (viewMode === 'movement_history') {
      loadMovementHistory();
    }
  }, [viewMode, movementRange, selectedMovementDeviceId]);

  const copyAllGpsData = () => {
    if (movementLocations.length === 0) return;
    const text = movementLocations
      .map(
        (loc, idx) =>
          `#${idx + 1} | ${loc.studentName || 'Học sinh'} (${loc.deviceName || 'Thiết bị'}) | Lớp: ${loc.className || 'N/A'} | ${new Date(loc.timestamp).toLocaleString('vi-VN')} | GPS: ${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)} | Sai số: ±${Math.round(loc.accuracy || 10)}m`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedGps(true);
    setTimeout(() => setCopiedGps(false), 2500);
  };

  const availableGrades = Array.from(
    new Set(devices.map((d) => d.grade).filter(Boolean) as string[])
  ).sort();
  const availableClasses = Array.from(
    new Set(devices.map((d) => d.className).filter(Boolean) as string[])
  ).sort();

  const filteredDevices = devices.filter((d) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      d.name.toLowerCase().includes(q) ||
      d.deviceUuid.toLowerCase().includes(q) ||
      (d.studentName || '').toLowerCase().includes(q) ||
      (d.schoolName || '').toLowerCase().includes(q);

    if (selectedGrade !== 'ALL' && d.grade !== selectedGrade) return false;
    if (selectedClass !== 'ALL' && d.className !== selectedClass) return false;

    if (selectedStatusFilter === 'ONLINE') return d.status === 'ONLINE';
    if (selectedStatusFilter === 'IN_CLASS') return Boolean(d.inClassAlert);
    if (selectedStatusFilter === 'NO_NET') return Boolean(d.isNoNetwork || d.networkType === 'NONE');
    if (selectedStatusFilter === 'UNINSTALLED') return Boolean(d.isUninstalled);

    return matchesSearch;
  });

  const totalDevices = devices.length;
  const onlineCount = devices.filter((d) => d.status === 'ONLINE').length;
  const inClassCount = devices.filter((d) => d.inClassAlert).length;
  const noNetCount = devices.filter((d) => d.isNoNetwork || d.networkType === 'NONE').length;
  const uninstalledCount = devices.filter((d) => d.isUninstalled).length;

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Top Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Danh sách thiết bị học sinh
          </h1>
          <span className="px-2.5 py-0.5 rounded-[6px] text-xs font-mono tabular-nums bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
            <span>Làm mới 3 giây</span>
          </span>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Máy chủ: <span className="font-mono text-[var(--accent-ink)]">https://qu-n-l-s1k1.onrender.com</span> · Đồng bộ Neon PostgreSQL · Bản đồ Google Maps vệ tinh
        </p>
      </div>

      {/* Navigation Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] pb-3">
        <button
          onClick={() => setViewMode('devices')}
          className={`h-9 px-4 rounded-[var(--radius-control)] text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
            viewMode === 'devices'
              ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]'
              : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] border border-[var(--border)]'
          }`}
        >
          <Smartphone className="w-4 h-4" strokeWidth={1.5} />
          <span>Danh sách giám sát ({totalDevices})</span>
        </button>

        <button
          onClick={() => setViewMode('movement_history')}
          className={`h-9 px-4 rounded-[var(--radius-control)] text-xs font-medium transition-colors flex items-center gap-2 cursor-pointer ${
            viewMode === 'movement_history'
              ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]'
              : 'bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] border border-[var(--border)]'
          }`}
        >
          <Navigation className="w-4 h-4" strokeWidth={1.5} />
          <span>Lịch sử di chuyển</span>
          <span className="text-[11px] font-mono tabular-nums opacity-80">
            {movementLocations.length > 0 ? `${movementLocations.length} điểm` : 'Lưu trữ đầy đủ'}
          </span>
        </button>

        <div className="flex items-center gap-2 ml-auto">
          {totalDevices > 0 && !confirmClearAll && (
            <button
              onClick={() => setConfirmClearAll(true)}
              className="h-9 px-3 rounded-[var(--radius-control)] text-xs font-medium bg-[var(--danger-soft)] text-[var(--danger)] hover:opacity-90 border border-[var(--danger-border)] transition-opacity flex items-center gap-1.5 cursor-pointer"
              title="Làm trống tất cả thiết bị trên hệ thống"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
              <span>Xóa toàn bộ thiết bị</span>
            </button>
          )}
          {totalDevices > 0 && confirmClearAll && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleClearAllDevices}
                disabled={isClearingAll}
                className="h-9 px-3 rounded-[var(--radius-control)] text-xs font-medium bg-[var(--danger)] text-[var(--on-accent)] cursor-pointer"
              >
                {isClearingAll ? 'Đang xóa...' : 'Xác nhận xóa hết'}
              </button>
              <button
                onClick={() => setConfirmClearAll(false)}
                className="h-9 px-3 rounded-[var(--radius-control)] text-xs font-medium bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--text-secondary)] cursor-pointer"
              >
                Hủy
              </button>
            </div>
          )}
          <button
            onClick={onOpenAddDevice}
            className="h-9 px-4 rounded-[var(--radius-control)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            <span>Đăng ký thiết bị</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: DANH SÁCH THIẾT BỊ */}
      {viewMode === 'devices' && (
        <div className="space-y-4">
          {uninstalledCount > 0 ? (
            <div
              onClick={() => setSelectedStatusFilter('UNINSTALLED')}
              className="p-4 rounded-[var(--radius-card)] bg-[var(--danger-soft)] border border-[var(--danger-border)] flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-[var(--radius-control)] bg-[var(--danger)] text-[var(--on-accent)] flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-[var(--danger)]">
                    Nghi vấn học sinh gỡ ứng dụng
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                    Có <span className="font-mono tabular-nums font-medium">{uninstalledCount}</span> điện thoại vừa gửi tín hiệu ngắt báo cáo
                  </div>
                </div>
              </div>
              <span className="text-xs font-medium text-[var(--danger)] flex items-center gap-1 shrink-0 ml-3">
                <span>Lọc xem</span>
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
              </span>
            </div>
          ) : inClassCount > 0 ? (
            <div
              onClick={() => setSelectedStatusFilter('IN_CLASS')}
              className="p-4 rounded-[var(--radius-card)] bg-[var(--warning-soft)] border border-[var(--warning-border)] flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-[var(--radius-control)] bg-[var(--warning)] text-[var(--on-accent)] flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-[var(--warning)]">
                    Cảnh báo sử dụng trong giờ học
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                    Phát hiện <span className="font-mono tabular-nums font-medium">{inClassCount}</span> thiết bị đang trực tuyến và hoạt động trong giờ học
                  </div>
                </div>
              </div>
              <span className="text-xs font-medium text-[var(--warning)] flex items-center gap-1 shrink-0 ml-3">
                <span>Lọc xem</span>
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
              </span>
            </div>
          ) : null}

          {/* Status Counters Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { key: 'ALL' as const, label: 'Tổng thiết bị', count: totalDevices, sub: 'Tất cả học sinh', tone: 'text-[var(--text-primary)]', dot: 'bg-[var(--accent)]' },
              { key: 'ONLINE' as const, label: 'Đang trực tuyến', count: onlineCount, sub: 'Đang truyền GPS', tone: 'text-[var(--success)]', dot: 'bg-[var(--success)]' },
              { key: 'IN_CLASS' as const, label: 'Dùng giờ học', count: inClassCount, sub: 'Cảnh báo giờ học', tone: 'text-[var(--warning)]', dot: 'bg-[var(--warning)]' },
              { key: 'NO_NET' as const, label: 'Mất mạng', count: noNetCount, sub: 'Không có mạng', tone: 'text-[var(--danger)]', dot: 'bg-[var(--danger)]' },
              { key: 'UNINSTALLED' as const, label: 'Nghi vấn gỡ', count: uninstalledCount, sub: 'Ngừng theo dõi', tone: 'text-[var(--danger)]', dot: 'bg-[var(--danger)]' },
            ].map((item) => {
              const isSelected = selectedStatusFilter === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSelectedStatusFilter(item.key)}
                  className={`p-4 rounded-[var(--radius-card)] border text-left transition-[background-color,border-color] duration-[var(--duration-fast)] cursor-pointer shadow-[var(--shadow-card)] ${
                    isSelected
                      ? 'bg-[var(--surface-muted)] border-[var(--accent)]'
                      : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-medium text-[var(--text-secondary)]">
                    <span className={`w-1.5 h-1.5 rounded-full ${item.dot}`} />
                    <span>{item.label}</span>
                  </div>
                  <div className={`text-2xl font-semibold font-mono tabular-nums mt-2 ${item.tone}`}>
                    {item.count}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-1">{item.sub}</div>
                </button>
              );
            })}
          </div>

          {/* Grade & Class Filters */}
          <div className="p-4 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
              <span className="font-medium text-xs text-[var(--text-primary)]">
                Phân loại theo trường, khối và lớp
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={selectedGrade}
                  onChange={(e) => setSelectedGrade(e.target.value)}
                  className="appearance-none h-9 pl-3 pr-8 bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] border border-[var(--border)] rounded-[var(--radius-control)] text-xs font-medium text-[var(--text-primary)] focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Tất cả các khối</option>
                  {availableGrades.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[var(--text-muted)] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.5} />
              </div>

              <div className="relative">
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="appearance-none h-9 pl-3 pr-8 bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] border border-[var(--border)] rounded-[var(--radius-control)] text-xs font-medium text-[var(--text-primary)] focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Tất cả các lớp</option>
                  {availableClasses.map((c) => (
                    <option key={c} value={c}>
                      Lớp {c}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[var(--text-muted)] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.5} />
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-4 bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] flex flex-col md:flex-row items-center gap-3 shadow-[var(--shadow-card)]">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" strokeWidth={1.5} />
              <input
                type="text"
                placeholder="Tìm theo tên học sinh, trường học hoặc mã thiết bị"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius-control)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] px-2 py-1 cursor-pointer shrink-0"
              >
                Xóa tìm kiếm
              </button>
            )}
          </div>

          {/* Device Cards Grid */}
          {isLoading ? (
            <div className="py-16 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[var(--accent)]" strokeWidth={1.5} />
              <span>Đang tải danh sách giám sát</span>
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="p-12 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] text-center max-w-lg mx-auto space-y-4 my-8 shadow-[var(--shadow-card)]">
              <div>
                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                  Chưa có thiết bị nào trong danh sách
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-2 leading-relaxed">
                  Mở liên kết báo cáo trên điện thoại học sinh hoặc đăng ký thiết bị mới để bắt đầu theo dõi.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-3">
                <button
                  onClick={() => navigate('/report')}
                  className="h-9 px-4 rounded-[var(--radius-control)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border-strong)] text-xs font-medium transition-colors cursor-pointer"
                >
                  Mở liên kết trên điện thoại
                </button>
                <button
                  onClick={onOpenAddDevice}
                  className="h-9 px-4 rounded-[var(--radius-control)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] text-xs font-medium transition-colors cursor-pointer"
                >
                  Đăng ký thiết bị
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDevices.map((device) => {
                const isOnline = device.status === 'ONLINE';
                const inClass = Boolean(device.inClassAlert);
                const isUninstalled = Boolean(device.isUninstalled);
                const isNoNet = Boolean(device.isNoNetwork || device.networkType === 'NONE');

                return (
                  <div
                    key={device.id}
                    onClick={() => navigate(`/devices/${device.id}`)}
                    className={`p-5 rounded-[var(--radius-card)] bg-[var(--surface)] border transition-colors duration-[var(--duration-fast)] cursor-pointer space-y-3 shadow-[var(--shadow-card)] ${
                      inClass
                        ? 'border-[var(--warning-border)]'
                        : isUninstalled
                        ? 'border-[var(--danger-border)]'
                        : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-[var(--radius-control)] flex items-center justify-center shrink-0 ${
                            inClass
                              ? 'bg-[var(--warning-soft)] text-[var(--warning)]'
                              : isUninstalled
                              ? 'bg-[var(--danger-soft)] text-[var(--danger)]'
                              : isOnline
                              ? 'bg-[var(--success-soft)] text-[var(--success)]'
                              : 'bg-[var(--surface-muted)] text-[var(--text-muted)]'
                          }`}
                        >
                          <Smartphone className="w-4 h-4" strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-xs text-[var(--text-primary)] truncate">
                            {device.studentName || device.name}
                          </div>
                          <div className="text-[11px] text-[var(--text-secondary)] truncate">
                            {device.schoolName || 'Chưa rõ trường'}{' '}
                            {device.className ? `· Lớp ${device.className}` : ''}{' '}
                            {device.grade ? `(${device.grade})` : ''}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-[11px] font-medium shrink-0 ${
                          isUninstalled || isNoNet
                            ? 'bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger-border)]'
                            : inClass
                            ? 'bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning-border)]'
                            : isOnline
                            ? 'bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success-border)]'
                            : 'bg-[var(--surface-muted)] text-[var(--text-muted)] border border-[var(--border)]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isUninstalled || isNoNet
                              ? 'bg-[var(--danger)]'
                              : inClass
                              ? 'bg-[var(--warning)]'
                              : isOnline
                              ? 'bg-[var(--success)] telemetry-live-dot'
                              : 'bg-[var(--text-muted)]'
                          }`}
                        />
                        <span>
                          {isUninstalled
                            ? device.disconnectReason || 'Mất kết nối / Đã gỡ'
                            : inClass
                            ? 'Dùng giờ học'
                            : isNoNet
                            ? 'Mất mạng'
                            : isOnline
                            ? 'Trực tuyến'
                            : 'Ngoại tuyến'}
                        </span>
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)] text-xs">
                      <div className="flex items-center gap-1.5 text-[var(--text-secondary)] font-mono tabular-nums">
                        {device.charging ? (
                          <Zap className="w-4 h-4 text-[var(--warning)] shrink-0" strokeWidth={1.5} />
                        ) : (
                          <Battery className="w-4 h-4 text-[var(--success)] shrink-0" strokeWidth={1.5} />
                        )}
                        <span>{device.batteryLevel ?? 100}% {device.charging ? 'Sạc' : ''}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[var(--text-secondary)] font-mono">
                        <Wifi className="w-4 h-4 text-[var(--text-muted)] shrink-0" strokeWidth={1.5} />
                        <span>{device.networkType || 'WIFI'}</span>
                      </div>
                    </div>

                    {device.latitude && device.longitude ? (
                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[var(--border)] text-[var(--text-muted)]">
                        <span className="font-mono tabular-nums truncate">
                          GPS: {device.latitude.toFixed(4)}, {device.longitude.toFixed(4)}
                        </span>
                        <a
                          href={`https://www.google.com/maps?q=${device.latitude},${device.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[var(--accent-ink)] font-medium hover:underline flex items-center gap-1 shrink-0"
                        >
                          <span>Google Maps</span>
                          <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                        </a>
                      </div>
                    ) : (
                      <div className="text-[11px] pt-2 border-t border-[var(--border)] text-[var(--text-muted)] font-mono">
                        GPS: Chưa có tọa độ
                      </div>
                    )}

                    <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMovementDeviceId(device.id);
                          setViewMode('movement_history');
                        }}
                        className="h-8 px-2.5 rounded-[var(--radius-control)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] font-medium text-[11px] transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <Navigation className="w-3.5 h-3.5 text-[var(--accent-ink)]" strokeWidth={1.5} />
                        <span>Lịch sử di chuyển</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/devices/${device.id}`);
                        }}
                        className="h-8 px-3 rounded-[var(--radius-control)] bg-[var(--surface-muted)] hover:bg-[var(--btn-primary-bg)] hover:text-[var(--btn-primary-text)] font-medium text-xs text-[var(--text-primary)] transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                      >
                        <span>Chi tiết</span>
                        <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: LỊCH SỬ DI CHUYỂN */}
      {viewMode === 'movement_history' && (
        <div className="space-y-4">
          <div className="p-4 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-[var(--radius-control)] bg-[var(--accent-soft)] text-[var(--accent-ink)] flex items-center justify-center shrink-0">
                <Navigation className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <div>
                <div className="font-semibold text-sm text-[var(--text-primary)] flex items-center gap-2">
                  <span>Cơ chế lưu trữ lịch sử di chuyển: chỉ thêm, không bớt</span>
                  <span className="px-2 py-0.5 rounded-[6px] text-[11px] bg-[var(--success-soft)] text-[var(--success)] font-medium border border-[var(--success-border)]">
                    Neon PostgreSQL
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Hệ thống giữ nguyên toàn bộ các điểm tọa độ GPS gửi về từ điện thoại theo thời gian.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={copyAllGpsData}
                disabled={movementLocations.length === 0}
                className="h-9 px-3 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border-strong)] hover:bg-[var(--surface-muted)] text-[var(--text-primary)] font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                {copiedGps ? (
                  <Check className="w-4 h-4 text-[var(--success)]" strokeWidth={1.5} />
                ) : (
                  <Copy className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
                )}
                <span>{copiedGps ? 'Đã sao chép' : 'Sao chép GPS'}</span>
              </button>
              <button
                onClick={loadMovementHistory}
                disabled={movementLoading}
                className="w-9 h-9 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border-strong)] hover:bg-[var(--surface-muted)] text-[var(--text-secondary)] flex items-center justify-center transition-colors cursor-pointer"
                title="Làm mới lịch sử"
              >
                <RefreshCw className={`w-4 h-4 ${movementLoading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          <div className="p-4 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-[var(--text-secondary)] shrink-0">
                Thiết bị / Học sinh
              </span>
              <div className="relative flex-1 sm:w-64">
                <select
                  value={selectedMovementDeviceId}
                  onChange={(e) => setSelectedMovementDeviceId(e.target.value)}
                  className="w-full appearance-none h-9 pl-3 pr-8 bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius-control)] text-xs font-medium text-[var(--text-primary)] focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Tất cả thiết bị ({devices.length} máy)</option>
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.studentName || d.name} {d.className ? `(Lớp ${d.className})` : ''} - {d.platform}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-[var(--text-muted)] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.5} />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[
                { key: 'all', label: 'Toàn bộ' },
                { key: 'today', label: 'Hôm nay' },
                { key: '7days', label: '7 ngày qua' },
                { key: '30days', label: '30 ngày qua' },
              ].map((r) => (
                <button
                  key={r.key}
                  onClick={() => setMovementRange(r.key as any)}
                  className={`h-8 px-3 rounded-[var(--radius-control)] text-xs font-medium transition-colors cursor-pointer ${
                    movementRange === r.key
                      ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)]'
                      : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:bg-[var(--surface-hover)]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="text-xs font-mono tabular-nums font-medium text-[var(--accent-ink)]">
              {movementLocations.length} điểm GPS
            </div>
          </div>

          <div className="rounded-[var(--radius-card)] overflow-hidden border border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
            <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  Bản đồ lộ trình di chuyển học sinh
                </span>
              </div>
              <span className="text-[11px] text-[var(--text-muted)] font-mono">
                {selectedMovementDeviceId === 'ALL' ? 'Tất cả thiết bị' : 'Thiết bị đang chọn'}
              </span>
            </div>
            <DeviceMap historyLocations={movementLocations} height="480px" />
          </div>

          <div className="bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] overflow-hidden shadow-[var(--shadow-card)]">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-[var(--text-primary)]">
                  Nhật ký tọa độ di chuyển chi tiết
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Lưu trữ tích lũy trên PostgreSQL
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums font-medium text-[var(--accent-ink)]">
                {movementLocations.length} bản ghi GPS
              </span>
            </div>

            {movementLocations.length === 0 ? (
              <div className="py-12 px-4 text-center text-xs text-[var(--text-muted)] space-y-2">
                <Navigation className="w-6 h-6 text-[var(--text-muted)] mx-auto" strokeWidth={1.5} />
                <p className="font-medium text-[var(--text-secondary)]">Chưa có dữ liệu di chuyển cho bộ lọc này</p>
                <p className="text-xs">Mở ứng dụng hoặc liên kết báo cáo trên điện thoại để truyền tọa độ GPS.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead className="bg-[var(--surface-muted)] text-[var(--text-secondary)] font-medium border-b border-[var(--border)]">
                    <tr>
                      <th className="py-3 px-4">STT</th>
                      <th className="py-3 px-4">Học sinh / Thiết bị</th>
                      <th className="py-3 px-4">Lớp / Trường</th>
                      <th className="py-3 px-4">Thời gian</th>
                      <th className="py-3 px-4">Vĩ độ</th>
                      <th className="py-3 px-4">Kinh độ</th>
                      <th className="py-3 px-4">Sai số</th>
                      <th className="py-3 px-4">Vị trí điểm</th>
                      <th className="py-3 px-4 text-right">Bản đồ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border)] font-mono tabular-nums">
                    {movementLocations.map((loc, idx) => (
                      <tr key={loc.id || idx} className="hover:bg-[var(--surface-muted)]/40 transition-colors">
                        <td className="py-3 px-4 text-[var(--text-muted)]">#{idx + 1}</td>
                        <td className="py-3 px-4 font-sans">
                          <div className="font-medium text-[var(--text-primary)]">{loc.studentName || 'Học sinh'}</div>
                          <div className="text-[11px] text-[var(--text-muted)] font-mono">{loc.deviceName || loc.deviceId}</div>
                        </td>
                        <td className="py-3 px-4 font-sans text-[var(--text-secondary)]">
                          {loc.className ? `Lớp ${loc.className}` : ''}{' '}
                          {loc.schoolName ? `· ${loc.schoolName}` : ''}
                        </td>
                        <td className="py-3 px-4 text-[var(--text-primary)] font-sans tabular-nums">
                          {new Date(loc.timestamp).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3 px-4 font-medium text-[var(--text-primary)]">
                          {loc.latitude.toFixed(6)}
                        </td>
                        <td className="py-3 px-4 font-medium text-[var(--text-primary)]">
                          {loc.longitude.toFixed(6)}
                        </td>
                        <td className="py-3 px-4 text-[var(--text-secondary)]">
                          {loc.accuracy ? `±${Math.round(loc.accuracy)}m` : '±10m'}
                        </td>
                        <td className="py-3 px-4 font-sans">
                          {idx === 0 ? (
                            <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-medium bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success-border)]">
                              Vị trí mới nhất
                            </span>
                          ) : idx === movementLocations.length - 1 ? (
                            <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-medium bg-[var(--accent-soft)] text-[var(--accent-ink)] border border-[var(--accent-border)]">
                              Điểm xuất phát
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-medium bg-[var(--surface-muted)] text-[var(--text-secondary)] border border-[var(--border)]">
                              Dọc lộ trình
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-sans">
                          <a
                            href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-[var(--accent-ink)] hover:underline"
                          >
                            <span>Google Maps</span>
                            <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
