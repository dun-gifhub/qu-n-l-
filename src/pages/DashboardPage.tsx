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
    // User requested: "web tự làm mới mỗi giây" (refreshes automatically every 1 second)
    const interval = setInterval(() => {
      fetchLiveData(false);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(RENDER_REPORT_URL).then(() => {
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
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Giám Sát Thiết Bị Học Sinh
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
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

        {/* User Scope / Role Indicator */}
        <div className="flex items-center gap-2">
          {user ? (
            <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
              <span className="text-slate-400">Đang đăng nhập: </span>
              <strong className="text-indigo-600 dark:text-indigo-400">
                {user.role === 'ADMIN'
                  ? 'Quản trị viên (Toàn hệ thống)'
                  : user.role === 'TEACHER'
                  ? `Giáo viên (${user.schoolName || 'Trường học'} ${user.className ? `- ${user.className}` : ''})`
                  : `Phụ huynh (${user.studentName ? `Con: ${user.studentName}` : 'Học sinh'})`}
              </strong>
            </div>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition cursor-pointer"
            >
              Đăng nhập phân quyền
            </button>
          )}

          {user?.role === 'ADMIN' && (
            <button
              onClick={() => navigate('/accounts')}
              className="py-1.5 px-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-amber-600" />
              <span>Duyệt TK Giáo viên & PH</span>
            </button>
          )}
        </div>
      </div>

      {/* Banner Cảnh Báo Khẩn Cấp (nếu có học sinh dùng trong giờ hoặc gỡ app) */}
      {(inClassCount > 0 || uninstalledCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {inClassCount > 0 && (
            <div
              onClick={() => setSelectedStatusFilter('IN_CLASS')}
              className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-center justify-between cursor-pointer hover:bg-rose-100/60 dark:hover:bg-rose-950/70 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold animate-pulse">
                  <BellRing className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-rose-900 dark:text-rose-200">
                    CẢNH BÁO SỬ DỤNG TRONG GIỜ HỌC!
                  </div>
                  <div className="text-[11px] text-rose-700 dark:text-rose-300">
                    Phát hiện <strong>{inClassCount} thiết bị</strong> đang online và hoạt động trong khung giờ học.
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                Lọc xem ↗
              </span>
            </div>
          )}

          {uninstalledCount > 0 && (
            <div
              onClick={() => setSelectedStatusFilter('UNINSTALLED')}
              className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-center justify-between cursor-pointer hover:bg-amber-100/60 dark:hover:bg-amber-950/70 transition"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-amber-900 dark:text-amber-200">
                    NGHI VẤN HỌC SINH GỠ ỨNG DỤNG!
                  </div>
                  <div className="text-[11px] text-amber-700 dark:text-amber-300">
                    Có <strong>{uninstalledCount} điện thoại</strong> vừa gửi tín hiệu gỡ app hoặc ngắt báo cáo.
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                Lọc xem ↗
              </span>
            </div>
          )}
        </div>
      )}

      {/* Primary Connection Banner: https://qu-n-l-s1k1.onrender.com/report */}
      <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white border border-indigo-700/50 shadow-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/30">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Link Kết Nối Điện Thoại Học Sinh (Live Tracker)</span>
            </div>
            <h2 className="text-lg md:text-xl font-extrabold tracking-tight">
              Đồng bộ dữ liệu báo cáo qua cổng Render: {RENDER_REPORT_URL}
            </h2>
            <p className="text-xs md:text-sm text-indigo-200/90 leading-relaxed">
              Mở camera quét mã QR hoặc mở link dưới đây trên điện thoại học sinh. Tọa độ vệ tinh Google Maps, mức pin và trạng thái mạng sẽ tự động làm mới về màn hình máy chủ mỗi giây mà không cần cài đặt phức tạp.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-indigo-500/30 text-xs font-mono font-bold text-emerald-400 truncate max-w-full">
                {RENDER_REPORT_URL}
              </div>
              <button
                onClick={handleCopyLink}
                className="py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                {copiedLink ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>Đã sao chép!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Sao chép link</span>
                  </>
                )}
              </button>
              <button
                onClick={() => setShowQr(!showQr)}
                className="py-2 px-3 rounded-xl bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-600/40 text-xs font-semibold text-indigo-200 flex items-center gap-1.5 transition cursor-pointer"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{showQr ? 'Ẩn mã QR' : 'Hiện mã QR quét điện thoại'}</span>
              </button>
              <button
                onClick={() => navigate('/report')}
                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer ml-auto"
              >
                <span>📱 Mở trang báo cáo</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* QR Code Container */}
          <div className={`shrink-0 ${showQr ? 'block' : 'hidden lg:block'}`}>
            <div className="p-3 bg-white rounded-2xl shadow-xl border border-indigo-200 text-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(
                  RENDER_REPORT_URL
                )}`}
                alt="QR Code Báo Cáo"
                className="w-28 h-28 mx-auto rounded-lg"
              />
              <span className="block mt-1 text-[10px] font-bold text-slate-800">
                Quét bằng Camera ĐT
              </span>
            </div>
          </div>
        </div>
      </div>

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
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
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

      {/* Hierarchy Filter Bar: Khối & Lớp cho Giáo Viên & Quản Lý */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="font-bold text-xs text-slate-900 dark:text-white">
              Phân Loại Theo Trường, Khối & Lớp:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* School Filter */}
            {availableSchools.length > 1 && (
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                <option value="ALL">Tất cả các trường</option>
                {availableSchools.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            )}

            {/* Grade Filter */}
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">Tất cả các khối</option>
              {availableGrades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>

            {/* Class Filter */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              <option value="ALL">Tất cả các lớp</option>
              {availableClasses.map((c) => (
                <option key={c} value={c}>
                  Lớp {c}
                </option>
              ))}
            </select>

            {(selectedSchool !== 'ALL' || selectedGrade !== 'ALL' || selectedClass !== 'ALL' || selectedStatusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSelectedSchool('ALL');
                  setSelectedGrade('ALL');
                  setSelectedClass('ALL');
                  setSelectedStatusFilter('ALL');
                }}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Google Maps Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                Bản Đồ Google Maps Trực Tuyến
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Hiển thị vị trí thực của học sinh theo từng khối, lớp trên nền Google Maps vệ tinh
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/map')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <span>Mở toàn màn hình</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <DeviceMap devices={filteredDevices} height="390px" />
      </div>

      {/* Two Column Grid: Devices & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Devices List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white text-base">
              Danh Sách Học Sinh ({filteredDevices.length} máy)
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
