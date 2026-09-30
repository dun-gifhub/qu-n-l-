import React, { useEffect, useState } from 'react';
import { BellRing, WifiOff, Trash2, Smartphone, Wifi, X, ExternalLink, ShieldAlert } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: string;
  title: string;
  message: string;
  deviceId: string;
  studentName: string;
  className?: string;
  schoolName?: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'emergency';
}

interface RealtimeToastContainerProps {
  navigate: (path: string) => void;
}

export const RealtimeToastContainer: React.FC<RealtimeToastContainerProps> = ({ navigate }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/notifications/stream');

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type && data.type !== 'CONNECTED') {
              const newToast: ToastItem = {
                id: data.id || 'toast_' + Date.now(),
                type: data.type,
                title: data.title || 'Thông báo hệ thống',
                message: data.message || '',
                deviceId: data.deviceId,
                studentName: data.studentName || 'Học sinh',
                className: data.className,
                schoolName: data.schoolName,
                timestamp: data.timestamp || new Date().toISOString(),
                severity: data.severity || 'info',
              };

              setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

              // Auto dismiss after 8s
              setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
              }, 8000);
            }
          } catch (e) {
            // Ignore parse errors (e.g. keepalive comments)
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
          }
          // Reconnect after 5 seconds if connection dropped
          reconnectTimeout = setTimeout(connectSSE, 5000);
        };
      } catch (err) {
        // Fallback reconnection
        reconnectTimeout = setTimeout(connectSSE, 10000);
      }
    };

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const isEmergency = toast.severity === 'emergency' || toast.type === 'APP_UNINSTALLED';
        const isWarning = toast.severity === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-2xl p-4 shadow-xl border backdrop-blur-md transition-all animate-in slide-in-from-top-3 duration-200 ${
              isEmergency
                ? 'bg-rose-950/95 border-rose-500/80 text-white'
                : isWarning
                ? 'bg-amber-950/95 border-amber-500/80 text-white'
                : 'bg-slate-900/95 border-slate-700/80 text-white'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isEmergency
                      ? 'bg-rose-600 text-white animate-pulse'
                      : isWarning
                      ? 'bg-amber-600 text-white'
                      : 'bg-indigo-600 text-white'
                  }`}
                >
                  {isEmergency ? (
                    <Trash2 className="w-5 h-5" />
                  ) : toast.type === 'NO_NETWORK' ? (
                    <WifiOff className="w-5 h-5" />
                  ) : toast.type === 'WIFI_CONNECTED' ? (
                    <Wifi className="w-5 h-5" />
                  ) : toast.type === 'IN_CLASS_USAGE' ? (
                    <BellRing className="w-5 h-5" />
                  ) : (
                    <Smartphone className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-xs leading-snug">{toast.title}</h4>
                  <p className="text-[11px] opacity-90 mt-0.5 leading-relaxed">{toast.message}</p>
                </div>
              </div>

              <button
                onClick={() => dismissToast(toast.id)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
              <span className="opacity-70 font-mono">
                {new Date(toast.timestamp).toLocaleTimeString('vi-VN')}
              </span>
              {toast.deviceId && (
                <button
                  onClick={() => {
                    navigate(`/devices/${toast.deviceId}`);
                    dismissToast(toast.id);
                  }}
                  className="font-bold underline hover:opacity-80 flex items-center gap-1 cursor-pointer"
                >
                  <span>Xem trên bản đồ</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
