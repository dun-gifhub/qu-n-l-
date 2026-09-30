import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Device, ActivityEvent, User } from '../types/index.ts';
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
  Play,
  Layers,
  MapPin,
  Globe,
  Users,
  CheckCircle2,
} from 'lucide-react';

interface DashboardPageProps {
  navigate: (path: string) => void;
  onOpenAddDevice: () => void;
  onOpenSimulator: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  navigate,
  onOpenAddDevice,
  onOpenSimulator,
}) => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [pendingUsers, setPendingUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const promises: Promise<any>[] = [api.getDevices(), api.getAllActivity()];
      if (user?.role === 'ADMIN') {
        promises.push(api.getUsers());
      }
      const [devRes, actRes, usersRes] = await Promise.all(promises);

      if (devRes.success && devRes.data) {
        setDevices(devRes.data);
      } else {
        setErrorMsg(devRes.message || 'Không thể tải danh sách thiết bị');
      }

      if (actRes.success && actRes.data) {
        setActivities(actRes.data.slice(0, 6));
      }

      if (usersRes?.success && usersRes.data) {
        setPendingUsers(usersRes.data.filter((u: User) => u.approvalStatus === 'PENDING'));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [user?.id, user?.role]);

  const handleQuickApprove = async (userId: string) => {
    const res = await api.updateUserApproval(userId, 'APPROVED');
    if (res.success) {
      loadData();
    }
  };

  const totalDevices = devices.length;
  const onlineDevices = devices.filter((d) => d.status === 'ONLINE').length;
  const totalScreenMins = devices.reduce((sum, d) => sum + (d.screenTimeMinutes ?? 0), 0);
  const avgBattery =
    totalDevices > 0
      ? Math.round(devices.reduce((acc, cur) => acc + (cur.batteryLevel ?? 100), 0) / totalDevices)
      : 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {user?.role === 'ADMIN'
              ? 'Dashboard Quản Trị Tối Thượng (Admin)'
              : user?.role === 'TEACHER'
              ? `Dashboard Giáo Viên Chủ Nhiệm · ${user.schoolName || ''}`
              : 'Dashboard Phụ Huynh Quản Lý Con'}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {user?.role === 'ADMIN'
              ? 'Theo dõi toàn bộ tài khoản Giáo viên, Phụ huynh và tất cả thiết bị học sinh trên hệ thống'
              : user?.role === 'TEACHER'
              ? `Theo dõi tất cả học sinh đăng ký cùng trường ${user.schoolName} (Lớp chủ nhiệm: ${user.className || 'Toàn trường'})`
              : `Chỉ hiển thị thiết bị của con bạn (${user?.studentName || 'Học sinh'}) · Giám sát App, Web và Vị trí GPS`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => navigate('/app-usage')}
            className="py-2.5 px-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 hover:bg-slate-50 transition cursor-pointer whitespace-nowrap"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Xem Điện thoại dùng App & Web gì</span>
          </button>
          <button
            onClick={onOpenAddDevice}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm thiết bị học sinh</span>
          </button>
        </div>
      </div>

      {/* Admin Pending Approval Alert Banner */}
      {user?.role === 'ADMIN' && pendingUsers.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/25 border border-amber-200 dark:border-amber-800/60 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Có {pendingUsers.length} tài khoản Giáo viên / Phụ huynh đang chờ Admin duyệt
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Theo quy định phân quyền, tài khoản của Giáo viên và Phụ huynh cần được Admin phê duyệt mới có thể hoạt động.
              </p>
            </div>
            <button
              onClick={() => navigate('/accounts')}
              className="py-2 px-3.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              Mở trang Duyệt Tài Khoản &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {pendingUsers.slice(0, 4).map((u) => (
              <div
                key={u.id}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/50 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {u.name} · {u.role === 'TEACHER' ? 'Giáo viên' : 'Phụ huynh'}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate mt-0.5">
                    Trường: {u.schoolName || 'Chưa rõ'}{' '}
                    {u.studentName ? `· Con: ${u.studentName}` : `· Lớp: ${u.className || ''}`}
                  </div>
                </div>
                <button
                  onClick={() => handleQuickApprove(u.id)}
                  className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Duyệt ngay</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={loadData} className="text-xs font-bold underline ml-4">
            Thử lại
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {user?.role === 'PARENT'
              ? 'Thiết bị của con'
              : user?.role === 'TEACHER'
              ? 'Học sinh cùng trường'
              : 'Tổng thiết bị toàn hệ thống'}
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {String(totalDevices).padStart(2, '0')}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {user?.role === 'PARENT'
                ? 'Chỉ phụ huynh & GV trường biết'
                : 'Đang thuộc phạm vi giám sát'}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Thiết bị đang trực tuyến
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
              {String(onlineDevices).padStart(2, '0')}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Đang truyền dữ liệu App, Web & GPS
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Tổng thời gian dùng máy hôm nay
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
              {totalScreenMins}p
            </div>
            <div className="text-xs text-slate-400 mt-1">
              Thống kê sử dụng App & Web
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Mức pin trung bình
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 dark:text-white font-mono tabular-nums">
              {totalDevices > 0 ? `${avgBattery}%` : '--'}
            </div>
            <div className="text-xs text-slate-400 mt-1">
              {devices.filter((d) => d.charging).length} máy đang cắm sạc
            </div>
          </div>
        </div>
      </div>

      {/* Live Map Overview */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-base">
              Bản Đồ Định Vị Thiết Bị Học Sinh
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user?.role === 'PARENT'
                ? 'Vị trí thời gian thực của con bạn'
                : user?.role === 'TEACHER'
                ? `Vị trí các học sinh đăng ký trường ${user.schoolName}`
                : 'Vị trí toàn bộ học sinh trên tất cả các trường'}
            </p>
          </div>

          <button
            onClick={() => navigate('/map')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
          >
            <span>Mở rộng bản đồ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <DeviceMap devices={devices} height="340px" />
      </div>

      {/* Two Column Grid: Student Devices & Activity Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Student Devices List (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white text-base">
              {user?.role === 'PARENT'
                ? 'Điện Thoại Của Con & Hoạt Động App / Web Hiện Tại'
                : 'Danh Sách Thiết Bị Học Sinh & Ứng Dụng Đang Mở'}
            </h2>
            <button
              onClick={() => navigate('/devices')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <span>Xem tất cả ({totalDevices})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {devices.length === 0 ? (
            <div className="p-10 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                Chưa có thiết bị học sinh nào
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Thêm thiết bị của học sinh để theo dõi điện thoại đang dùng App gì, vào Web gì và định vị GPS.
              </p>
              <button
                onClick={onOpenAddDevice}
                className="py-2 px-4 rounded-xl bg-indigo-600 text-white text-xs font-semibold cursor-pointer"
              >
                + Thêm thiết bị đầu tiên
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {devices.slice(0, 6).map((device) => {
                const isOnline = device.status === 'ONLINE';
                return (
                  <div
                    key={device.id}
                    className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/60 transition flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                            {device.studentName || device.name}
                          </h3>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                            {device.schoolName}
                            {device.className ? ` · Lớp ${device.className}` : ''}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            Máy: {device.name} · PH: {device.ownerName}
                          </div>
                        </div>

                        <span
                          className={`text-xs font-bold shrink-0 ${
                            isOnline
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {device.status || 'OFFLINE'}
                        </span>
                      </div>

                      {/* Real-time App & Web usage box */}
                      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-400">Đang dùng App:</span>
                          <span className="font-bold text-slate-900 dark:text-white truncate">
                            {device.currentApp || 'Màn hình chính'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-400">Vừa vào Web:</span>
                          <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                            {device.currentWebsite || 'google.com'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2 text-slate-500 font-mono tabular-nums">
                          <span>Pin: {device.batteryLevel ?? 100}% · {device.networkType || 'WIFI'}</span>
                          <span>Màn hình: {device.screenTimeMinutes ?? 0}p</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <button
                        onClick={() => navigate(`/devices/${device.id}/usage`)}
                        className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Quản lý App & Web
                      </button>
                      <button
                        onClick={() => navigate(`/devices/${device.id}`)}
                        className="font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 cursor-pointer"
                      >
                        Chi tiết &rarr;
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Activity Stream (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white text-base">
              Nhật Ký Hoạt Động Mới Nhất
            </h2>
            <button
              onClick={() => navigate('/activity')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Tất cả
            </button>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            {activities.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Chưa có hoạt động nào được ghi nhận.
              </div>
            ) : (
              <div className="space-y-3.5">
                {activities.map((act) => {
                  const time = new Date(act.timestamp).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  return (
                    <div key={act.id} className="flex items-start gap-3 text-xs">
                      <span className="font-mono tabular-nums text-[11px] text-slate-400 shrink-0 mt-0.5">
                        {time}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {act.studentName || act.deviceName}
                          {act.schoolName ? ` · ${act.schoolName}` : ''}
                        </div>
                        <div className="text-slate-500 dark:text-slate-400 text-[11px] leading-tight mt-0.5">
                          {act.description}
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
