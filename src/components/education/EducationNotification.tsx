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
        return <AlertTriangle className="w-4 h-4 text-[#D97706]" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />;
      default:
        return <Info className="w-4 h-4 text-[#0057B8]" />;
    }
  };

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-[#DCE7F2]">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-[#0057B8]" />
          <h3 className="font-extrabold text-base text-[#172B4D]">Thông Báo Mới</h3>
          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#EAF5FF] text-[#0057B8] border border-[#d2e7fc]">
            {notifications.filter((n) => !n.isRead).length}
          </span>
        </div>
        {onClearAll && notifications.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs font-semibold text-[#0057B8] hover:underline cursor-pointer"
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="py-8 text-center text-[#60758D] text-xs">
          Không có thông báo mới nào
        </div>
      ) : (
        <div className="space-y-2.5">
          {notifications.map((item) => (
            <div
              key={item.id}
              onClick={() => onMarkAsRead && onMarkAsRead(item.id)}
              className={`p-3.5 rounded-[16px] border transition-all duration-150 flex items-start gap-3 cursor-pointer ${
                !item.isRead
                  ? 'bg-[#EAF5FF]/90 border-[#bcdbfc] hover:bg-[#dff0ff]'
                  : 'bg-white border-[#DCE7F2] hover:bg-[#F5F9FD]'
              }`}
            >
              <div className="p-2 rounded-xl bg-white border border-[#DCE7F2] shadow-2xs shrink-0 mt-0.5">
                {getIcon(item.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs md:text-sm font-bold text-[#172B4D] truncate">
                    {item.title}
                  </h4>
                  {!item.isRead && (
                    <span className="w-2 h-2 rounded-full bg-[#087FEA] shrink-0" />
                  )}
                </div>
                <p className="text-xs text-[#60758D] mt-0.5 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
                <div className="flex items-center gap-1 text-[11px] text-[#60758D]/80 mt-1.5 font-medium">
                  <Clock className="w-3 h-3" />
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
