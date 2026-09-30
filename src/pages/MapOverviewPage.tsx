import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Device } from '../types/index.ts';
import { DeviceMap } from '../components/Map/DeviceMap.tsx';
import { MapPin, RefreshCw, Smartphone, Play, Radio, Battery, Wifi } from 'lucide-react';

interface MapOverviewPageProps {
  navigate: (path: string) => void;
  onOpenSimulator: (deviceId?: string) => void;
}

export const MapOverviewPage: React.FC<MapOverviewPageProps> = ({ navigate, onOpenSimulator }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Bản Đồ Định Vị Toàn Cảnh
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Bản đồ vệ tinh OpenStreetMap hiển thị trực quan các điểm GPS của thiết bị
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadDevices}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition cursor-pointer"
            title="Làm mới tọa độ"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => onOpenSimulator(selectedDevice?.id)}
            className="py-2.5 px-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-semibold text-xs flex items-center gap-1.5 hover:bg-indigo-100 transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Mô phỏng GPS</span>
          </button>
        </div>
      </div>

      {/* Device selector bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedDevice(null)}
          className={`py-2 px-4 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            selectedDevice === null
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
          }`}
        >
          Tất cả thiết bị ({devices.length})
        </button>

        {devices.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelectedDevice(d)}
            className={`py-2 px-3.5 rounded-xl text-xs font-semibold transition whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
              selectedDevice?.id === d.id
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            <span>{d.platform === 'iOS' ? '🍎' : d.platform === 'Android' ? '🤖' : '📱'}</span>
            <span>{d.name}</span>
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                d.status === 'ONLINE' ? 'bg-emerald-400' : 'bg-slate-400'
              }`}
            />
          </button>
        ))}
      </div>

      {/* Main Map */}
      <DeviceMap
        devices={devices}
        selectedDevice={selectedDevice}
        height="560px"
        zoom={selectedDevice ? 15 : 6}
      />
    </div>
  );
};
