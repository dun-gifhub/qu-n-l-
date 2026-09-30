import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
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
  Play,
  Layers,
  MapPin,
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
  const [devices, setDevices] = useState<Device[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [devRes, actRes] = await Promise.all([
        api.getDevices(),
        api.getAllActivity(),
      ]);

      if (devRes.success && devRes.data) {
        setDevices(devRes.data);
      } else {
        setErrorMsg(devRes.message || 'Không thể tải danh sách thiết bị');
      }

      if (actRes.success && actRes.data) {
        setActivities(actRes.data.slice(0, 6));
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi tải dữ liệu');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Poll every 30 seconds for live updates
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalDevices = devices.length;
  const onlineDevices = devices.filter((d) => d.status === 'ONLINE').length;
  const idleDevices = devices.filter((d) => d.status === 'IDLE').length;
  const offlineDevices = devices.filter((d) => d.status === 'OFFLINE' || !d.status).length;

  const avgBattery = totalDevices > 0
    ? Math.round(devices.reduce((acc, cur) => acc + (cur.batteryLevel ?? 100), 0) / totalDevices)
    : 100;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Dashboard Tổng Quan
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi trạng thái và vị trí các thiết bị kết nối theo thời gian thực
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onOpenSimulator}
            className="py-2.5 px-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-semibold text-xs flex items-center gap-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Mô phỏng Mobile</span>
          </button>
          <button
            onClick={onOpenAddDevice}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/25 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm thiết bị</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={loadData}
            className="text-xs font-bold underline ml-4 hover:opacity-80"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Tổng Thiết Bị</span>
            <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {String(totalDevices).padStart(2, '0')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Đã liên kết vào tài khoản
            </div>
          </div>
        </div>

        {/* Card 2: Online */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-xs font-bold uppercase tracking-wider">Đang Online</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <Radio className="w-4 h-4 animate-pulse" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
              {String(onlineDevices).padStart(2, '0')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Đang truyền dữ liệu telemetry
            </div>
          </div>
        </div>

        {/* Card 3: Offline / Idle */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-xs font-bold uppercase tracking-wider">Chờ / Offline</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
              {String(idleDevices + offlineDevices).padStart(2, '0')}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {idleDevices} ở chế độ chờ, {offlineDevices} tắt nguồn
            </div>
          </div>
        </div>

        {/* Card 4: Avg Battery */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
            <span className="text-xs font-bold uppercase tracking-wider">Pin Trung Bình</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Battery className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
              {totalDevices > 0 ? `${avgBattery}%` : '--'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {devices.filter((d) => d.charging).length} thiết bị đang cắm sạc
            </div>
          </div>
        </div>
      </div>

      {/* Live Map Overview */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base">
                Vị Trí Các Thiết Bị Trực Tuyến
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hiển thị toàn bộ vị trí GPS cập nhật mới nhất từ Mobile App
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/map')}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Mở rộng bản đồ</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <DeviceMap devices={devices} height="380px" />
      </div>

      {/* Two Column Grid: Recent Devices & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Devices (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Thiết Bị Gần Đây</span>
            </h2>
            <button
              onClick={() => navigate('/devices')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Xem tất cả ({totalDevices})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {devices.length === 0 ? (
            <div className="p-10 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                Chưa có thiết bị nào
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Mobile App sẽ xuất hiện ở đây sau khi bạn liên kết thiết bị hoặc tạo mới.
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
              {devices.slice(0, 4).map((device) => {
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
                    className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-indigo-400/60 dark:hover:border-indigo-600/60 transition shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-2xl">
                            {device.platform === 'iOS' ? '🍎' : device.platform === 'Android' ? '🤖' : '📱'}
                          </span>
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                              {device.name}
                            </h3>
                            <span className="text-[11px] text-slate-400">
                              {device.platform} {device.osVersion ? `• ${device.osVersion}` : ''}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 shrink-0 ${
                            isOnline
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                              : isIdle
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isOnline ? 'bg-emerald-500' : isIdle ? 'bg-amber-500' : 'bg-slate-400'
                            }`}
                          />
                          {device.status || 'OFFLINE'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <Battery className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="font-medium text-slate-900 dark:text-slate-200">
                            {device.batteryLevel ?? 100}%
                          </span>
                          {device.charging && <Zap className="w-3 h-3 text-amber-500" />}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <Wifi className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="font-medium text-slate-900 dark:text-slate-200">
                            {device.networkType || 'WIFI'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                      <span>Cập nhật: {timeStr}</span>
                      <button
                        onClick={() => navigate(`/devices/${device.id}`)}
                        className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Xem chi tiết &rarr;
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
            <h2 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Hoạt Động Gần Đây</span>
            </h2>
            <button
              onClick={() => navigate('/activity')}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Tất cả
            </button>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
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
                      <span className="font-mono text-[11px] text-slate-400 shrink-0 mt-0.5">
                        {time}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {act.deviceName}
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
