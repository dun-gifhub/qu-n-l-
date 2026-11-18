import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Device } from '../../types/index.ts';
import { EducationCard } from '../../components/education/EducationCard.tsx';
import { EducationButton } from '../../components/education/EducationButton.tsx';
import { EducationBadge } from '../../components/education/EducationBadge.tsx';
import { DeviceMap } from '../../components/Map/DeviceMap.tsx';
import {
  Smartphone,
  Battery,
  MapPin,
  Clock,
  ExternalLink,
  Zap,
  ShieldCheck,
} from 'lucide-react';

interface StudentDashboardPageProps {
  navigate: (path: string) => void;
}

export const StudentDashboardPage: React.FC<StudentDashboardPageProps> = ({ navigate }) => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getDevices().then((devRes) => {
      if (devRes.success && devRes.data) {
        setDevices(devRes.data);
      }
      setIsLoading(false);
    });
  }, []);

  const myDevice = devices[0] || null;
  const isOnline = myDevice?.status === 'ONLINE';
  const screenMinutes = myDevice?.screenTimeMinutes ?? 0;
  const dailyBudgetMinutes = 180;
  const screenUsageRatio = myDevice
    ? Math.min(100, Math.round((screenMinutes / dailyBudgetMinutes) * 100))
    : 0;
  const inClassAlertCount = devices.filter((d) => d.inClassAlert).length;

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Contextual Header */}
      <div className="rounded-[var(--radius-panel)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded-[6px] bg-[var(--surface-muted)] border border-[var(--border)] font-medium text-[var(--text-primary)]">
              Lớp {user?.className || '10A1'} · {user?.schoolName || 'THPT Chuyên'}
            </span>
            {myDevice && (
              <EducationBadge variant={isOnline ? 'success' : 'neutral'}>
                {isOnline ? 'Thiết bị đang kết nối' : 'Thiết bị ngoại tuyến'}
              </EducationBadge>
            )}
          </div>

          <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">
            Tổng quan thiết bị của {user?.studentName || user?.name || 'học sinh'}
          </h1>

          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Theo dõi trạng thái kết nối, mức pin, thời lượng sử dụng màn hình hôm nay và vị trí GPS chia sẻ với phụ huynh và nhà trường.
          </p>
        </div>

        <div className="shrink-0">
          <EducationButton
            variant="primary"
            icon={<Smartphone className="w-4 h-4" strokeWidth={1.5} />}
            onClick={() => navigate('/report')}
          >
            Mở báo cáo trên điện thoại
          </EducationButton>
        </div>
      </div>

      {/* Real Telemetry Summary Section */}
      <EducationCard
        title="Thời lượng sử dụng và tuân thủ giờ học"
        subtitle={
          myDevice
            ? 'Số liệu thực tế đồng bộ từ thiết bị đang liên kết'
            : 'Chưa có thiết bị liên kết để thống kê dữ liệu thực tế'
        }
        icon={<ShieldCheck className="w-4 h-4" strokeWidth={1.5} />}
        accentBorder
      >
        {isLoading ? (
          <div className="py-6 text-xs text-[var(--text-muted)]">Đang tải thông số thiết bị</div>
        ) : !myDevice ? (
          <div className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-[var(--text-secondary)]">
            <span>Tài khoản này chưa có thiết bị truyền dữ liệu. Mở trang báo cáo trên điện thoại để liên kết.</span>
            <EducationButton variant="outline" size="sm" onClick={() => navigate('/report')}>
              Liên kết thiết bị
            </EducationButton>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                Thời gian sáng màn hình hôm nay so với ngưỡng {dailyBudgetMinutes} phút
              </span>
              <span className="text-base font-semibold text-[var(--accent-ink)] font-mono tabular-nums">
                {screenMinutes} / {dailyBudgetMinutes} phút
              </span>
            </div>

            <div className="w-full h-2 rounded-full bg-[var(--surface-muted)] overflow-hidden border border-[var(--border)]">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-[var(--duration-base)] ease-[var(--ease-standard)]"
                style={{ width: `${screenUsageRatio}%` }}
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-[var(--radius-control)] bg-[var(--surface-muted)]/60 border border-[var(--border)]">
                <span className="text-[var(--text-secondary)] block">Thời lượng hôm nay</span>
                <strong className="text-sm font-semibold font-mono tabular-nums text-[var(--text-primary)] mt-1 block">
                  {screenMinutes} phút
                </strong>
              </div>
              <div className="p-3 rounded-[var(--radius-control)] bg-[var(--surface-muted)]/60 border border-[var(--border)]">
                <span className="text-[var(--text-secondary)] block">Ứng dụng hiện tại</span>
                <strong className="text-sm font-semibold text-[var(--text-primary)] mt-1 block truncate">
                  {myDevice.currentApp || 'Màn hình chính'}
                </strong>
              </div>
              <div className="p-3 rounded-[var(--radius-control)] bg-[var(--surface-muted)]/60 border border-[var(--border)]">
                <span className="text-[var(--text-secondary)] block">Cảnh báo giờ học</span>
                <strong
                  className={`text-sm font-semibold font-mono tabular-nums mt-1 block ${
                    inClassAlertCount > 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]'
                  }`}
                >
                  {inClassAlertCount} lần
                </strong>
              </div>
              <div className="p-3 rounded-[var(--radius-control)] bg-[var(--surface-muted)]/60 border border-[var(--border)]">
                <span className="text-[var(--text-secondary)] block">Trạng thái định vị</span>
                <strong
                  className={`text-sm font-semibold mt-1 block ${
                    myDevice.isUninstalled
                      ? 'text-[var(--danger)]'
                      : isOnline
                      ? 'text-[var(--success)]'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {myDevice.isUninstalled
                    ? 'Đã ngắt kết nối'
                    : isOnline
                    ? 'Đang truyền GPS'
                    : 'Ngoại tuyến'}
                </strong>
              </div>
            </div>
          </div>
        )}
      </EducationCard>

      {/* Device Status & Live Location */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <EducationCard
          title="Thiết bị điện thoại học sinh"
          subtitle="Tình trạng phần cứng và mạng kết nối"
          icon={<Smartphone className="w-4 h-4" strokeWidth={1.5} />}
        >
          {myDevice ? (
            <div className="space-y-4">
              <div className="p-4 rounded-[var(--radius-control)] bg-[var(--surface-muted)]/60 border border-[var(--border)] space-y-3 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[var(--text-secondary)]">Tên thiết bị</span>
                  <span className="font-semibold text-[var(--text-primary)]">{myDevice.name}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[var(--text-secondary)]">Trạng thái</span>
                  <EducationBadge variant={isOnline ? 'success' : 'neutral'}>
                    {isOnline ? 'Trực tuyến' : 'Ngoại tuyến'}
                  </EducationBadge>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[var(--text-secondary)]">Mức pin</span>
                  <span className="font-mono tabular-nums font-medium text-[var(--text-primary)] flex items-center gap-1.5">
                    {myDevice.charging ? (
                      <Zap className="w-4 h-4 text-[var(--warning)]" strokeWidth={1.5} />
                    ) : (
                      <Battery className="w-4 h-4 text-[var(--success)]" strokeWidth={1.5} />
                    )}
                    {myDevice.batteryLevel ?? 100}% {myDevice.charging ? '· Đang sạc' : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[var(--text-secondary)]">Mạng kết nối</span>
                  <span className="font-mono font-medium text-[var(--accent-ink)]">
                    {myDevice.networkType || 'WIFI'}
                  </span>
                </div>
              </div>

              {myDevice.latitude && myDevice.longitude && (
                <div className="p-4 rounded-[var(--radius-control)] bg-[var(--accent-soft)] border border-[var(--accent-border)] flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-[var(--text-secondary)] block">
                      Tọa độ GPS hiện tại
                    </span>
                    <span className="font-mono tabular-nums font-medium text-[var(--accent-ink)]">
                      {myDevice.latitude.toFixed(4)}, {myDevice.longitude.toFixed(4)}
                    </span>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${myDevice.latitude},${myDevice.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="h-8 px-3 rounded-[var(--radius-control)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] font-medium text-xs inline-flex items-center gap-1.5 transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] shrink-0"
                  >
                    <span>Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-[var(--text-secondary)] space-y-3">
              <p>Chưa có thiết bị nào liên kết với tài khoản này.</p>
              <EducationButton
                variant="primary"
                size="sm"
                onClick={() => navigate('/report')}
              >
                Kết nối thiết bị
              </EducationButton>
            </div>
          )}
        </EducationCard>

        {/* Live GPS Map (Moment #1) */}
        <div className="lg:col-span-2">
          <EducationCard
            title="Bản đồ định vị GPS trực tuyến"
            subtitle="Vị trí thực tế được truyền tới giáo viên và phụ huynh"
            icon={<MapPin className="w-4 h-4" strokeWidth={1.5} />}
            action={
              <EducationButton
                variant="ghost"
                size="sm"
                onClick={() => navigate('/map')}
              >
                Mở rộng
              </EducationButton>
            }
          >
            <div className="rounded-[var(--radius-control)] overflow-hidden border border-[var(--border)]">
              <DeviceMap devices={devices} height="320px" />
            </div>
          </EducationCard>
        </div>
      </div>
    </div>
  );
};
