import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Device } from '../types/index.ts';
import { DeviceMap } from '../components/Map/DeviceMap.tsx';
import { RefreshCw, Smartphone } from 'lucide-react';

interface MapOverviewPageProps {
  navigate: (path: string) => void;
  onOpenSimulator?: (deviceId?: string) => void;
}

export const MapOverviewPage: React.FC<MapOverviewPageProps> = ({ navigate }) => {
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
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">
            Bản đồ định vị toàn cảnh
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Bản đồ vệ tinh và đường phố hiển thị vị trí GPS thực tế của các thiết bị đang theo dõi
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadDevices}
            disabled={isLoading}
            className="h-10 w-10 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] transition-[color,background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] flex items-center justify-center cursor-pointer"
            title="Làm mới tọa độ"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          </button>
          <button
            onClick={() => navigate('/report')}
            className="h-10 px-4 rounded-[var(--radius-control)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] font-medium text-xs flex items-center gap-2 transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer whitespace-nowrap"
          >
            <Smartphone className="w-4 h-4" strokeWidth={1.5} />
            <span>Mở báo cáo trên điện thoại</span>
          </button>
        </div>
      </div>

      {/* Device selector bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedDevice(null)}
          className={`h-9 px-4 rounded-[var(--radius-control)] text-xs font-medium transition-[color,background-color,border-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] whitespace-nowrap cursor-pointer border ${
            selectedDevice === null
              ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] border-[var(--accent-border)]'
              : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]'
          }`}
        >
          Tất cả thiết bị (<span className="font-mono tabular-nums">{devices.length}</span>)
        </button>

        {devices.map((d) => {
          const active = selectedDevice?.id === d.id;
          const isOnline = d.status === 'ONLINE';
          return (
            <button
              key={d.id}
              onClick={() => setSelectedDevice(d)}
              className={`h-9 px-3 rounded-[var(--radius-control)] text-xs font-medium transition-[color,background-color,border-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] whitespace-nowrap flex items-center gap-2 cursor-pointer border ${
                active
                  ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] border-[var(--accent-border)]'
                  : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isOnline
                    ? 'bg-[var(--success)] telemetry-live-dot'
                    : 'bg-[var(--text-muted)]'
                }`}
              />
              <span>{d.studentName || d.name}</span>
              <span className="text-[11px] font-mono text-[var(--text-muted)]">{d.platform}</span>
            </button>
          );
        })}
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
