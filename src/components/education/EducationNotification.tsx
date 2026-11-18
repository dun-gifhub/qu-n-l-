import React from 'react';
import { Bell, CheckCircle2, AlertTriangle, Info, Clock } from 'lucide-react';

export interface EducationNotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  isRead?: boolean;
  type?: 'info' | 'warning' | 'success' | 'alert';
}

interface EducationNotificationProps {
  notifications: EducationNotificationItem[];
  onMarkAsRead?: (id: string) => void;
  onClearAll?: () => void;
}

export const EducationNotification: React.FC<EducationNotificationProps> = ({
  notifications,
  onMarkAsRead,
  onClearAll,
}) => {
  const getIcon = (type?: string) => {
    switch (type) {
      case 'warning':
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-[var(--warning)]" strokeWidth={1.5} />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-[var(--success)]" strokeWidth={1.5} />;
      default:
        return <Info className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.5} />;
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
          <h3 className="font-semibold text-sm text-[var(--text-primary)]">Thông báo mới</h3>
          <span className="text-xs font-mono tabular-nums text-[var(--text-muted)]">
            {notifications.filter((n) => !n.isRead).length}
          </span>
        </div>
        {onClearAll && notifications.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs font-medium text-[var(--accent-ink)] hover:underline cursor-pointer"
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="py-8 text-center text-[var(--text-muted)] text-xs">
          Không có thông báo mới nào
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => onMarkAsRead && onMarkAsRead(item.id)}
              className={`p-3 rounded-[var(--radius-card)] border transition-[background-color,border-color] duration-[var(--duration-fast)] flex items-start gap-3 cursor-pointer ${
                !item.isRead
                  ? 'bg-[var(--accent-soft)] border-[var(--accent-border)]'
                  : 'bg-[var(--surface)] border-[var(--border)] hover:bg-[var(--surface-muted)]/50'
              }`}
            >
              <div className="w-8 h-8 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center shrink-0 mt-0.5">
                {getIcon(item.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {item.title}
                  </h4>
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[var(--accent)] shrink-0" />
                  )}
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
                <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] mt-1.5 font-mono tabular-nums">
                  <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>{item.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
