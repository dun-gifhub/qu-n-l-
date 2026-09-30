import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Device } from '../types/index.ts';
import {
  Smartphone,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Battery,
  Zap,
  Wifi,
  Radio,
  ArrowRight,
  Tablet,
  CheckCircle,
  Play,
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
  }, []);

  const filteredDevices = devices.filter((d) => {
    const matchesSearch =
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.deviceUuid.toLowerCase().includes(searchQuery.toLowerCase());
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
            Quản Lý Thiết Bị ({devices.length})
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Danh sách thiết bị kết nối, giám sát trạng thái pin, mạng và vị trí
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadDevices}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onOpenAddDevice}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm thiết bị mới</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên thiết bị hoặc UUID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs md:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Platform Filter */}
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

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="ONLINE">🟢 Online</option>
            <option value="IDLE">🟡 Idle (Chờ)</option>
            <option value="OFFLINE">⚪ Offline</option>
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
        /* Empty State */
        <div className="p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center max-w-lg mx-auto space-y-4 my-8 shadow-xs">
          <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto text-3xl">
            📱
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Chưa có thiết bị nào.
            </h3>
            <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Mobile App sẽ xuất hiện ở đây sau khi bạn liên kết thiết bị.
            </p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={onOpenAddDevice}
              className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md transition cursor-pointer"
            >
              + Đăng ký thiết bị đầu tiên
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
                className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400/80 dark:hover:border-indigo-600/80 transition-all shadow-xs hover:shadow-md flex flex-col justify-between space-y-5"
              >
                <div>
                  {/* Top Bar: Icon, Name & Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl shrink-0">
                        {device.platform === 'iOS' ? '🍎' : device.platform === 'Android' ? '🤖' : '📱'}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
                          {device.name}
                        </h3>
                        <p className="text-xs text-slate-400 font-mono truncate">
                          {device.deviceUuid}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shrink-0 ${
                        isOnline
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : isIdle
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isOnline ? 'bg-emerald-500 animate-pulse' : isIdle ? 'bg-amber-500' : 'bg-slate-400'
                        }`}
                      />
                      {device.status || 'OFFLINE'}
                    </span>
                  </div>

                  {/* Telemetry Stats: Battery & Network */}
                  <div className="grid grid-cols-2 gap-3 mt-5 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block mb-0.5">Dung lượng pin</span>
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                        <Battery className="w-4 h-4 text-emerald-500" />
                        <span>{device.batteryLevel ?? 100}%</span>
                        {device.charging && (
                          <span className="text-[10px] text-amber-500 flex items-center">
                            <Zap className="w-3 h-3 fill-amber-500" /> Sạc
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block mb-0.5">Kiểu mạng</span>
                      <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                        <Wifi className="w-4 h-4 text-indigo-500" />
                        <span>{device.networkType || 'WIFI'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Location Coordinate preview if available */}
                  <div className="mt-3 px-1 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>Vị trí GPS:</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300">
                      {typeof device.latitude === 'number'
                        ? `${device.latitude.toFixed(4)}, ${device.longitude?.toFixed(4)}`
                        : 'Chưa có dữ liệu'}
                    </span>
                  </div>
                </div>

                {/* Card Footer: Last updated & View Details button */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Cập nhật: <strong className="text-slate-600 dark:text-slate-300 font-semibold">{timeStr}</strong>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenSimulator(device.id)}
                      className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 rounded-lg text-xs"
                      title="Mô phỏng gửi tọa độ cho máy này"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <button
                      onClick={() => navigate(`/devices/${device.id}`)}
                      className="py-1.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 font-bold text-xs text-slate-800 dark:text-slate-200 transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Xem chi tiết</span>
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
