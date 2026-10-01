import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Device, ActivityEvent } from '../types/index.ts';
import { DeviceMap } from '../components/Map/DeviceMap.tsx';
import {
  Smartphone,
  Radio,
  Wifi,
  Battery,
  Zap,
  Clock,
  ArrowRight,
  Plus,
  RefreshCw,
  AlertCircle,
  Copy,
  CheckCircle2,
  ExternalLink,
  Globe,
  MapPin,
  QrCode,
  Shield,
  Activity as ActivityIcon,
  AlertTriangle,
  WifiOff,
  Trash2,
  BellRing,
  School,
  GraduationCap,
  Users,
  Check,
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
  onOpenAddDevice,
}) => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [tick, setTick] = useState(0);

  const reportUrl = typeof window !== 'undefined' && window.location?.origin
    ? `${window.location.origin}/report`
    : 'https://qu-n-l-s1k1.onrender.com/report';

  // Filters
  const [selectedSchool, setSelectedSchool] = useState<string>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<
    'ALL' | 'ONLINE' | 'IN_CLASS' | 'NO_NET' | 'UNINSTALLED'
  >('ALL');

  // Background smooth refresh without page flicker
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
    } catch (err: any) {
      if (isInitial) setErrorMsg(err.message || 'Lỗi tải dữ liệu');
    } finally {
      if (isInitial) setIsLoading(false);
      isFetchingRef.current = false;
      setTick((t) => (t + 1) % 60);
    }
  };

  useEffect(() => {
    fetchLiveData(true);
    // Smart auto-refresh: 2.5s when tab is active, paused when tab is hidden to save battery & network
    const interval = setInterval(() => {
      if (!document.hidden) {
        fetchLiveData(false);
      }
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(reportUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  };

  // Distinct schools, grades, and classes for dropdowns
  const availableSchools = Array.from(
    new Set(devices.map((d) => d.schoolName).filter(Boolean) as string[])
  );
  const availableGrades = Array.from(
    new Set(devices.map((d) => d.grade).filter(Boolean) as string[])
  ).sort();
  const availableClasses = Array.from(
    new Set(devices.map((d) => d.className).filter(Boolean) as string[])
  ).sort();

  // Filtered devices based on user selections
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

  // Alert counters
  const totalDevices = devices.length;
  const onlineCount = devices.filter((d) => d.status === 'ONLINE').length;
  const inClassCount = devices.filter((d) => d.inClassAlert).length;
  const noNetCount = devices.filter((d) => d.isNoNetwork || d.networkType === 'NONE').length;
  const uninstalledCount = devices.filter((d) => d.isUninstalled).length;

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Page Header (Image 1) */}
      <div>
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Giám Sát Thiết Bị Học Sinh
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
            Tự làm mới: 2.5s
          </span>
        </div>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Máy chủ tiếp nhận:{' '}
          <strong className="text-indigo-600 dark:text-indigo-400 font-mono">
            https://qu-n-l-s1k1.onrender.com
          </strong>{' '}
          · Giám sát App & Website học sinh trực tuyến
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

      {/* Live App & Web Monitor Overview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                Giám Sát Ứng Dụng & Website Trực Tiếp (Live App & Web)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Phát hiện trực tiếp ứng dụng đang mở, trang web học sinh đang vào truyền về máy chủ
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/app-usage')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <span>Quản lý chi tiết App & Web</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          {filteredDevices.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Chưa có thiết bị nào đang kết nối để theo dõi App & Web.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-5">Học sinh / Thiết bị</th>
                    <th className="py-3 px-5">Trường & Lớp</th>
                    <th className="py-3 px-5">📱 Ứng Dụng Đang Mở</th>
                    <th className="py-3 px-5">🌐 Website Vừa Vào</th>
                    <th className="py-3 px-5">Pin & Sạc</th>
                    <th className="py-3 px-5">Trạng thái</th>
                    <th className="py-3 px-5 text-right">Chi tiết</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredDevices.map((d) => (
                    <tr
                      key={d.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition cursor-pointer"
                      onClick={() => navigate(`/devices/${d.id}`)}
                    >
                      <td className="py-3 px-5">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {d.studentName || d.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {d.deviceUuid.substring(0, 12)}...
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <div className="text-slate-800 dark:text-slate-200 font-medium">
                          {d.schoolName || 'Chưa gán trường'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {d.className ? `Lớp ${d.className}` : ''}
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                          {d.currentApp || 'Đang mở màn hình chính'}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
                          {d.currentWebsite || 'google.com'}
                        </span>
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center gap-1 font-mono font-bold text-slate-800 dark:text-slate-200">
                          <span>{d.batteryLevel ?? 100}%</span>
                          {d.charging && <span className="text-[10px] text-amber-500 font-normal">⚡ Sạc</span>}
                        </div>
                      </td>
                      <td className="py-3 px-5">
                        {d.inClassAlert ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                            Trong giờ học
                          </span>
                        ) : d.status === 'ONLINE' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                            Online
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            Offline
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-right">
                        <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline">
                          Xem ↗
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
        {/* Devices List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white text-base">
              Danh Sách Giám Sát Học Sinh ({filteredDevices.length} máy)
            </h2>
            <button
              onClick={() => navigate('/devices')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>Xem chi tiết ({totalDevices})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {filteredDevices.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center">
                <Radio className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                  Chưa có thiết bị nào trong bộ lọc này
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Mở link <strong>{RENDER_REPORT_URL}</strong> trên điện thoại học sinh hoặc chọn lại bộ lọc khối/lớp.
                </p>
              </div>
              <div className="flex justify-center gap-2 pt-1">
                <button
                  onClick={() => navigate('/report')}
                  className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition cursor-pointer"
                >
                  📱 Mở Link Điện Thoại Báo Vào
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredDevices.map((d) => {
                const isOnline = d.status === 'ONLINE';
                const inClass = Boolean(d.inClassAlert);
                const isUninstalled = Boolean(d.isUninstalled);
                const isNoNet = Boolean(d.isNoNetwork || d.networkType === 'NONE');

                return (
                  <div
                    key={d.id}
                    onClick={() => navigate(`/devices/${d.id}`)}
                    className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border transition cursor-pointer space-y-2.5 shadow-xs ${
                      inClass
                        ? 'border-rose-400 dark:border-rose-700 bg-rose-50/20'
                        : isUninstalled
                        ? 'border-red-500 dark:border-red-700 bg-red-50/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400'
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
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                            {d.studentName || d.name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {d.schoolName || 'Chưa rõ trường'}{' '}
                            {d.className ? `· Lớp ${d.className}` : ''}{' '}
                            {d.grade ? `(${d.grade})` : ''}
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

                    {/* Sensor Data */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        {d.charging ? (
                          <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        ) : (
                          <Battery className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        )}
                        <span>Pin: {d.batteryLevel ?? 100}%</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                        <Wifi className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span>{d.networkType || 'WIFI'}</span>
                      </div>
                    </div>

                    {/* Google Maps GPS Coordinates */}
                    {d.latitude && d.longitude && (
                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100 dark:border-slate-800/80 text-slate-400">
                        <span className="font-mono truncate">
                          GPS: {d.latitude.toFixed(4)}, {d.longitude.toFixed(4)}
                        </span>
                        <a
                          href={`https://www.google.com/maps?q=${d.latitude},${d.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-0.5 shrink-0"
                        >
                          <span>Google Maps</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Activity Feed (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white text-base">
              Nhật Ký Sự Kiện Trực Tiếp
            </h2>
            <button
              onClick={() => navigate('/activity')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Chưa có sự kiện nào được ghi nhận.
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
                            ? 'bg-red-500 animate-ping'
                            : isNoNet
                            ? 'bg-amber-500'
                            : 'bg-indigo-500'
                        }`}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center justify-between">
                          <span>{act.studentName || act.deviceName}</span>
                          {act.className && (
                            <span className="text-[10px] text-slate-400">
                              Lớp {act.className}
                            </span>
                          )}
                        </div>
                        <div
                          className={`text-[11px] leading-relaxed mt-0.5 ${
                            isUninstall
                              ? 'text-red-600 dark:text-red-400 font-medium'
                              : isNoNet
                              ? 'text-amber-600 dark:text-amber-400 font-medium'
                              : 'text-slate-500 dark:text-slate-400'
                          }`}
                        >
                          {act.description}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
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
