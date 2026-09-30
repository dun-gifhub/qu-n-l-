import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { ActivityEvent } from '../types/index.ts';
import { Activity, RefreshCw, Smartphone, Battery, MapPin, Zap, Radio, Clock } from 'lucide-react';

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
        return <Radio className="w-4 h-4 text-emerald-500" />;
      case 'OFFLINE':
      case 'IDLE':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'LOCATION_UPDATE':
        return <MapPin className="w-4 h-4 text-indigo-500" />;
      case 'CHARGING_STARTED':
      case 'CHARGING_STOPPED':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'BATTERY_LOW':
        return <Battery className="w-4 h-4 text-rose-500" />;
      default:
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Nhật Ký Hoạt Động (Activity)
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Lịch sử toàn bộ các sự kiện thay đổi trạng thái, cập nhật vị trí và pin từ các thiết bị
          </p>
        </div>

        <button
          onClick={loadActivities}
          disabled={isLoading}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition self-start sm:self-auto cursor-pointer"
          title="Làm mới"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'ALL', label: 'Tất cả sự kiện' },
          { key: 'ONLINE', label: '🟢 Trực tuyến' },
          { key: 'LOCATION_UPDATE', label: '📍 Vị trí GPS' },
          { key: 'CHARGING_STARTED', label: '⚡ Đang sạc' },
          { key: 'BATTERY_LOW', label: '🔋 Cảnh báo pin' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
              filterType === tab.key
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Activity Timeline List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs">
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" />
            <span>Đang tải lịch sử hoạt động...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-xs text-slate-400">
            Không có hoạt động nào phù hợp với bộ lọc hiện tại.
          </div>
        ) : (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {filtered.map((act) => {
              const time = new Date(act.timestamp).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });
              const date = new Date(act.timestamp).toLocaleDateString('vi-VN');

              return (
                <div key={act.id} className="relative flex items-start gap-4">
                  {/* Timeline dot */}
                  <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-indigo-600 flex items-center justify-center text-[8px] text-indigo-600 shadow-xs">
                    •
                  </div>

                  <div className="flex-1 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-800 shadow-xs flex items-center justify-center shrink-0">
                        {getEventIcon(act.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {act.deviceName}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {act.platform}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                          {act.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right sm:self-center font-mono text-[11px] text-slate-400 shrink-0">
                      <div>{time}</div>
                      <div className="text-[10px] text-slate-500">{date}</div>
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
