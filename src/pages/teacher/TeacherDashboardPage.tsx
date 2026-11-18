import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Device, ActivityEvent } from '../../types/index.ts';
import { EducationCard } from '../../components/education/EducationCard.tsx';
import { EducationButton } from '../../components/education/EducationButton.tsx';
import { EducationStatCard } from '../../components/education/EducationStatCard.tsx';
import { EducationBadge } from '../../components/education/EducationBadge.tsx';
import { DeviceMap } from '../../components/Map/DeviceMap.tsx';
import {
  Users,
  BellRing,
  MapPin,
  ExternalLink,
  Smartphone,
  Plus,
  Search,
  ArrowRight,
  Battery,
  Zap,
  School,
  RefreshCw,
  Clock,
  Wifi,
  Info,
  UserCheck,
} from 'lucide-react';

interface TeacherDashboardPageProps {
  navigate: (path: string) => void;
  onOpenAddDevice?: () => void;
}

export const TeacherDashboardPage: React.FC<TeacherDashboardPageProps> = ({
  navigate,
  onOpenAddDevice,
}) => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE' | 'IN_CLASS' | 'ALERT'>('ALL');

  const loadData = async () => {
    try {
      const [devRes, actRes] = await Promise.all([
        api.getDevices(),
        api.getAllActivity(),
      ]);
      if (devRes.success && devRes.data) {
        setDevices(devRes.data);
      }
      if (actRes.success && actRes.data) {
        setActivities(actRes.data.slice(0, 6));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  const availableClasses = Array.from(
    new Set(devices.map((d) => d.className).filter(Boolean) as string[])
  ).sort();

  const filteredDevices = devices.filter((d) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      (d.studentName || '').toLowerCase().includes(q) ||
      d.name.toLowerCase().includes(q) ||
      (d.className || '').toLowerCase().includes(q) ||
      (d.schoolName || '').toLowerCase().includes(q);

    if (selectedClass !== 'ALL' && d.className !== selectedClass) return false;
    if (statusFilter === 'ONLINE' && d.status !== 'ONLINE') return false;
    if (statusFilter === 'IN_CLASS' && !d.inClassAlert) return false;
    if (statusFilter === 'ALERT' && !d.isUninstalled && !d.inClassAlert && !d.isNoNetwork)
      return false;

    return matchSearch;
  });

  const totalStudents = devices.length;
  const onlineCount = devices.filter((d) => d.status === 'ONLINE').length;
  const inClassCount = devices.filter((d) => d.inClassAlert).length;
  const totalClasses = availableClasses.length;

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Contextual Overview Header */}
      <div className="rounded-[var(--radius-panel)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-secondary)]">
            <span className="inline-flex items-center gap-2 px-2 py-1 rounded-[6px] bg-[var(--surface-muted)] border border-[var(--border)] font-medium text-[var(--text-primary)]">
              <School className="w-4 h-4 text-[var(--accent-ink)]" strokeWidth={1.5} />
              <span>{user?.schoolName || 'Trường học chưa cập nhật'}</span>
            </span>
            {user?.className && (
              <span className="px-2 py-1 rounded-[6px] bg-[var(--accent-soft)] border border-[var(--accent-border)] font-medium text-[var(--accent-ink)]">
                Chủ nhiệm lớp {user.className}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">
            Giám sát lớp học và thiết bị học sinh
          </h1>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Theo dõi trạng thái kết nối, mức pin, vị trí GPS và cảnh báo sử dụng trong giờ học của học sinh thuộc đơn vị giảng dạy.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0">
          <EducationButton
            variant="primary"
            icon={<Plus className="w-4 h-4" strokeWidth={1.5} />}
            onClick={() => {
              if (onOpenAddDevice) onOpenAddDevice();
              else navigate('/devices');
            }}
          >
            Thêm học sinh
          </EducationButton>

          <EducationButton
            variant="outline"
            icon={<Smartphone className="w-4 h-4" strokeWidth={1.5} />}
            onClick={() => navigate('/report')}
          >
            Mở trang báo cáo trên điện thoại
          </EducationButton>

          <EducationButton
            variant="outline"
            icon={<Clock className="w-4 h-4" strokeWidth={1.5} />}
            onClick={() => navigate('/schedules')}
          >
            Giờ học & lịch nghỉ theo khối
          </EducationButton>

          <EducationButton
            variant="outline"
            icon={<UserCheck className="w-4 h-4" strokeWidth={1.5} />}
            onClick={() => navigate('/schedules?tab=excuse')}
          >
            Đặc cách nghỉ có lý do
          </EducationButton>
        </div>
      </div>

      {/* Critical Alert Bar if any */}
      {inClassCount > 0 && (
        <div
          onClick={() => setStatusFilter('IN_CLASS')}
          className="p-4 rounded-[var(--radius-card)] bg-[var(--warning-soft)] border border-[var(--warning-border)] flex items-center justify-between gap-4 cursor-pointer hover:opacity-95 transition-[opacity] duration-[var(--duration-fast)] ease-[var(--ease-standard)]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--warning-border)] text-[var(--warning)] flex items-center justify-center shrink-0">
              <BellRing className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-semibold text-[var(--warning)]">
                Cảnh báo học sinh sử dụng thiết bị trong giờ học
              </h4>
              <p className="text-xs text-[var(--text-primary)] truncate mt-1">
                Phát hiện <strong className="font-mono tabular-nums font-semibold">{inClassCount} thiết bị</strong> đang trực tuyến và tương tác trong khung giờ học.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate('/schedules');
              }}
              className="text-xs font-medium text-[var(--text-primary)] hover:underline cursor-pointer"
            >
              Báo nghỉ / Đổi giờ
            </button>
            <span className="text-xs font-medium text-[var(--warning)] hover:underline">
              Lọc xem ngay
            </span>
          </div>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <EducationStatCard
          label="Tổng số lớp"
          value={totalClasses.toString().padStart(2, '0')}
          subtext="Lớp có thiết bị liên kết"
          onClick={() => navigate('/classes')}
        />
        <EducationStatCard
          label="Tổng học sinh"
          value={totalStudents.toString().padStart(2, '0')}
          subtext="Thiết bị trong danh sách"
          onClick={() => navigate('/devices')}
        />
        <EducationStatCard
          label="Đang trực tuyến"
          value={onlineCount.toString().padStart(2, '0')}
          subtext="Đang truyền tín hiệu GPS"
          highlightColor="green"
          onClick={() => setStatusFilter('ONLINE')}
        />
        <EducationStatCard
          label="Cảnh báo giờ học"
          value={inClassCount.toString().padStart(2, '0')}
          subtext="Thiết bị mở trong giờ học"
          highlightColor={inClassCount > 0 ? 'red' : undefined}
          onClick={() => setStatusFilter('IN_CLASS')}
        />
      </div>

      {/* Interactive Map Section (Moment #1) */}
      <EducationCard
        title="Bản đồ định vị GPS học sinh"
        subtitle="Vị trí thực tế của học sinh theo lớp trên bản đồ vệ tinh và đường phố"
        icon={<MapPin className="w-4 h-4" strokeWidth={1.5} />}
        action={
          <EducationButton
            variant="ghost"
            size="sm"
            icon={<ExternalLink className="w-4 h-4" strokeWidth={1.5} />}
            iconPosition="right"
            onClick={() => navigate('/map')}
          >
            Toàn màn hình
          </EducationButton>
        }
      >
        <div className="rounded-[var(--radius-control)] overflow-hidden border border-[var(--border)]">
          <DeviceMap devices={filteredDevices} height="360px" />
        </div>
      </EducationCard>

      {/* Main Two-Column: Device Monitoring List & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Monitoring List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--surface)] p-4 rounded-[var(--radius-card)] border border-[var(--border)] shadow-[var(--shadow-card)]">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-[var(--text-primary)]">
                Danh sách giám sát học sinh
              </h2>
              <EducationBadge variant="primary">
                <span className="font-mono tabular-nums">{filteredDevices.length}</span> máy
              </EducationBadge>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="h-9 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs font-medium px-3 text-[var(--text-primary)] focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả các lớp</option>
                {availableClasses.map((c) => (
                  <option key={c} value={c}>
                    Lớp {c}
                  </option>
                ))}
              </select>

              {statusFilter !== 'ALL' && (
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className="text-xs font-medium text-[var(--danger)] hover:underline cursor-pointer"
                >
                  Xóa lọc
                </button>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search
              className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
              strokeWidth={1.5}
            />
            <input
              type="text"
              placeholder="Tìm theo tên học sinh, lớp hoặc mã máy"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 bg-[var(--surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-xs rounded-[var(--radius-control)] border border-[var(--border-strong)] pl-9 pr-4 focus:outline-none"
            />
          </div>

          {/* Device Cards */}
          {isLoading ? (
            <div className="py-16 text-center text-[var(--text-muted)] text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[var(--accent-ink)]" strokeWidth={1.5} />
              <span>Đang tải thông tin học sinh</span>
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="p-8 text-center bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] space-y-3">
              <div className="w-10 h-10 rounded-[var(--radius-control)] bg-[var(--accent-soft)] text-[var(--accent-ink)] flex items-center justify-center mx-auto">
                <Users className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <h3 className="font-semibold text-sm text-[var(--text-primary)]">
                Không tìm thấy học sinh phù hợp
              </h3>
              <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
                Hãy thử chọn lớp khác hoặc mở liên kết báo cáo trên điện thoại học sinh để bắt đầu truyền dữ liệu.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <EducationButton
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/report')}
                >
                  Mở link báo cáo
                </EducationButton>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredDevices.map((d) => {
                const isOnline = d.status === 'ONLINE';
                const inClass = Boolean(d.inClassAlert);
                const isUninstalled = Boolean(d.isUninstalled);
                const isNoNet = Boolean(d.isNoNetwork || d.networkType === 'NONE');
                const isExcused = Boolean(d.isExcused);

                return (
                  <div
                    key={d.id}
                    onClick={() => navigate(`/devices/${d.id}`)}
                    className={`p-5 rounded-[var(--radius-card)] bg-[var(--surface)] border transition-[border-color,background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer space-y-3 shadow-[var(--shadow-card)] hover:border-[var(--border-strong)] ${
                      inClass
                        ? 'border-[var(--warning-border)]'
                        : isUninstalled
                        ? 'border-[var(--danger-border)]'
                        : isExcused
                        ? 'border-[var(--accent-border)]'
                        : 'border-[var(--border)]'
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-[var(--radius-control)] bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--text-secondary)] flex items-center justify-center shrink-0">
                          <Smartphone className="w-4 h-4" strokeWidth={1.5} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-sm text-[var(--text-primary)] truncate">
                            {d.studentName || d.name}
                          </h4>
                          <p className="text-xs text-[var(--text-secondary)] truncate mt-1">
                            {d.schoolName || 'Chưa rõ trường'}{' '}
                            {d.className ? `· Lớp ${d.className}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Status Indicator */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-[11px] font-medium border shrink-0 ${
                          isUninstalled
                            ? 'bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger-border)]'
                            : isExcused
                            ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] border-[var(--accent-border)]'
                            : inClass || isNoNet
                            ? 'bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning-border)]'
                            : isOnline
                            ? 'bg-[var(--success-soft)] text-[var(--success)] border-[var(--success-border)]'
                            : 'bg-[var(--surface-muted)] text-[var(--text-muted)] border-[var(--border)]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isUninstalled
                              ? 'bg-[var(--danger)]'
                              : isExcused
                              ? 'bg-[var(--accent)]'
                              : inClass || isNoNet
                              ? 'bg-[var(--warning)]'
                              : isOnline
                              ? 'bg-[var(--success)] telemetry-live-dot'
                              : 'bg-[var(--text-muted)]'
                          }`}
                        />
                        <span>
                          {isUninstalled
                            ? 'Đã gỡ ứng dụng'
                            : isExcused
                            ? 'Nghỉ có phép'
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

                    {isExcused && (
                      <div className="text-[11px] px-2.5 py-1.5 rounded-[6px] bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--accent-ink)] truncate">
                        Đặc cách: {d.excuseReason || 'Nghỉ có phép'}
                      </div>
                    )}

                    {/* Sensor Data */}
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-[var(--border)] text-xs">
                      <div className="flex items-center gap-2 text-[var(--text-primary)]">
                        {d.charging ? (
                          <Zap className="w-4 h-4 text-[var(--warning)] shrink-0" strokeWidth={1.5} />
                        ) : (
                          <Battery className="w-4 h-4 text-[var(--success)] shrink-0" strokeWidth={1.5} />
                        )}
                        <span className="font-mono tabular-nums font-medium">
                          Pin {d.batteryLevel ?? 100}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[var(--text-primary)]">
                        <Wifi className="w-4 h-4 text-[var(--accent-ink)] shrink-0" strokeWidth={1.5} />
                        <span className="font-mono font-medium">{d.networkType || 'WIFI'}</span>
                      </div>
                    </div>

                    {/* GPS Coordinates & Google Maps Link */}
                    {d.latitude && d.longitude ? (
                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[var(--border)] text-[var(--text-secondary)]">
                        <span className="font-mono tabular-nums truncate">
                          {d.latitude.toFixed(4)}, {d.longitude.toFixed(4)}
                        </span>
                        <a
                          href={`https://www.google.com/maps?q=${d.latitude},${d.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[var(--accent-ink)] font-medium hover:underline flex items-center gap-1 shrink-0"
                        >
                          <span>Google Maps</span>
                          <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </a>
                      </div>
                    ) : (
                      <div className="text-[11px] pt-2 border-t border-[var(--border)] text-[var(--text-muted)]">
                        Chưa cập nhật tọa độ GPS
                      </div>
                    )}

                    {/* Card Footer */}
                    <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
                      <span className="text-[11px] text-[var(--text-muted)] font-mono tabular-nums">
                        {d.lastSeen
                          ? new Date(d.lastSeen).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Chưa có'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/devices/${d.id}`);
                        }}
                        className="h-7 px-3 rounded-[6px] bg-[var(--accent-soft)] hover:bg-[var(--btn-primary-bg)] text-[var(--accent-ink)] hover:text-[var(--btn-primary-text)] font-medium text-xs transition-[color,background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] flex items-center gap-1 cursor-pointer"
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

        {/* Right Column: Live Event Activity Stream */}
        <div className="space-y-4">
          <EducationCard
            title="Nhật ký lớp học mới nhất"
            subtitle="Sự kiện ghi nhận từ thiết bị học sinh"
            icon={<Clock className="w-4 h-4" strokeWidth={1.5} />}
            action={
              <button
                onClick={() => navigate('/activity')}
                className="text-xs font-medium text-[var(--accent-ink)] hover:underline cursor-pointer"
              >
                Xem tất cả
              </button>
            }
          >
            <div className="space-y-3 mt-2">
              {activities.length === 0 ? (
                <p className="text-xs text-[var(--text-muted)] text-center py-6">
                  Chưa có nhật ký hoạt động nào
                </p>
              ) : (
                activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-[var(--radius-control)] bg-[var(--surface-muted)]/60 border border-[var(--border)] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[var(--text-primary)] truncate">
                        {act.studentName || act.deviceName}
                      </span>
                      <span className="text-[11px] text-[var(--text-muted)] font-mono tabular-nums shrink-0">
                        {new Date(act.timestamp).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-[var(--text-secondary)] leading-relaxed line-clamp-2">
                      {act.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          </EducationCard>

          {/* Quick Notice Card */}
          <div className="p-5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3">
            <div className="flex items-center gap-2 text-[var(--text-primary)]">
              <Info className="w-4 h-4 text-[var(--accent-ink)]" strokeWidth={1.5} />
              <h4 className="font-semibold text-sm">Liên kết báo cáo nhanh cho lớp</h4>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Thầy/Cô có thể chia sẻ đường dẫn <span className="font-mono font-medium text-[var(--accent-ink)]">/report</span> tới phụ huynh hoặc học sinh để kết nối báo cáo định vị trực tiếp trên trình duyệt mà không cần cài thêm tệp cài đặt ngoài.
            </p>
            <EducationButton
              variant="outline"
              size="sm"
              onClick={() => navigate('/report')}
            >
              Mở trang báo cáo
            </EducationButton>
          </div>
        </div>
      </div>
    </div>
  );
};
