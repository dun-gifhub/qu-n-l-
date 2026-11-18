import React, { useState, useEffect } from 'react';
import { EducationHeader } from '../components/education/EducationHeader.tsx';
import { EducationSidebar } from '../components/education/EducationSidebar.tsx';
import {
  EducationNotification,
  EducationNotificationItem,
} from '../components/education/EducationNotification.tsx';
import { EducationModal } from '../components/education/EducationModal.tsx';
import { api } from '../services/api.ts';

interface TeacherLayoutProps {
  children: React.ReactNode;
  activePath: string;
  navigate: (path: string) => void;
}

export const TeacherLayout: React.FC<TeacherLayoutProps> = ({
  children,
  activePath,
  navigate,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<EducationNotificationItem[]>([
    {
      id: 'notif-1',
      title: 'Hệ thống định vị GPS đang hoạt động',
      description: 'Máy chủ tiếp nhận tọa độ và trạng thái thiết bị theo chu kỳ kết nối',
      timestamp: 'Trực tuyến',
      isRead: false,
      type: 'info',
    },
    {
      id: 'notif-2',
      title: 'Danh sách lớp học niên khóa 2026-2027',
      description: 'Đã đồng bộ dữ liệu thiết bị học sinh theo phân công lớp',
      timestamp: 'Hôm nay',
      isRead: false,
      type: 'success',
    },
  ]);

  useEffect(() => {
    api.getAllActivity().then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        const mapped: EducationNotificationItem[] = res.data.slice(0, 5).map((act) => ({
          id: act.id,
          title: act.studentName ? `${act.studentName} (${act.className || 'Học sinh'})` : act.deviceName,
          description: act.description,
          timestamp: new Date(act.timestamp).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isRead: false,
          type: act.type === 'IN_CLASS_ALERT' || act.type === 'UNINSTALLED' ? 'alert' : 'info',
        }));
        setNotifications((prev) => [...mapped, ...prev.slice(0, 2)]);
      }
    });
  }, [activePath]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] flex flex-col antialiased">
      <EducationHeader
        role="TEACHER"
        currentPath={activePath}
        navigate={navigate}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        unreadNotificationsCount={unreadCount}
        onToggleNotifications={() => setNotificationsOpen(true)}
      />

      <div className="flex-1 flex w-full">
        <EducationSidebar
          role="TEACHER"
          currentPath={activePath}
          navigate={navigate}
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        <main className="flex-1 md:pl-64 flex flex-col min-w-0">
          <div className="flex-1 max-w-[1440px] w-full mx-auto p-6 lg:p-8 space-y-6">
            {children}
          </div>
        </main>
      </div>

      <EducationModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Thông báo giáo viên"
        subtitle="Cảnh báo sử dụng thiết bị và cập nhật lớp học"
        maxWidth="md"
      >
        <EducationNotification
          notifications={notifications}
          onMarkAsRead={(id) => {
            setNotifications((prev) =>
              prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
            );
          }}
          onClearAll={() => {
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
          }}
        />
      </EducationModal>
    </div>
  );
};
