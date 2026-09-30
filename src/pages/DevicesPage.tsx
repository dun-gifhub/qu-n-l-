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
} from 'lucide-react';

interface DevicesPageProps {
  navigate: (path: string) => void;
  onOpenAddDevice: () => void;
  onOpenSimulator: (deviceId?: string) => void;
}

export const DevicesPage: React.FC<DevicesPageProps> = ({
  navigate,
  onOpenAddDevice,
  onOpenSimulator,
}) => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const loadDevices = async () => {
    setIsLoading(true);
    const res = await api.getDevices();
    if (res.success && res.data) {
      setDevices(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadDevices();
  }, [user?.id]);

  const filteredDevices = devices.filter((d) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      d.name.toLowerCase().includes(q) ||
      d.deviceUuid.toLowerCase().includes(q) ||
      (d.studentName || '').toLowerCase().includes(q) ||
      (d.schoolName || '').toLowerCase().includes(q) ||
      (d.currentApp || '').toLowerCase().includes(q);
    const matchesPlatform = platformFilter === 'ALL' || d.platform === platformFilter;
    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    return matchesSearch && matchesPlatform && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {user?.role === 'PARENT'
              ? `Thiết Bị Của Con (${devices.length})`
              : user?.role === 'TEACHER'
              ? `Thiết Bị Học Sinh Trường ${user.schoolName} (${devices.length})`
              : `Toàn Bộ Thiết Bị Học Sinh (${devices.length})`}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {user?.role === 'PARENT'
              ? 'Phụ huynh chỉ xem và quản lý các thiết bị thuộc về con của mình'
              : user?.role === 'TEACHER'
              ? 'Giáo viên chủ nhiệm theo dõi tất cả các học sinh đăng ký cùng trường'
              : 'Admin tối thượng theo dõi tất cả thiết bị của mọi trường học và phụ huynh'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadDevices}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
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

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên học sinh, trường học, tên máy, ứng dụng đang mở..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">Tất cả nền tảng</option>
            <option value="iOS">Apple iOS</option>
            <option value="Android">Google Android</option>
            <option value="Tablet">Tablet</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ONLINE">Online</option>
            <option value="IDLE">Idle (Chờ)</option>
            <option value="OFFLINE">Offline</option>
          </select>
        </div>
      </div>

      {/* Device Cards Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
          <span>Đang tải danh sách thiết bị...</span>
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center max-w-lg mx-auto space-y-4 my-8">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Chưa có thiết bị nào phù hợp
            </h3>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Đăng ký thiết bị học sinh mới để bắt đầu giám sát vị trí, ứng dụng và lịch sử duyệt web.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={onOpenAddDevice}
              className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer"
            >
              + Đăng ký thiết bị học sinh
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDevices.map((device) => {
            const isOnline = device.status === 'ONLINE';
            const isIdle = device.status === 'IDLE';
            const timeStr = device.lastSeen
              ? new Date(device.lastSeen).toLocaleTimeString('vi-VN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'N/A';

            return (
              <div
                key={device.id}
                className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500/80 transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                        {device.studentName || device.name}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {device.schoolName} {device.className ? `· Lớp ${device.className}` : ''}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        Thiết bị: {device.name} ({device.platform}) · PH: {device.ownerName}
                      </p>
                    </div>

                    <span
                      className={`text-xs font-bold shrink-0 ${
                        isOnline
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isIdle
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {device.status || 'OFFLINE'}
                    </span>
                  </div>

                  {/* Current App & Web Activity */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">Ứng dụng đang mở:</span>
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {device.currentApp || 'Màn hình chính'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-400">Trang Web vừa vào:</span>
                      <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400 truncate">
                        {device.currentWebsite || 'google.com'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2 font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      <span>Pin: {device.batteryLevel ?? 100}% {device.charging ? '(Đang sạc)' : ''}</span>
                      <span>Thời gian dùng: {device.screenTimeMinutes ?? 0} phút</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono tabular-nums">
                    Cập nhật: {timeStr}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onOpenSimulator(device.id)}
                      className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg text-xs cursor-pointer"
                      title="Mô phỏng điện thoại học sinh"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <button
                      onClick={() => navigate(`/devices/${device.id}/usage`)}
                      className="py-1.5 px-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white font-semibold text-xs transition cursor-pointer whitespace-nowrap"
                    >
                      App & Web
                    </button>
                    <button
                      onClick={() => navigate(`/devices/${device.id}`)}
                      className="py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white font-bold text-xs text-slate-800 dark:text-slate-200 transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                    >
                      <span>Chi tiết</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
