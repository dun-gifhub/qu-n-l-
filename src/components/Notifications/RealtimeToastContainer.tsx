import React, { useEffect, useState } from 'react';
import { BellRing, WifiOff, Trash2, Smartphone, Wifi, X, ExternalLink } from 'lucide-react';

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

              setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
              }, 8000);
            }
          } catch {
            // Ignore keepalive parse
          }
        };

        eventSource.onerror = () => {
          if (eventSource) {
            eventSource.close();
          }
          reconnectTimeout = setTimeout(connectSSE, 5000);
        };
      } catch {
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
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        const isEmergency = toast.severity === 'emergency' || toast.type === 'APP_UNINSTALLED';
        const isWarning = toast.severity === 'warning';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-[var(--radius-card)] p-4 shadow-[var(--shadow-elevated)] border bg-[var(--surface)] transition-[opacity,transform] duration-[var(--duration-base)] ease-[var(--ease-standard)] ${
              isEmergency
                ? 'border-[var(--danger-border)]'
                : isWarning
                ? 'border-[var(--warning-border)]'
                : 'border-[var(--border-strong)]'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`w-8 h-8 rounded-[var(--radius-control)] flex items-center justify-center shrink-0 ${
                    isEmergency
                      ? 'bg-[var(--danger-soft)] text-[var(--danger)]'
                      : isWarning
                      ? 'bg-[var(--warning-soft)] text-[var(--warning)]'
                      : 'bg-[var(--accent-soft)] text-[var(--accent-ink)]'
                  }`}
                >
                  {isEmergency ? (
                    <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                  ) : toast.type === 'NO_NETWORK' ? (
                    <WifiOff className="w-4 h-4" strokeWidth={1.5} />
                  ) : toast.type === 'WIFI_CONNECTED' ? (
                    <Wifi className="w-4 h-4" strokeWidth={1.5} />
                  ) : toast.type === 'IN_CLASS_USAGE' ? (
                    <BellRing className="w-4 h-4" strokeWidth={1.5} />
                  ) : (
                    <Smartphone className="w-4 h-4" strokeWidth={1.5} />
                  )}
                </div>

                <div>
                  <h4 className="font-semibold text-xs text-[var(--text-primary)] leading-snug">
                    {toast.title}
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                    {toast.message}
                  </p>
                </div>
              </div>

              <button
                onClick={() => dismissToast(toast.id)}
                className="w-6 h-6 flex items-center justify-center rounded-[6px] hover:bg-[var(--surface-muted)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0"
                aria-label="Đóng thông báo"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <div className="mt-3 pt-2 border-t border-[var(--border)] flex items-center justify-between text-[11px]">
              <span className="text-[var(--text-muted)] font-mono tabular-nums">
                {new Date(toast.timestamp).toLocaleTimeString('vi-VN')}
              </span>
              {toast.deviceId && (
                <button
                  onClick={() => {
                    navigate(`/devices/${toast.deviceId}`);
                    dismissToast(toast.id);
                  }}
                  className="font-medium text-[var(--accent-ink)] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>Xem trên bản đồ</span>
                  <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
