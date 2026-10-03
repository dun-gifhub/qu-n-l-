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
  Play,
  Globe,
  BellRing,
  WifiOff,
  Trash2,
  GraduationCap,
  ChevronDown,
  ExternalLink,
  MapPin,
  Navigation,
  Copy,
  Check,
  ShieldCheck,
  Clock,
  Layers,
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

  // Navigation mode: 'devices' or 'movement_history'
  const [viewMode, setViewMode] = useState<'devices' | 'movement_history'>('devices');

  // Movement history state (Chỉ thêm không bớt - Đồng bộ Neon PostgreSQL)
  const [movementLocations, setMovementLocations] = useState<EnrichedMovementLocation[]>([]);
  const [movementLoading, setMovementLoading] = useState(false);
  const [movementRange, setMovementRange] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [selectedMovementDeviceId, setSelectedMovementDeviceId] = useState<string>('ALL');
  const [copiedGps, setCopiedGps] = useState(false);

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

  const [isClearingAll, setIsClearingAll] = useState(false);

  const handleClearAllDevices = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn LÀM TRỐNG TẤT CẢ thiết bị và toàn bộ dữ liệu định vị/hoạt động không?')) {
      return;
    }
    setIsClearingAll(true);
    try {
      const res = await api.clearAllDevices();
      if (res.success) {
        setDevices([]);
        setMovementLocations([]);
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
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Top Header */}
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
          · Đồng bộ Neon PostgreSQL vĩnh cửu · Bản đồ Google Maps vệ tinh
        </p>
      </div>

      {/* Navigation Switcher: [ Danh Sách Thiết Bị ] & [ Lịch Sử Di Chuyển (Chỉ Thêm Không Bớt) ] */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setViewMode('devices')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            viewMode === 'devices'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Danh Sách Giám Sát ({totalDevices})</span>
        </button>

        <button
          onClick={() => setViewMode('movement_history')}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            viewMode === 'movement_history'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
          }`}
        >
          <Navigation className="w-4 h-4 text-emerald-400" />
          <span>Lịch Sử Di Chuyển (Chỉ Thêm Không Bớt)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
            {movementLocations.length > 0 ? `${movementLocations.length} điểm GPS` : 'Vĩnh cửu'}
          </span>
        </button>

        <div className="flex items-center gap-2 ml-auto">
          {totalDevices > 0 && (
            <button
              onClick={handleClearAllDevices}
              disabled={isClearingAll}
              className="py-2 px-3 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-900/50 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Làm trống tất cả thiết bị trên hệ thống"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isClearingAll ? 'Đang xóa...' : 'Làm trống tất cả'}</span>
            </button>
          )}
          <button
            onClick={onOpenAddDevice}
            className="py-2 px-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Đăng ký thiết bị</span>
          </button>
        </div>
      </div>

      {/* VIEW MODE 1: DANH SÁCH THIẾT BỊ GIÁM SÁT */}
      {viewMode === 'devices' && (
        <div className="space-y-4">
          {/* Emergency Banner */}
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

          {/* Status Counters Bar */}
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

          {/* School, Grade & Class Filters */}
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

          {/* Search Bar */}
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

          {/* Device Cards Grid */}
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
                  Mở link báo cáo trên điện thoại học sinh hoặc đăng ký thiết bị mới để bắt đầu giám sát App & Web.
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

                    {/* Card Footer: Lịch sử di chuyển & Chi tiết */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMovementDeviceId(device.id);
                          setViewMode('movement_history');
                        }}
                        className="py-1 px-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                        title="Xem lịch sử di chuyển (chỉ thêm không bớt) của thiết bị này"
                      >
                        <Navigation className="w-3 h-3 text-indigo-500" />
                        <span>Lịch sử di chuyển</span>
                      </button>

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
      )}

      {/* VIEW MODE 2: LỊCH SỬ DI CHUYỂN (CHỈ THÊM KHÔNG BỚT) */}
      {viewMode === 'movement_history' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          {/* Reassurance Guarantee Card */}
          <div className="p-4 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <div className="font-black text-sm text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
                  <span>CƠ CHẾ LƯU TRỮ LỊCH SỬ DI CHUYỂN: CHỈ THÊM KHÔNG BỚT</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30">
                    Neon PostgreSQL Synced
                  </span>
                </div>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-1">
                  Hệ thống bảo toàn vĩnh viễn toàn bộ các điểm tọa độ GPS gửi về từ điện thoại. Lộ trình di chuyển tích lũy liên tục theo thời gian, không bao giờ bị cắt ngắn hoặc xóa bớt.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={copyAllGpsData}
                disabled={movementLocations.length === 0}
                className="py-2 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs disabled:opacity-50"
              >
                {copiedGps ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedGps ? 'Đã sao chép' : 'Sao chép GPS'}</span>
              </button>
              <button
                onClick={loadMovementHistory}
                disabled={movementLoading}
                className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 text-indigo-700 dark:text-indigo-300 transition cursor-pointer shadow-2xs"
                title="Làm mới lịch sử"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${movementLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Filter Bar: Chọn Thiết Bị & Khung Thời Gian */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Device Filter */}
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 shrink-0">
                Thiết bị / Học sinh:
              </span>
              <div className="relative flex-1 sm:w-64">
                <select
                  value={selectedMovementDeviceId}
                  onChange={(e) => setSelectedMovementDeviceId(e.target.value)}
                  className="w-full appearance-none pl-3.5 pr-8 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">📍 Tất cả thiết bị ({devices.length} máy)</option>
                  {devices.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.studentName || d.name} {d.className ? `(Lớp ${d.className})` : ''} - {d.platform}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Time Range Filter: all, today, 7days, 30days */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Khoảng thời gian:
              </span>
              {[
                { key: 'all', label: 'Toàn bộ (Chỉ thêm không bớt)' },
                { key: 'today', label: 'Hôm nay' },
                { key: '7days', label: '7 ngày qua' },
                { key: '30days', label: '30 ngày qua' },
              ].map((r) => (
                <button
                  key={r.key}
                  onClick={() => setMovementRange(r.key as any)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                    movementRange === r.key
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Counter */}
            <div className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
              📍 {movementLocations.length} điểm GPS ghi nhận
            </div>
          </div>

          {/* Interactive Route Map */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="px-5 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Bản Đồ Lộ Trình Di Chuyển Học Sinh (Google Maps Vệ Tinh / Hybrid / Đường Phố)
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {selectedMovementDeviceId === 'ALL'
                  ? 'Hiển thị lộ trình tất cả các máy'
                  : 'Lộ trình chi tiết thiết bị được chọn'}
              </span>
            </div>
            <DeviceMap historyLocations={movementLocations} height="480px" />
          </div>

          {/* Detailed Movement Breadcrumbs Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Nhật Ký Tọa Độ Di Chuyển Chi Tiết</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-bold">
                    Chỉ thêm không bớt
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bảo toàn dữ liệu lịch sử trên Neon PostgreSQL
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {movementLocations.length} bản ghi GPS
              </span>
            </div>

            {movementLocations.length === 0 ? (
              <div className="py-16 px-4 text-center text-xs text-slate-400 space-y-2">
                <Navigation className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="font-bold text-slate-600 dark:text-slate-300">Chưa có dữ liệu di chuyển cho bộ lọc này.</p>
                <p className="text-[11px] text-slate-500">Mở ứng dụng hoặc link báo cáo trên điện thoại để truyền tọa độ GPS.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-5">STT</th>
                      <th className="py-3 px-5">Học sinh / Thiết bị</th>
                      <th className="py-3 px-5">Lớp / Trường</th>
                      <th className="py-3 px-5">Thời gian</th>
                      <th className="py-3 px-5">Vĩ độ (Lat)</th>
                      <th className="py-3 px-5">Kinh độ (Lng)</th>
                      <th className="py-3 px-5">Sai số</th>
                      <th className="py-3 px-5">Vị trí điểm</th>
                      <th className="py-3 px-5 text-right">Xem bản đồ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono tabular-nums">
                    {movementLocations.map((loc, idx) => (
                      <tr key={loc.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-5 text-slate-400">#{idx + 1}</td>
                        <td className="py-3 px-5 font-sans font-bold text-slate-900 dark:text-white">
                          <div>{loc.studentName || 'Học sinh'}</div>
                          <div className="text-[10px] text-slate-400 font-normal font-mono">{loc.deviceName || loc.deviceId}</div>
                        </td>
                        <td className="py-3 px-5 font-sans text-slate-600 dark:text-slate-300">
                          {loc.className ? `Lớp ${loc.className}` : ''}{' '}
                          {loc.schoolName ? `· ${loc.schoolName}` : ''}
                        </td>
                        <td className="py-3 px-5 text-slate-800 dark:text-slate-200 font-sans">
                          {new Date(loc.timestamp).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3 px-5 font-bold text-slate-900 dark:text-white">
                          {loc.latitude.toFixed(6)}
                        </td>
                        <td className="py-3 px-5 font-bold text-slate-900 dark:text-white">
                          {loc.longitude.toFixed(6)}
                        </td>
                        <td className="py-3 px-5 text-slate-500">
                          {loc.accuracy ? `±${Math.round(loc.accuracy)}m` : '±10m'}
                        </td>
                        <td className="py-3 px-5 font-sans">
                          {idx === 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                              Vị trí mới nhất
                            </span>
                          ) : idx === movementLocations.length - 1 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                              Điểm xuất phát
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              Dọc lộ trình
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-5 text-right font-sans">
                          <a
                            href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            <span>Google Maps</span>
                            <ExternalLink className="w-3 h-3" />
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
