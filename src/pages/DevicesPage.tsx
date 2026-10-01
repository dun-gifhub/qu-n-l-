import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Device } from '../types/index.ts';
import {
  Smartphone,
  Plus,
  Search,
  RefreshCw,
  Battery,
  Zap,
  Wifi,
  ArrowRight,
  Play,
  Globe,
  BellRing,
  WifiOff,
  Trash2,
  GraduationCap,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';

interface DevicesPageProps {
  navigate: (path: string) => void;
  onOpenAddDevice: () => void;
  onOpenSimulator?: (deviceId?: string) => void;
}

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

  const loadDevices = async () => {
    const res = await api.getDevices();
    if (res.success && res.data) {
      setDevices(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadDevices();
    const interval = setInterval(loadDevices, 1000);
    return () => clearInterval(interval);
  }, [user?.id]);

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
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Header (Image 1) */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Giám Sát Thiết Bị Học Sinh
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Tự làm mới: 1s
          </span>
        </div>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Máy chủ tiếp nhận:{' '}
          <strong className="text-indigo-600 dark:text-indigo-400 font-mono">
            https://qu-n-l-s1k1.onrender.com
          </strong>{' '}
          · Bản đồ Google Maps vệ tinh trực tuyến
        </p>
      </div>

      {/* Banner Cảnh Báo Khẩn Cấp (Image 1) */}
      {uninstalledCount > 0 ? (
        <div
          onClick={() => setSelectedStatusFilter('UNINSTALLED')}
          className="p-3.5 px-4 rounded-2xl bg-amber-50 dark:bg-[#1c130d] border border-amber-300 dark:border-amber-800/80 flex items-center justify-between cursor-pointer hover:bg-amber-100/60 dark:hover:bg-amber-950/70 transition shadow-xs"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs text-amber-900 dark:text-amber-400 tracking-wide uppercase">
                NGHI VẤN HỌC SINH GỠ ỨNG DỤNG!
              </div>
              <div className="text-[11px] text-amber-700 dark:text-amber-200/90 mt-0.5 truncate">
                Có <strong>{uninstalledCount} điện thoại</strong> vừa gửi tín hiệu gỡ app hoặc ngắt báo cáo.
              </div>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 flex items-center gap-1 shrink-0 ml-3">
            Lọc xem ↗
          </span>
        </div>
      ) : inClassCount > 0 ? (
        <div
          onClick={() => setSelectedStatusFilter('IN_CLASS')}
          className="p-3.5 px-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-center justify-between cursor-pointer hover:bg-rose-100/60 dark:hover:bg-rose-950/70 transition shadow-xs"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold animate-pulse shrink-0">
              <BellRing className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="font-bold text-xs text-rose-900 dark:text-rose-200">
                CẢNH BÁO SỬ DỤNG TRONG GIỜ HỌC!
              </div>
              <div className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5 truncate">
                Phát hiện <strong>{inClassCount} thiết bị</strong> đang online và hoạt động trong khung giờ học.
              </div>
            </div>
          </div>
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 shrink-0 ml-3">
            Lọc xem ↗
          </span>
        </div>
      ) : null}

      {/* Status Counters Bar (Image 2) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() => setSelectedStatusFilter('ALL')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-xs ${
            selectedStatusFilter === 'ALL'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="text-[11px] font-medium opacity-80">Tổng Thiết Bị</div>
          <div className="text-xl md:text-2xl font-black mt-1">{totalDevices}</div>
          <div className="text-[10px] opacity-75 mt-0.5">Tất cả học sinh</div>
        </div>

        <div
          onClick={() => setSelectedStatusFilter('ONLINE')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-xs ${
            selectedStatusFilter === 'ONLINE'
              ? 'bg-emerald-600 text-white border-emerald-600'
              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="text-[11px] font-medium opacity-80 flex items-center gap-1">
            <span>Đang Online</span>
          </div>
          <div className="text-xl md:text-2xl font-black mt-1 text-emerald-500 dark:text-emerald-400">
            {onlineCount}
          </div>
          <div className="text-[10px] opacity-75 mt-0.5">Đang truyền GPS</div>
        </div>

        <div
          onClick={() => setSelectedStatusFilter('IN_CLASS')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-xs ${
            selectedStatusFilter === 'IN_CLASS'
              ? 'bg-rose-600 text-white border-rose-600'
              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="text-[11px] font-medium opacity-80 flex items-center gap-1 text-rose-500">
            <BellRing className="w-3.5 h-3.5" />
            <span>Dùng Giờ Học</span>
          </div>
          <div className="text-xl md:text-2xl font-black mt-1 text-rose-600 dark:text-rose-400">
            {inClassCount}
          </div>
          <div className="text-[10px] opacity-75 mt-0.5">Cảnh báo giờ học</div>
        </div>

        <div
          onClick={() => setSelectedStatusFilter('NO_NET')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-xs ${
            selectedStatusFilter === 'NO_NET'
              ? 'bg-orange-600 text-white border-orange-600'
              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="text-[11px] font-medium opacity-80 flex items-center gap-1 text-orange-500">
            <WifiOff className="w-3.5 h-3.5" />
            <span>Mất Mạng</span>
          </div>
          <div className="text-xl md:text-2xl font-black mt-1 text-orange-500">
            {noNetCount}
          </div>
          <div className="text-[10px] opacity-75 mt-0.5">Không có mạng</div>
        </div>

        <div
          onClick={() => setSelectedStatusFilter('UNINSTALLED')}
          className={`p-4 rounded-2xl border transition cursor-pointer shadow-xs ${
            selectedStatusFilter === 'UNINSTALLED'
              ? 'bg-red-700 text-white border-red-700'
              : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-800'
          }`}
        >
          <div className="text-[11px] font-medium opacity-80 flex items-center gap-1 text-red-500">
            <Trash2 className="w-3.5 h-3.5" />
            <span>Nghi Vấn Gỡ</span>
          </div>
          <div className="text-xl md:text-2xl font-black mt-1 text-red-600">
            {uninstalledCount}
          </div>
          <div className="text-[10px] opacity-75 mt-0.5">Ngừng theo dõi</div>
        </div>
      </div>

      {/* Hierarchy Filter Bar: Khối & Lớp (Image 2) */}
      <div className="p-3.5 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="font-bold text-xs text-slate-900 dark:text-white">
            Phân Loại Theo Trường, Khối & Lớp:
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Grade Filter */}
          <div className="relative">
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="appearance-none pl-3.5 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả các khối</option>
              {availableGrades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Class Filter */}
          <div className="relative">
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="appearance-none pl-3.5 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả các lớp</option>
              {availableClasses.map((c) => (
                <option key={c} value={c}>
                  Lớp {c}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên học sinh, trường học, mã máy..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white px-2 py-1 cursor-pointer shrink-0"
          >
            Xóa tìm kiếm
          </button>
        )}
      </div>

      {/* Device Cards Grid - Giữ những mục chuẩn trong ảnh tại phần danh sách giám sát */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
          <span>Đang tải danh sách giám sát...</span>
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center max-w-lg mx-auto space-y-4 my-8">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Chưa có thiết bị nào trong danh sách
            </h3>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Mở link báo cáo trên điện thoại học sinh hoặc đăng ký thiết bị mới để bắt đầu giám sát vị trí GPS.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={() => navigate('/report')}
              className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition cursor-pointer"
            >
              📱 Mở link trên điện thoại
            </button>
            <button
              onClick={onOpenAddDevice}
              className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer"
            >
              + Đăng ký thiết bị
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
            const timeStr = device.lastSeen
              ? new Date(device.lastSeen).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'N/A';

            return (
              <div
                key={device.id}
                onClick={() => navigate(`/devices/${device.id}`)}
                className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition cursor-pointer space-y-2.5 shadow-xs hover:border-indigo-500/80 ${
                  inClass
                    ? 'border-rose-400 dark:border-rose-700 bg-rose-50/20'
                    : isUninstalled
                    ? 'border-red-500 dark:border-red-700 bg-red-50/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                        inClass
                          ? 'bg-rose-500 text-white'
                          : isUninstalled
                          ? 'bg-red-600 text-white'
                          : isOnline
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {device.studentName || device.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {device.schoolName || 'Chưa rõ trường'}{' '}
                        {device.className ? `· Lớp ${device.className}` : ''}{' '}
                        {device.grade ? `(${device.grade})` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      isUninstalled
                        ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                        : inClass
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 animate-pulse'
                        : isNoNet
                        ? 'bg-orange-500/20 text-orange-600 border border-orange-500/30'
                        : isOnline
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                    }`}
                  >
                    {isUninstalled
                      ? '⚠️ ĐÃ GỠ APP'
                      : inClass
                      ? '🚨 DÙNG GIỜ HỌC'
                      : isNoNet
                      ? '🔴 MẤT MẠNG'
                      : isOnline
                      ? '🟢 ONLINE'
                      : 'OFFLINE'}
                  </span>
                </div>

                {/* Sensor Data: Pin & Kiểu Mạng */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    {device.charging ? (
                      <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    ) : (
                      <Battery className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    )}
                    <span>Pin: {device.batteryLevel ?? 100}% {device.charging ? '(Đang sạc)' : ''}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                    <Wifi className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Mạng: {device.networkType || 'WIFI'}</span>
                  </div>
                </div>

                {/* Google Maps GPS Coordinates */}
                {device.latitude && device.longitude ? (
                  <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800/80 text-slate-400">
                    <span className="font-mono truncate">
                      GPS: {device.latitude.toFixed(4)}, {device.longitude.toFixed(4)}
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${device.latitude},${device.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-0.5 shrink-0"
                    >
                      <span>Google Maps</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                ) : (
                  <div className="text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800/80 text-slate-400">
                    GPS: Chưa có tọa độ
                  </div>
                )}

                {/* Card Footer: Cập nhật & Chi tiết */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono tabular-nums">
                    Cập nhật: {timeStr}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/devices/${device.id}`);
                    }}
                    className="py-1 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white font-bold text-xs text-slate-800 dark:text-slate-200 transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <span>Chi tiết</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
