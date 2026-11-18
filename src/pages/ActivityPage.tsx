import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { ActivityEvent } from '../types/index.ts';
import { Activity, RefreshCw, Battery, MapPin, Zap, Radio, Clock } from 'lucide-react';

export const ActivityPage: React.FC = () => {
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('ALL');

  const loadActivities = async () => {
    setIsLoading(true);
    const res = await api.getAllActivity();
    if (res.success && res.data) {
      setActivities(res.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const filtered = activities.filter((act) => {
    if (filterType === 'ALL') return true;
    return act.type === filterType;
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'ONLINE':
        return <Radio className="w-4 h-4 text-[var(--success)]" strokeWidth={1.5} />;
      case 'OFFLINE':
      case 'IDLE':
        return <Clock className="w-4 h-4 text-[var(--warning)]" strokeWidth={1.5} />;
      case 'LOCATION_UPDATE':
        return <MapPin className="w-4 h-4 text-[var(--accent-ink)]" strokeWidth={1.5} />;
      case 'CHARGING_STARTED':
      case 'CHARGING_STOPPED':
        return <Zap className="w-4 h-4 text-[var(--warning)]" strokeWidth={1.5} />;
      case 'BATTERY_LOW':
        return <Battery className="w-4 h-4 text-[var(--danger)]" strokeWidth={1.5} />;
      default:
        return <Activity className="w-4 h-4 text-[var(--text-muted)]" strokeWidth={1.5} />;
    }
  };

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">
            Nhật ký hoạt động thiết bị
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Lịch sử các sự kiện thay đổi trạng thái kết nối, cập nhật vị trí GPS và mức pin
          </p>
        </div>

        <button
          onClick={loadActivities}
          disabled={isLoading}
          className="h-10 w-10 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] transition-[color,background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] flex items-center justify-center self-start sm:self-auto cursor-pointer"
          title="Làm mới"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'ALL', label: 'Tất cả sự kiện', dot: '' },
          { key: 'ONLINE', label: 'Trực tuyến', dot: 'bg-[var(--success)]' },
          { key: 'LOCATION_UPDATE', label: 'Vị trí GPS', dot: 'bg-[var(--accent)]' },
          { key: 'CHARGING_STARTED', label: 'Đang sạc', dot: 'bg-[var(--warning)]' },
          { key: 'BATTERY_LOW', label: 'Cảnh báo pin', dot: 'bg-[var(--danger)]' },
        ].map((tab) => {
          const active = filterType === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilterType(tab.key)}
              className={`h-8 px-3 rounded-[var(--radius-control)] text-xs font-medium flex items-center gap-2 transition-[color,background-color,border-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer border ${
                active
                  ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] border-[var(--accent-border)]'
                  : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]'
              }`}
            >
              {tab.dot && <span className={`w-2 h-2 rounded-full ${tab.dot}`} />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Activity Timeline List */}
      <div className="bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] p-6 shadow-[var(--shadow-card)]">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-[var(--accent-ink)]" strokeWidth={1.5} />
            <span>Đang tải lịch sử hoạt động</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-[var(--text-muted)]">
            Không có hoạt động nào phù hợp với bộ lọc hiện tại
          </div>
        ) : (
          <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-px before:bg-[var(--border-strong)]">
            {filtered.map((act) => {
              const time = new Date(act.timestamp).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });
              const date = new Date(act.timestamp).toLocaleDateString('vi-VN');

              return (
                <div key={act.id} className="relative flex items-start gap-4">
                  <div className="absolute -left-5 top-4 w-2 h-2 rounded-full bg-[var(--accent)] ring-4 ring-[var(--surface)]" />

                  <div className="flex-1 p-4 rounded-[var(--radius-control)] bg-[var(--surface-muted)]/60 border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shrink-0">
                        {getEventIcon(act.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-[var(--text-primary)]">
                            {act.deviceName}
                          </span>
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-[6px] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]">
                            {act.platform}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                          {act.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right sm:self-center font-mono tabular-nums text-[11px] text-[var(--text-muted)] shrink-0">
                      <div className="text-[var(--text-secondary)] font-medium">{time}</div>
                      <div>{date}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
