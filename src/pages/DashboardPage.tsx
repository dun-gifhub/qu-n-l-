import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api.ts';
import { Device, ActivityEvent } from '../types/index.ts';
import { DeviceMap } from '../components/Map/DeviceMap.tsx';
import {
  Smartphone,
  Radio,
  Wifi,
  Battery,
  Zap,
  ArrowRight,
  ExternalLink,
  Globe,
  MapPin,
  AlertTriangle,
  Trash2,
  BellRing,
  GraduationCap,
  ChevronDown,
} from 'lucide-react';

interface DashboardPageProps {
  navigate: (path: string) => void;
  onOpenAddDevice: () => void;
  onOpenSimulator?: () => void;
}

const RENDER_REPORT_URL = 'https://qu-n-l-s1k1.onrender.com/report';

export const DashboardPage: React.FC<DashboardPageProps> = ({
  navigate,
}) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dbStats, setDbStats] = useState<{ isNeonConnected: boolean; databaseEngine: string } | null>(null);

  const [selectedSchool] = useState<string>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    'ALL' | 'ONLINE' | 'IN_CLASS' | 'NO_NET' | 'UNINSTALLED'
  >('ALL');

  const isFetchingRef = useRef(false);

  const fetchLiveData = async (isInitial: boolean = false) => {
    if (isFetchingRef.current && !isInitial) return;
    isFetchingRef.current = true;
    try {
      const [devRes, actRes] = await Promise.all([
        api.getDevices(),
        api.getAllActivity(),
      ]);

      if (devRes.success && devRes.data) {
        setDevices(devRes.data);
      } else if (isInitial) {
        setErrorMsg(devRes.message || 'Không thể tải danh sách thiết bị');
      }

      if (actRes.success && actRes.data) {
        setActivities(actRes.data.slice(0, 10));
      }

      if (isInitial) {
        api.getDatabaseStats().then((res) => {
          if (res.success && res.data) {
            setDbStats(res.data);
          }
        });
      }
    } catch (err: any) {
      if (isInitial) setErrorMsg(err.message || 'Lỗi tải dữ liệu');
    } finally {
      if (isInitial) setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  useEffect(() => {
    fetchLiveData(true);
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchLiveData(false);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const availableGrades = Array.from(
    new Set(devices.map((d) => d.grade).filter(Boolean) as string[])
  ).sort();
  const availableClasses = Array.from(
    new Set(devices.map((d) => d.className).filter(Boolean) as string[])
  ).sort();

  const filteredDevices = devices.filter((d) => {
    if (selectedSchool !== 'ALL' && d.schoolName !== selectedSchool) return false;
    if (selectedGrade !== 'ALL' && d.grade !== selectedGrade) return false;
    if (selectedClass !== 'ALL' && d.className !== selectedClass) return false;

    if (selectedStatusFilter === 'ONLINE') return d.status === 'ONLINE';
    if (selectedStatusFilter === 'IN_CLASS') return Boolean(d.inClassAlert);
    if (selectedStatusFilter === 'NO_NET') return Boolean(d.isNoNetwork || d.networkType === 'NONE');
    if (selectedStatusFilter === 'UNINSTALLED') return Boolean(d.isUninstalled);

    return true;
  });

  const totalDevices = devices.length;
  const onlineCount = devices.filter((d) => d.status === 'ONLINE').length;
  const inClassCount = devices.filter((d) => d.inClassAlert).length;
  const noNetCount = devices.filter((d) => d.isNoNetwork || d.networkType === 'NONE').length;
  const uninstalledCount = devices.filter((d) => d.isUninstalled).length;

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
              Giám sát thiết bị học sinh
            </h1>
            <span className="px-2.5 py-0.5 rounded-[6px] text-xs font-mono tabular-nums bg-[var(--surface)] text-[var(--text-secondary)] border border-[var(--border)] inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
              <span>Làm mới 2,5 giây</span>
            </span>
          </div>
          <p className="text-xs text-[var(--text-secondary)] mt-1 flex flex-wrap items-center gap-1.5">
            <span>Máy chủ:</span>
            <span className="font-mono text-[var(--accent-ink)]">
              https://qu-n-l-s1k1.onrender.com
            </span>
            <span>·</span>
            {dbStats?.isNeonConnected ? (
              <span className="text-[var(--success)] font-medium">
                Đã kết nối Neon PostgreSQL
              </span>
            ) : (
              <span className="text-[var(--warning)] font-medium">
                Đang dùng lưu trữ cục bộ tạm thời
              </span>
            )}
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-[var(--radius-control)] bg-[var(--danger-soft)] border border-[var(--danger-border)] text-[var(--danger)] text-xs">
          {errorMsg}
        </div>
      )}

      {/* Database Warning */}
      {dbStats && !dbStats.isNeonConnected && (
        <div
          onClick={() => navigate('/settings')}
          className="p-4 rounded-[var(--radius-card)] bg-[var(--warning-soft)] border border-[var(--warning-border)] text-[var(--text-primary)] flex items-center justify-between gap-4 text-xs cursor-pointer hover:opacity-90 transition-opacity"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 shrink-0 text-[var(--warning)]" strokeWidth={1.5} />
            <span>
              <strong className="font-medium text-[var(--warning)]">Cảnh báo lưu trữ:</strong>{' '}
              Render có thể đặt lại dữ liệu cục bộ nếu chưa cấu hình biến môi trường DATABASE_URL cho Neon PostgreSQL. Bấm để mở phần cấu hình.
            </span>
          </div>
          <ArrowRight className="w-4 h-4 shrink-0 text-[var(--warning)]" strokeWidth={1.5} />
        </div>
      )}

      {/* Emergency Alert Banner */}
      {uninstalledCount > 0 ? (
        <div
          onClick={() => setSelectedStatusFilter('UNINSTALLED')}
          className="p-4 rounded-[var(--radius-card)] bg-[var(--danger-soft)] border border-[var(--danger-border)] flex items-center justify-between cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-[var(--radius-control)] bg-[var(--danger)] text-[var(--on-accent)] flex items-center justify-center shrink-0">
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-xs text-[var(--danger)]">
                Nghi vấn học sinh gỡ ứng dụng hoặc ngắt chia sẻ
              </div>
              <div className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                Có <span className="font-mono tabular-nums font-medium">{uninstalledCount}</span> thiết bị vừa gửi tín hiệu ngắt báo cáo
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
          className="p-4 rounded-[var(--radius-card)] bg-[var(--warning-soft)] border border-[var(--warning-border)] flex items-center justify-between cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-[var(--radius-control)] bg-[var(--warning)] text-[var(--on-accent)] flex items-center justify-center shrink-0">
              <BellRing className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-xs text-[var(--warning)]">
                Phát hiện sử dụng thiết bị trong giờ học
              </div>
              <div className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                Có <span className="font-mono tabular-nums font-medium">{inClassCount}</span> thiết bị đang trực tuyến và hoạt động trong khung giờ học
              </div>
            </div>
          </div>
          <span className="text-xs font-medium text-[var(--warning)] flex items-center gap-1 shrink-0 ml-3">
            <span>Lọc xem</span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </span>
        </div>
      ) : null}

      {/* Status Counters Bar (Clean Number Cards, Filterable) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          {
            key: 'ALL' as const,
            label: 'Tổng thiết bị',
            count: totalDevices,
            sub: 'Toàn hệ thống',
            tone: 'text-[var(--text-primary)]',
            dot: 'bg-[var(--accent)]',
          },
          {
            key: 'ONLINE' as const,
            label: 'Đang trực tuyến',
            count: onlineCount,
            sub: 'Đang truyền GPS',
            tone: 'text-[var(--success)]',
            dot: 'bg-[var(--success)]',
          },
          {
            key: 'IN_CLASS' as const,
            label: 'Dùng giờ học',
            count: inClassCount,
            sub: 'Cảnh báo giờ học',
            tone: 'text-[var(--warning)]',
            dot: 'bg-[var(--warning)]',
          },
          {
            key: 'NO_NET' as const,
            label: 'Mất mạng',
            count: noNetCount,
            sub: 'Không có kết nối',
            tone: 'text-[var(--danger)]',
            dot: 'bg-[var(--danger)]',
          },
          {
            key: 'UNINSTALLED' as const,
            label: 'Nghi vấn gỡ',
            count: uninstalledCount,
            sub: 'Ngừng theo dõi',
            tone: 'text-[var(--danger)]',
            dot: 'bg-[var(--danger)]',
          },
        ].map((item) => {
          const isSelected = selectedStatusFilter === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setSelectedStatusFilter(item.key)}
              className={`p-4 rounded-[var(--radius-card)] border text-left transition-[background-color,border-color] duration-[var(--duration-fast)] cursor-pointer ${
                isSelected
                  ? 'bg-[var(--surface-muted)] border-[var(--accent)] shadow-[var(--shadow-card)]'
                  : 'bg-[var(--surface)] border-[var(--border)] hover:border-[var(--border-strong)] shadow-[var(--shadow-card)]'
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

      {/* Hierarchy Filter Bar: Khối & Lớp */}
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

      {/* Primary Moment 1: Google Maps Live View */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] flex items-center justify-center">
              <MapPin className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--text-primary)] text-base">
                Bản đồ định vị Google Maps
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Hiển thị vị trí thực của học sinh theo khối và lớp trên nền ảnh vệ tinh
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/map')}
            className="text-xs font-medium text-[var(--accent-ink)] hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <span>Mở toàn màn hình</span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>
        <DeviceMap devices={filteredDevices} height="390px" />
      </div>

      {/* Primary Moment 2: Live App & Web Monitor Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] flex items-center justify-center">
              <Globe className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-semibold text-[var(--text-primary)] text-base">
                Giám sát ứng dụng và website trực tiếp
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Theo dõi ứng dụng đang mở và trang web học sinh truy cập gần nhất
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/app-usage')}
            className="text-xs font-medium text-[var(--accent-ink)] hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <span>Quản lý chi tiết App & Web</span>
            <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] overflow-hidden shadow-[var(--shadow-card)]">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-[var(--text-muted)]">
              Đang tải dữ liệu thiết bị
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="p-8 text-center text-xs text-[var(--text-muted)]">
              Chưa có thiết bị nào đang kết nối để theo dõi App & Web
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-[var(--surface-muted)] text-[var(--text-secondary)] font-medium border-b border-[var(--border)]">
                  <tr>
                    <th className="py-3 px-4">Học sinh / Thiết bị</th>
                    <th className="py-3 px-4">Trường & Lớp</th>
                    <th className="py-3 px-4">Ứng dụng đang mở</th>
                    <th className="py-3 px-4">Website vừa vào</th>
                    <th className="py-3 px-4">Pin & Sạc</th>
                    <th className="py-3 px-4">Trạng thái</th>
                    <th className="py-3 px-4 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredDevices.map((d) => (
                    <tr
                      key={d.id}
                      className="hover:bg-[var(--surface-muted)]/40 transition-colors cursor-pointer"
                      onClick={() => navigate(`/devices/${d.id}`)}
                    >
                      <td className="py-3 px-4">
                        <div className="font-medium text-[var(--text-primary)]">
                          {d.studentName || d.name}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] font-mono tabular-nums">
                          {d.deviceUuid.substring(0, 12)}...
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-[var(--text-primary)]">
                          {d.schoolName || 'Chưa gán trường'}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)]">
                          {d.className ? `Lớp ${d.className}` : 'Chưa gán lớp'}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-[6px] text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent-ink)] border border-[var(--accent-border)]">
                          {d.currentApp || 'Màn hình chính'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs text-[var(--text-secondary)]">
                          {d.currentWebsite || 'google.com'}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 font-mono tabular-nums font-medium text-[var(--text-primary)]">
                          <span>{d.batteryLevel ?? 100}%</span>
                          {d.charging && (
                            <span className="text-[11px] text-[var(--warning)] font-sans font-normal">
                              Đang sạc
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {d.inClassAlert ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-[11px] font-medium bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning-border)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--warning)]" />
                            <span>Trong giờ học</span>
                          </span>
                        ) : d.status === 'ONLINE' ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-[11px] font-medium bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success-border)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)] telemetry-live-dot" />
                            <span>Trực tuyến</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-[11px] font-medium bg-[var(--surface-muted)] text-[var(--text-muted)] border border-[var(--border)]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)]" />
                            <span>Ngoại tuyến</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-xs font-medium text-[var(--accent-ink)] hover:underline">
                          Xem
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Two Column Grid: Devices & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Devices List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[var(--text-primary)] text-base">
              Danh sách giám sát học sinh ({filteredDevices.length} máy)
            </h2>
            <button
              onClick={() => navigate('/devices')}
              className="text-xs font-medium text-[var(--accent-ink)] hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>Xem tất cả ({totalDevices})</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>

          {filteredDevices.length === 0 ? (
            <div className="p-8 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] text-center space-y-4 shadow-[var(--shadow-card)]">
              <div className="w-11 h-11 rounded-[var(--radius-control)] bg-[var(--surface-muted)] text-[var(--text-secondary)] mx-auto flex items-center justify-center">
                <Radio className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-[var(--text-primary)] text-sm">
                  Chưa có thiết bị nào trong bộ lọc này
                </h3>
                <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto">
                  Mở liên kết <span className="font-mono">{RENDER_REPORT_URL}</span> trên điện thoại học sinh hoặc chọn lại bộ lọc khối, lớp.
                </p>
              </div>
              <div className="flex justify-center gap-2 pt-1">
                <button
                  onClick={() => navigate('/report')}
                  className="h-9 px-4 rounded-[var(--radius-control)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] font-medium text-xs transition-colors cursor-pointer"
                >
                  Mở cổng điện thoại báo vào
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDevices.map((d) => {
                const isOnline = d.status === 'ONLINE';
                const inClass = Boolean(d.inClassAlert);
                const isUninstalled = Boolean(d.isUninstalled);
                const isNoNet = Boolean(d.isNoNetwork || d.networkType === 'NONE');

                return (
                  <div
                    key={d.id}
                    onClick={() => navigate(`/devices/${d.id}`)}
                    className={`p-4 rounded-[var(--radius-card)] bg-[var(--surface)] border transition-colors duration-[var(--duration-fast)] cursor-pointer space-y-3 shadow-[var(--shadow-card)] ${
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
                            {d.studentName || d.name}
                          </div>
                          <div className="text-[11px] text-[var(--text-secondary)] truncate">
                            {d.schoolName || 'Chưa rõ trường'}{' '}
                            {d.className ? `· Lớp ${d.className}` : ''}{' '}
                            {d.grade ? `(${d.grade})` : ''}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-[11px] font-medium shrink-0 ${
                          isUninstalled
                            ? 'bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger-border)]'
                            : inClass
                            ? 'bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning-border)]'
                            : isNoNet
                            ? 'bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger-border)]'
                            : isOnline
                            ? 'bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success-border)]'
                            : 'bg-[var(--surface-muted)] text-[var(--text-muted)] border border-[var(--border)]'
                        }`}
                        title={d.disconnectReason || (isUninstalled ? 'Mất kết nối hoặc có thể đã gỡ cài đặt' : undefined)}
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
                            ? d.disconnectReason || 'Mất kết nối / Đã gỡ'
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
                        {d.charging ? (
                          <Zap className="w-4 h-4 text-[var(--warning)] shrink-0" strokeWidth={1.5} />
                        ) : (
                          <Battery className="w-4 h-4 text-[var(--success)] shrink-0" strokeWidth={1.5} />
                        )}
                        <span>Pin: {d.batteryLevel ?? 100}%</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[var(--text-secondary)] font-mono">
                        <Wifi className="w-4 h-4 text-[var(--text-muted)] shrink-0" strokeWidth={1.5} />
                        <span>{d.networkType || 'WIFI'}</span>
                      </div>
                    </div>

                    {d.latitude && d.longitude && (
                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[var(--border)] text-[var(--text-muted)]">
                        <span className="font-mono tabular-nums truncate">
                          GPS: {d.latitude.toFixed(4)}, {d.longitude.toFixed(4)}
                        </span>
                        <a
                          href={`https://www.google.com/maps?q=${d.latitude},${d.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[var(--accent-ink)] font-medium hover:underline flex items-center gap-1 shrink-0"
                        >
                          <span>Google Maps</span>
                          <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Activity Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[var(--text-primary)] text-base">
              Nhật ký sự kiện trực tiếp
            </h2>
            <button
              onClick={() => navigate('/activity')}
              className="text-xs font-medium text-[var(--accent-ink)] hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>

          <div className="p-4 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] space-y-3 shadow-[var(--shadow-card)]">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                Chưa có sự kiện nào được ghi nhận
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((act) => {
                  const isUninstall = act.type === 'UNINSTALLED';
                  const isNoNet = act.type === 'NO_NETWORK';

                  return (
                    <div key={act.id} className="flex items-start gap-2.5 text-xs">
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          isUninstall
                            ? 'bg-[var(--danger)]'
                            : isNoNet
                            ? 'bg-[var(--warning)]'
                            : 'bg-[var(--accent)]'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-[var(--text-primary)] truncate flex items-center justify-between gap-2">
                          <span className="truncate">{act.studentName || act.deviceName}</span>
                          {act.className && (
                            <span className="text-[11px] text-[var(--text-muted)] shrink-0">
                              Lớp {act.className}
                            </span>
                          )}
                        </div>
                        <div
                          className={`text-xs leading-relaxed mt-0.5 ${
                            isUninstall
                              ? 'text-[var(--danger)] font-medium'
                              : isNoNet
                              ? 'text-[var(--warning)] font-medium'
                              : 'text-[var(--text-secondary)]'
                          }`}
                        >
                          {act.description}
                        </div>
                        <div className="text-[11px] font-mono tabular-nums text-[var(--text-muted)] mt-0.5">
                          {new Date(act.timestamp).toLocaleTimeString('vi-VN')}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
