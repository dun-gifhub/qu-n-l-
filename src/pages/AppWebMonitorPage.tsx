import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Device, AppUsageItem, WebVisitItem } from '../types/index.ts';
import {
  Smartphone,
  Globe,
  Clock,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  RefreshCw,
  Plus,
  Play,
  ExternalLink,
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

  // Real-time 1-second live auto-refresh to detect what app or web the phone is using
  useEffect(() => {
    const timer = setInterval(async () => {
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
    }, 1000);
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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Giám Sát Ứng Dụng & Website (App & Web)
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {user?.role === 'PARENT'
              ? 'Phụ huynh theo dõi điện thoại của con đang sử dụng App gì, truy cập Web gì và chặn nội dung xấu'
              : user?.role === 'TEACHER'
              ? `Giáo viên chủ nhiệm theo dõi hoạt động sử dụng App & Web của học sinh trường ${user.schoolName}`
              : 'Admin tối thượng giám sát toàn bộ lịch sử ứng dụng và trình duyệt của mọi thiết bị học sinh'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => selectedDeviceId && loadUsageForDevice(selectedDeviceId)}
            disabled={isUsageLoading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isUsageLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/report')}
            className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer whitespace-nowrap"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Link Điện Thoại Báo Vào</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Student / Device Selector Tabs */}
      {isLoading ? (
        <div className="py-16 text-center text-xs text-slate-400">Đang tải danh sách thiết bị...</div>
      ) : devices.length === 0 ? (
        <div className="p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Smartphone className="w-8 h-8 text-indigo-500 mx-auto" />
          <h3 className="font-bold text-slate-900 dark:text-white text-sm">
            Chưa có thiết bị học sinh nào để theo dõi
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Vui lòng thêm thiết bị của con trong mục Thiết bị để bắt đầu xem lịch sử sử dụng ứng dụng và website.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {devices.map((dev) => {
              const active = dev.id === selectedDeviceId;
              return (
                <button
                  key={dev.id}
                  onClick={() => setSelectedDeviceId(dev.id)}
                  className={`py-2.5 px-4 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-2 cursor-pointer border ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 shrink-0" />
                  <span>{dev.studentName || dev.name}</span>
                  <span className={active ? 'text-indigo-200' : 'text-slate-400'}>·</span>
                  <span className={active ? 'text-indigo-100' : 'text-slate-500'}>
                    {dev.className ? `Lớp ${dev.className}` : dev.platform}
                  </span>
                </button>
              );
            })}
          </div>

          {selectedDevice && (
            <>
              {/* Live Alerts for in-class usage, uninstall, or no network */}
              {selectedDevice.inClassAlert && (
                <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center justify-between gap-3 animate-pulse">
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                    <div>
                      <div className="font-extrabold text-sm text-rose-600 dark:text-rose-400">
                        🚨 CẢNH BÁO: SỬ DỤNG ĐIỆN THOẠI TRONG GIỜ HỌC!
                      </div>
                      <div className="text-xs text-rose-700/80 dark:text-rose-300/80 mt-0.5">
                        Học sinh <strong>{selectedDevice.studentName}</strong> ({selectedDevice.className || 'Chưa rõ lớp'}) đang mở ứng dụng <strong>"{selectedDevice.currentApp}"</strong> trong khung giờ học quy định.
                      </div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-rose-600 text-white shrink-0">
                    BÁO ĐỘNG GIỜ HỌC
                  </span>
                </div>
              )}

              {selectedDevice.isUninstalled && (
                <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold flex items-center gap-2.5">
                  <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    ⚠️ <strong>NGHI VẤN GỠ APP:</strong> Thiết bị của học sinh {selectedDevice.studentName} đã ngắt kết nối hoặc gửi tín hiệu gỡ cài đặt!
                  </span>
                </div>
              )}

              {/* Real-time Live Badge */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Phát Hiện Trực Tiếp Từ Điện Thoại Học Sinh (Tự động cập nhật 1 giây/lần)
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                  ● LIVE STREAMING
                </span>
              </div>

              {/* Current Real-time Activity Banner */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Ứng dụng đang mở trên máy
                  </div>
                  <div className="mt-2 text-lg font-bold text-slate-900 dark:text-white truncate">
                    {selectedDevice.currentApp || 'Màn hình chính'}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Học sinh: {selectedDevice.studentName || selectedDevice.name} ·{' '}
                    {selectedDevice.schoolName}
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Trang Web vừa truy cập
                  </div>
                  <div className="mt-2 text-lg font-bold text-indigo-600 dark:text-indigo-400 font-mono truncate">
                    {selectedDevice.currentWebsite || 'Chưa mở trình duyệt'}
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Tổng số trang đã vào: <span className="font-mono tabular-nums">{webHistory.length}</span> trang
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Thời gian sử dụng hôm nay
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
                    {totalAppMinutes} phút
                  </div>
                  <div className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
                    Học tập: {eduMinutes}p · Giải trí/MXH: {gameSocialMinutes}p
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Chính sách kiểm soát & Chặn
                  </div>
                  <div className="mt-2 text-2xl font-extrabold text-rose-600 dark:text-rose-400 font-mono tabular-nums">
                    {appUsages.filter((a) => a.isBlocked).length +
                      webHistory.filter((w) => w.isBlocked).length}{' '}
                    mục bị chặn
                  </div>
                  <div className="mt-1 text-xs text-slate-500">
                    Chặn từ xa thời gian thực
                  </div>
                </div>
              </div>

              {/* Remote Block Form + Quick Test Buttons */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <form
                  onSubmit={handleManualBlockSubmit}
                  className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                >
                  <select
                    value={blockTargetType}
                    onChange={(e) => setBlockTargetType(e.target.value as 'APP' | 'WEB')}
                    className="px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <option value="APP">Chặn Ứng dụng (App)</option>
                    <option value="WEB">Chặn Trang Web (Domain)</option>
                  </select>
                  <input
                    type="text"
                    value={blockTargetName}
                    onChange={(e) => setBlockTargetName(e.target.value)}
                    placeholder={
                      blockTargetType === 'APP'
                        ? 'Nhập tên App cần chặn (VD: TikTok, Free Fire, Liên Quân...)'
                        : 'Nhập tên miền Web cần chặn (VD: tiktok.com, roblox.com...)'
                    }
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="submit"
                    className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold whitespace-nowrap cursor-pointer transition"
                  >
                    Áp dụng Chặn / Mở
                  </button>
                </form>

                <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Giả lập nhanh hoạt động trên điện thoại học sinh:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickSimulateActivity(
                          'TikTok',
                          'SOCIAL',
                          '🎵',
                          'https://www.tiktok.com/@trending',
                          'TikTok - Video xu hướng giải trí',
                          'SOCIAL'
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer whitespace-nowrap"
                    >
                      Thử mở TikTok
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickSimulateActivity(
                          'Liên Quân Mobile',
                          'GAME',
                          '🎮',
                          'https://lienquan.garena.vn',
                          'Garena Liên Quân Mobile',
                          'GAME'
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer whitespace-nowrap"
                    >
                      Thử chơi Liên Quân
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickSimulateActivity(
                          'Google Classroom',
                          'EDUCATION',
                          '📚',
                          'https://hocmai.vn/bai-giang',
                          'Học Mãi - Bài giảng trực tuyến',
                          'EDUCATION'
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium text-slate-800 dark:text-slate-200 cursor-pointer whitespace-nowrap"
                    >
                      Thử vào Học Tập
                    </button>
                  </div>
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm tên ứng dụng (TikTok, Zalo...) hoặc tên miền website (youtube.com, hocmai.vn...)"
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
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
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                        categoryFilter === item.key
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Two Columns: App Usage Table & Web History Table */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Mobile Apps Usage */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-base text-slate-900 dark:text-white">
                        Ứng Dụng Điện Thoại Sử Dụng ({filteredApps.length})
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Theo dõi thời lượng từng App và khóa ứng dụng gây mất tập trung
                      </p>
                    </div>
                  </div>

                  {filteredApps.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Không có ứng dụng nào khớp bộ lọc.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredApps.map((app) => (
                        <div
                          key={app.id}
                          className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                {app.appName}
                              </span>
                              <span className="text-xs text-slate-400">·</span>
                              <span className="text-xs text-slate-500">
                                {getCategoryLabel(app.category)}
                              </span>
                              {app.isRunning && !app.isBlocked && (
                                <>
                                  <span className="text-xs text-slate-400">·</span>
                                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                    Đang mở trên màn hình
                                  </span>
                                </>
                              )}
                              {app.isBlocked && (
                                <>
                                  <span className="text-xs text-slate-400">·</span>
                                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                                    Đã bị chặn
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                              Thời gian dùng: <strong className="text-slate-800 dark:text-slate-200">{app.durationMinutes} phút</strong> · Mở gần nhất:{' '}
                              {new Date(app.lastUsed).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleBlock('APP', app.appName)}
                            className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition ${
                              app.isBlocked
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-600 hover:text-white'
                                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-600 hover:text-white'
                            }`}
                          >
                            {app.isBlocked ? (
                              <>
                                <Unlock className="w-3.5 h-3.5" />
                                <span>Mở khóa App</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                <span>Chặn App</span>
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Web Browser History */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <h2 className="font-bold text-base text-slate-900 dark:text-white">
                        Lịch Sử Truy Cập Website ({filteredWeb.length})
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Các trang web học sinh đã mở trên trình duyệt Safari / Chrome
                      </p>
                    </div>
                  </div>

                  {filteredWeb.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      Không có lịch sử duyệt web nào khớp bộ lọc.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredWeb.map((web) => (
                        <div
                          key={web.id}
                          className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400 font-mono truncate">
                                {web.domain}
                              </span>
                              <span className="text-xs text-slate-400">·</span>
                              <span className="text-xs text-slate-500">
                                {getCategoryLabel(web.category)}
                              </span>
                              {web.isBlocked && (
                                <>
                                  <span className="text-xs text-slate-400">·</span>
                                  <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                                    Đã chặn tên miền
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="text-xs text-slate-800 dark:text-slate-200 truncate mt-0.5">
                              {web.pageTitle}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono tabular-nums">
                              {web.visitCount} lần truy cập · {web.durationMinutes} phút · Lúc{' '}
                              {new Date(web.timestamp).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleBlock('WEB', web.domain)}
                            className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition ${
                              web.isBlocked
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-600 hover:text-white'
                                : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-600 hover:text-white'
                            }`}
                          >
                            {web.isBlocked ? (
                              <>
                                <Unlock className="w-3.5 h-3.5" />
                                <span>Bỏ chặn Web</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                <span>Chặn Web</span>
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
