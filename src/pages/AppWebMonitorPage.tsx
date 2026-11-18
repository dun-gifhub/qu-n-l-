import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Device, AppUsageItem, WebVisitItem } from '../types/index.ts';
import {
  Smartphone,
  ShieldAlert,
  Lock,
  Unlock,
  RefreshCw,
  Search,
  CheckCircle2,
} from 'lucide-react';

interface AppWebMonitorPageProps {
  navigate: (path: string) => void;
  onOpenSimulator?: (deviceId?: string) => void;
}

export const AppWebMonitorPage: React.FC<AppWebMonitorPageProps> = ({
  navigate,
}) => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [appUsages, setAppUsages] = useState<AppUsageItem[]>([]);
  const [webHistory, setWebHistory] = useState<WebVisitItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUsageLoading, setIsUsageLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [blockTargetType, setBlockTargetType] = useState<'APP' | 'WEB'>('APP');
  const [blockTargetName, setBlockTargetName] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  const loadDevices = async () => {
    setIsLoading(true);
    const res = await api.getDevices();
    if (res.success && res.data) {
      setDevices(res.data);
      if (res.data.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(res.data[0].id);
      }
    }
    setIsLoading(false);
  };

  const loadUsageForDevice = async (devId: string) => {
    if (!devId) return;
    setIsUsageLoading(true);
    const [usageRes, devRes] = await Promise.all([
      api.getDeviceUsage(devId),
      api.getDeviceById(devId),
    ]);
    if (usageRes.success && usageRes.data) {
      setAppUsages(usageRes.data.appUsages);
      setWebHistory(usageRes.data.webHistory);
    }
    if (devRes.success && devRes.data) {
      setDevices((prev) => prev.map((d) => (d.id === devId ? devRes.data! : d)));
    }
    setIsUsageLoading(false);
  };

  useEffect(() => {
    loadDevices();
  }, []);

  useEffect(() => {
    if (selectedDeviceId) {
      loadUsageForDevice(selectedDeviceId);
    }
  }, [selectedDeviceId]);

  useEffect(() => {
    const timer = setInterval(async () => {
      if (document.hidden) return;
      try {
        const devRes = await api.getDevices();
        if (devRes.success && devRes.data) {
          setDevices(devRes.data);
        }
        if (selectedDeviceId) {
          const usageRes = await api.getDeviceUsage(selectedDeviceId);
          if (usageRes.success && usageRes.data) {
            setAppUsages(usageRes.data.appUsages);
            setWebHistory(usageRes.data.webHistory);
          }
        }
      } catch {
        // silent background poll
      }
    }, 2500);
    return () => clearInterval(timer);
  }, [selectedDeviceId]);

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId) || null;

  const handleToggleBlock = async (targetType: 'APP' | 'WEB', targetName: string) => {
    if (!selectedDeviceId || !targetName.trim()) return;
    const res = await api.toggleBlockItem(selectedDeviceId, {
      targetType,
      targetName: targetName.trim(),
    });
    if (res.success && res.data) {
      setAppUsages(res.data.appUsages);
      setWebHistory(res.data.webHistory);
      setDevices((prev) =>
        prev.map((d) => (d.id === selectedDeviceId ? res.data!.device : d))
      );
      setFeedbackMsg(res.message || 'Đã cập nhật chính sách quản lý thiết bị');
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  const handleManualBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockTargetName.trim()) return;
    await handleToggleBlock(blockTargetType, blockTargetName.trim());
    setBlockTargetName('');
  };

  const handleQuickSimulateActivity = async (
    appName: string,
    appCategory: string,
    appIcon: string,
    websiteUrl: string,
    websiteTitle: string,
    webCategory: string
  ) => {
    if (!selectedDeviceId) return;
    const res = await api.recordDeviceUsage(selectedDeviceId, {
      appName,
      appCategory,
      appIcon,
      durationMinutes: 15,
      websiteUrl,
      websiteTitle,
      webCategory,
    });
    if (res.success && res.data) {
      setAppUsages(res.data.appUsages);
      setWebHistory(res.data.webHistory);
      loadUsageForDevice(selectedDeviceId);
      setFeedbackMsg(`Đã ghi nhận: Mở ứng dụng "${appName}" và truy cập "${websiteUrl}"`);
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  const filteredApps = appUsages.filter((a) => {
    const matchSearch =
      a.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.packageName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = categoryFilter === 'ALL' || a.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const filteredWeb = webHistory.filter((w) => {
    const matchSearch =
      w.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.pageTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.url.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = categoryFilter === 'ALL' || w.category === categoryFilter;
    return matchSearch && matchCat;
  });

  const totalAppMinutes = appUsages.reduce((sum, a) => sum + a.durationMinutes, 0);
  const eduMinutes = appUsages
    .filter((a) => a.category === 'EDUCATION')
    .reduce((sum, a) => sum + a.durationMinutes, 0);
  const gameSocialMinutes = appUsages
    .filter((a) => a.category === 'GAME' || a.category === 'SOCIAL' || a.category === 'ENTERTAINMENT')
    .reduce((sum, a) => sum + a.durationMinutes, 0);

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'EDUCATION':
        return 'Học tập';
      case 'GAME':
        return 'Trò chơi';
      case 'SOCIAL':
        return 'Mạng xã hội';
      case 'ENTERTAINMENT':
        return 'Giải trí';
      default:
        return 'Tiện ích / Khác';
    }
  };

  const getBarColor = (cat: string, isBlocked: boolean) => {
    if (isBlocked) return 'bg-[var(--danger)]';
    if (cat === 'EDUCATION') return 'bg-[var(--accent)]';
    if (cat === 'GAME' || cat === 'SOCIAL' || cat === 'ENTERTAINMENT') return 'bg-[var(--warning)]';
    return 'bg-[var(--text-muted)]';
  };

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">
            Giám sát ứng dụng và website
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {user?.role === 'PARENT'
              ? 'Theo dõi điện thoại của con đang mở ứng dụng gì, truy cập trang web nào và áp dụng chặn từ xa'
              : user?.role === 'TEACHER'
              ? `Theo dõi hoạt động sử dụng ứng dụng và trình duyệt của học sinh trường ${user.schoolName}`
              : 'Giám sát toàn bộ lịch sử ứng dụng và trình duyệt của các thiết bị học sinh'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => selectedDeviceId && loadUsageForDevice(selectedDeviceId)}
            disabled={isUsageLoading}
            className="h-10 w-10 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] transition-[color,background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] flex items-center justify-center cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isUsageLoading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => navigate('/report')}
            className="h-10 px-4 rounded-[var(--radius-control)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] font-medium text-xs flex items-center gap-2 transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer whitespace-nowrap"
          >
            <Smartphone className="w-4 h-4" strokeWidth={1.5} />
            <span>Mở link báo cáo trên điện thoại</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-4 rounded-[var(--radius-card)] bg-[var(--success-soft)] border border-[var(--success-border)] text-[var(--success)] text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Student / Device Selector Tabs */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-[var(--text-muted)]">
          Đang tải danh sách thiết bị
        </div>
      ) : devices.length === 0 ? (
        <div className="p-10 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] text-center space-y-3">
          <Smartphone className="w-8 h-8 text-[var(--accent-ink)] mx-auto" strokeWidth={1.5} />
          <h3 className="font-semibold text-[var(--text-primary)] text-sm">
            Chưa có thiết bị học sinh nào để theo dõi
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
            Vui lòng thêm thiết bị của học sinh trong mục Thiết bị để bắt đầu xem lịch sử sử dụng ứng dụng và website.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {devices.map((dev) => {
              const active = dev.id === selectedDeviceId;
              const isOnline = dev.status === 'ONLINE';
              return (
                <button
                  key={dev.id}
                  onClick={() => setSelectedDeviceId(dev.id)}
                  className={`h-9 px-3 rounded-[var(--radius-control)] text-xs font-medium transition-[color,background-color,border-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] whitespace-nowrap flex items-center gap-2 cursor-pointer border ${
                    active
                      ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] border-[var(--accent-border)]'
                      : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isOnline
                        ? 'bg-[var(--success)] telemetry-live-dot'
                        : 'bg-[var(--text-muted)]'
                    }`}
                  />
                  <span>{dev.studentName || dev.name}</span>
                  <span className="text-[var(--text-muted)]">·</span>
                  <span className="text-[var(--text-muted)]">
                    {dev.className ? `Lớp ${dev.className}` : dev.platform}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedDevice && (
            <>
              {/* Live Alerts for in-class usage or uninstall */}
              {selectedDevice.inClassAlert && (
                <div className="p-4 rounded-[var(--radius-card)] bg-[var(--danger-soft)] border border-[var(--danger-border)] text-[var(--danger)] text-xs flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ShieldAlert className="w-5 h-5 shrink-0" strokeWidth={1.5} />
                    <div>
                      <div className="font-semibold text-sm">
                        Cảnh báo sử dụng điện thoại trong giờ học
                      </div>
                      <div className="text-xs text-[var(--text-primary)] mt-1">
                        Học sinh <strong className="font-semibold">{selectedDevice.studentName}</strong> ({selectedDevice.className || 'Chưa rõ lớp'}) đang mở ứng dụng <strong className="font-semibold">{selectedDevice.currentApp}</strong> trong khung giờ học quy định.
                      </div>
                    </div>
                  </div>
                  <span className="px-2 py-1 rounded-[6px] text-[11px] font-medium bg-[var(--surface)] border border-[var(--danger-border)] text-[var(--danger)] shrink-0">
                    Báo động giờ học
                  </span>
                </div>
              )}

              {selectedDevice.isUninstalled && (
                <div className="p-4 rounded-[var(--radius-card)] bg-[var(--warning-soft)] border border-[var(--warning-border)] text-[var(--warning)] text-xs font-medium flex items-center gap-3">
                  <ShieldAlert className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                  <span>
                    Nghi vấn gỡ ứng dụng: Thiết bị của học sinh {selectedDevice.studentName} đã ngắt kết nối hoặc gửi tín hiệu gỡ cài đặt
                  </span>
                </div>
              )}

              {/* Honest Polling Status Bar */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      selectedDevice.status === 'ONLINE'
                        ? 'bg-[var(--success)] telemetry-live-dot'
                        : 'bg-[var(--text-muted)]'
                    }`}
                  />
                  <span className="text-xs font-medium text-[var(--text-secondary)]">
                    Dữ liệu từ thiết bị học sinh · Tự động làm mới mỗi 2,5 giây
                  </span>
                </div>
                <span className="text-xs font-mono tabular-nums text-[var(--text-muted)]">
                  {selectedDevice.lastSeen
                    ? `Gần nhất ${new Date(selectedDevice.lastSeen).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}`
                    : 'Chưa có tín hiệu'}
                </span>
              </div>

              {/* Current Real-time Activity Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)]">
                  <div className="text-xs font-medium text-[var(--text-secondary)]">
                    Ứng dụng đang mở
                  </div>
                  <div className="mt-2 text-lg font-semibold text-[var(--text-primary)] truncate">
                    {selectedDevice.currentApp || 'Màn hình chính'}
                  </div>
                  <div className="mt-1 text-xs text-[var(--text-muted)] truncate">
                    {selectedDevice.studentName || selectedDevice.name} · {selectedDevice.schoolName}
                  </div>
                </div>

                <div className="p-5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)]">
                  <div className="text-xs font-medium text-[var(--text-secondary)]">
                    Trang web vừa truy cập
                  </div>
                  <div className="mt-2 text-lg font-semibold text-[var(--accent-ink)] font-mono truncate">
                    {selectedDevice.currentWebsite || 'Chưa mở trình duyệt'}
                  </div>
                  <div className="mt-1 text-xs text-[var(--text-muted)] font-mono tabular-nums">
                    {webHistory.length} trang trong lịch sử
                  </div>
                </div>

                <div className="p-5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)]">
                  <div className="text-xs font-medium text-[var(--text-secondary)]">
                    Thời gian sử dụng hôm nay
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-[var(--text-primary)] font-mono tabular-nums">
                    {totalAppMinutes} phút
                  </div>
                  <div className="mt-1 text-xs text-[var(--text-muted)] font-mono tabular-nums">
                    Học tập: {eduMinutes}p · Giải trí: {gameSocialMinutes}p
                  </div>
                </div>

                <div className="p-5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)]">
                  <div className="text-xs font-medium text-[var(--text-secondary)]">
                    Chính sách chặn từ xa
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-[var(--danger)] font-mono tabular-nums">
                    {appUsages.filter((a) => a.isBlocked).length +
                      webHistory.filter((w) => w.isBlocked).length}{' '}
                    mục bị chặn
                  </div>
                  <div className="mt-1 text-xs text-[var(--text-muted)]">
                    Áp dụng trực tiếp lên thiết bị
                  </div>
                </div>
              </div>

              {/* Remote Block Form + Quick Test Buttons */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <form
                  onSubmit={handleManualBlockSubmit}
                  className="lg:col-span-7 p-5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                >
                  <select
                    value={blockTargetType}
                    onChange={(e) => setBlockTargetType(e.target.value as 'APP' | 'WEB')}
                    className="h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs font-medium text-[var(--text-primary)]"
                  >
                    <option value="APP">Chặn ứng dụng (App)</option>
                    <option value="WEB">Chặn tên miền (Web)</option>
                  </select>
                  <input
                    type="text"
                    value={blockTargetName}
                    onChange={(e) => setBlockTargetName(e.target.value)}
                    placeholder={
                      blockTargetType === 'APP'
                        ? 'Nhập tên ứng dụng cần chặn'
                        : 'Nhập tên miền cần chặn'
                    }
                    className="flex-1 h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)]"
                  />
                  <button
                    type="submit"
                    className="h-10 px-4 rounded-[var(--radius-control)] bg-[var(--danger-soft)] hover:bg-[#A82834] text-[var(--danger)] hover:text-white border border-[var(--danger-border)] text-xs font-medium whitespace-nowrap cursor-pointer transition-[color,background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)]"
                  >
                    Áp dụng chặn / mở
                  </button>
                </form>

                <div className="lg:col-span-5 p-5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] flex flex-col justify-center">
                  <div className="text-xs font-medium text-[var(--text-secondary)] mb-2">
                    Mô phỏng nhanh hoạt động trên điện thoại học sinh
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickSimulateActivity(
                          'TikTok',
                          'SOCIAL',
                          'TikTok',
                          'https://www.tiktok.com/@trending',
                          'TikTok - Video xu hướng giải trí',
                          'SOCIAL'
                        )
                      }
                      className="h-8 px-3 rounded-[var(--radius-control)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-medium text-[var(--text-primary)] cursor-pointer whitespace-nowrap transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)]"
                    >
                      Thử mở TikTok
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickSimulateActivity(
                          'Liên Quân Mobile',
                          'GAME',
                          'LienQuan',
                          'https://lienquan.garena.vn',
                          'Garena Liên Quân Mobile',
                          'GAME'
                        )
                      }
                      className="h-8 px-3 rounded-[var(--radius-control)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-medium text-[var(--text-primary)] cursor-pointer whitespace-nowrap transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)]"
                    >
                      Thử chơi Liên Quân
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickSimulateActivity(
                          'Google Classroom',
                          'EDUCATION',
                          'Classroom',
                          'https://hocmai.vn/bai-giang',
                          'Học Mãi - Bài giảng trực tuyến',
                          'EDUCATION'
                        )
                      }
                      className="h-8 px-3 rounded-[var(--radius-control)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-medium text-[var(--text-primary)] cursor-pointer whitespace-nowrap transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)]"
                    >
                      Thử vào Học tập
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search
                    className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    strokeWidth={1.5}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm tên ứng dụng hoặc tên miền website"
                    className="w-full h-10 pl-9 pr-4 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)]"
                  />
                </div>

                <div className="flex items-center gap-1 p-1 bg-[var(--surface-muted)] rounded-[var(--radius-control)] border border-[var(--border)] overflow-x-auto">
                  {[
                    { key: 'ALL', label: 'Tất cả' },
                    { key: 'EDUCATION', label: 'Học tập' },
                    { key: 'SOCIAL', label: 'Mạng xã hội' },
                    { key: 'GAME', label: 'Trò chơi' },
                    { key: 'ENTERTAINMENT', label: 'Giải trí' },
                  ].map((item) => (
                    <button
                      key={item.key}
                      onClick={() => setCategoryFilter(item.key)}
                      className={`h-8 px-3 rounded-[6px] text-xs font-medium transition-[color,background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] whitespace-nowrap cursor-pointer ${
                        categoryFilter === item.key
                          ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-card)]'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Two Columns: App Usage Table & Web History Table (Moment #2) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Mobile Apps Usage */}
                <div className="bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] shadow-[var(--shadow-card)] overflow-hidden">
                  <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between gap-2">
                    <div>
                      <h2 className="font-semibold text-base text-[var(--text-primary)]">
                        Ứng dụng điện thoại sử dụng (<span className="font-mono tabular-nums">{filteredApps.length}</span>)
                      </h2>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        Tỉ lệ thời lượng dùng từng ứng dụng trong ngày và điều khiển khóa từ xa
                      </p>
                    </div>
                  </div>

                  {filteredApps.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                      Không có ứng dụng nào khớp bộ lọc
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--border)]">
                      {filteredApps.map((app) => {
                        const pct =
                          totalAppMinutes > 0
                            ? Math.min(100, Math.max(3, Math.round((app.durationMinutes / totalAppMinutes) * 100)))
                            : 0;
                        return (
                          <div
                            key={app.id}
                            className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[var(--surface-muted)]/40 transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)]"
                          >
                            <div className="min-w-0 flex-1 space-y-2">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-sm text-[var(--text-primary)] truncate">
                                  {app.appName}
                                </span>
                                <span className="text-xs text-[var(--text-muted)]">·</span>
                                <span className="text-xs text-[var(--text-secondary)]">
                                  {getCategoryLabel(app.category)}
                                </span>
                                {app.isRunning && !app.isBlocked && (
                                  <>
                                    <span className="text-xs text-[var(--text-muted)]">·</span>
                                    <span className="text-xs font-medium text-[var(--success)]">
                                      Đang mở trên màn hình
                                    </span>
                                  </>
                                )}
                                {app.isBlocked && (
                                  <>
                                    <span className="text-xs text-[var(--text-muted)]">·</span>
                                    <span className="text-xs font-medium text-[var(--danger)]">
                                      Đã bị chặn
                                    </span>
                                  </>
                                )}
                              </div>

                              {/* Proportional usage bar */}
                              <div className="w-full h-1 rounded-full bg-[var(--surface-muted)] overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${getBarColor(app.category, app.isBlocked)}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>

                              <div className="text-xs text-[var(--text-secondary)] font-mono tabular-nums">
                                <span className="text-[var(--text-primary)] font-medium">{app.durationMinutes} phút</span>
                                {' · '}
                                <span>{pct}%</span>
                                {' · '}
                                <span>
                                  Mở gần nhất{' '}
                                  {new Date(app.lastUsed).toLocaleTimeString('vi-VN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => handleToggleBlock('APP', app.appName)}
                              className={`h-8 px-3 rounded-[var(--radius-control)] text-xs font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer border transition-[color,background-color,border-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${
                                app.isBlocked
                                  ? 'bg-[var(--surface-muted)] border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--success-soft)] hover:text-[var(--success)] hover:border-[var(--success-border)]'
                                  : 'bg-[var(--danger-soft)] border-[var(--danger-border)] text-[var(--danger)] hover:bg-[#A82834] hover:text-white'
                              }`}
                            >
                              {app.isBlocked ? (
                                <>
                                  <Unlock className="w-4 h-4" strokeWidth={1.5} />
                                  <span>Mở khóa</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-4 h-4" strokeWidth={1.5} />
                                  <span>Chặn app</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right: Web Browser History */}
                <div className="bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] shadow-[var(--shadow-card)] overflow-hidden">
                  <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between gap-2">
                    <div>
                      <h2 className="font-semibold text-base text-[var(--text-primary)]">
                        Lịch sử truy cập website (<span className="font-mono tabular-nums">{filteredWeb.length}</span>)
                      </h2>
                      <p className="text-xs text-[var(--text-secondary)] mt-1">
                        Các tên miền học sinh đã mở trên trình duyệt di động
                      </p>
                    </div>
                  </div>

                  {filteredWeb.length === 0 ? (
                    <div className="p-8 text-center text-xs text-[var(--text-muted)]">
                      Không có lịch sử duyệt web nào khớp bộ lọc
                    </div>
                  ) : (
                    <div className="divide-y divide-[var(--border)]">
                      {filteredWeb.map((web) => (
                        <div
                          key={web.id}
                          className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-[var(--surface-muted)]/40 transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)]"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-sm text-[var(--accent-ink)] font-mono truncate">
                                {web.domain}
                              </span>
                              <span className="text-xs text-[var(--text-muted)]">·</span>
                              <span className="text-xs text-[var(--text-secondary)]">
                                {getCategoryLabel(web.category)}
                              </span>
                              {web.isBlocked && (
                                <>
                                  <span className="text-xs text-[var(--text-muted)]">·</span>
                                  <span className="text-xs font-medium text-[var(--danger)]">
                                    Đã chặn tên miền
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="text-xs text-[var(--text-primary)] truncate mt-1">
                              {web.pageTitle}
                            </div>
                            <div className="text-xs text-[var(--text-secondary)] mt-1 font-mono tabular-nums">
                              {web.visitCount} lần truy cập · {web.durationMinutes} phút · Lúc{' '}
                              {new Date(web.timestamp).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleBlock('WEB', web.domain)}
                            className={`h-8 px-3 rounded-[var(--radius-control)] text-xs font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer border transition-[color,background-color,border-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${
                              web.isBlocked
                                ? 'bg-[var(--surface-muted)] border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--success-soft)] hover:text-[var(--success)] hover:border-[var(--success-border)]'
                                : 'bg-[var(--danger-soft)] border-[var(--danger-border)] text-[var(--danger)] hover:bg-[#A82834] hover:text-white'
                            }`}
                          >
                            {web.isBlocked ? (
                              <>
                                <Unlock className="w-4 h-4" strokeWidth={1.5} />
                                <span>Bỏ chặn</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-4 h-4" strokeWidth={1.5} />
                                <span>Chặn web</span>
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};
