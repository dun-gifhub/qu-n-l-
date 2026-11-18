import React, { useState, useEffect } from 'react';
import { EducationHeader } from '../components/education/EducationHeader.tsx';
import { EducationSidebar } from '../components/education/EducationSidebar.tsx';
import {
  EducationNotification,
  EducationNotificationItem,
} from '../components/education/EducationNotification.tsx';
import { EducationModal } from '../components/education/EducationModal.tsx';
import { api } from '../services/api.ts';

interface StudentLayoutProps {
  children: React.ReactNode;
  activePath: string;
  navigate: (path: string) => void;
}

export const StudentLayout: React.FC<StudentLayoutProps> = ({
  children,
  activePath,
  navigate,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<EducationNotificationItem[]>([
    {
      id: 'notif-stu-1',
      title: 'Theo dõi thiết bị & lịch học',
      description: 'Hiển thị trạng thái thiết bị, vị trí an toàn và thời lượng sử dụng trong ngày',
      timestamp: 'Hôm nay',
      isRead: false,
      type: 'info',
    },
  ]);

  useEffect(() => {
    api.getAllActivity().then((res) => {
      if (res.success && res.data && res.data.length > 0) {
        const mapped: EducationNotificationItem[] = res.data.slice(0, 3).map((act) => ({
          id: act.id,
          title: 'Hoạt động thiết bị',
          description: act.description,
          timestamp: new Date(act.timestamp).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          isRead: false,
          type: 'info',
        }));
        setNotifications((prev) => [...mapped, ...prev]);
      }
    });
  }, [activePath]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] flex flex-col antialiased">
      <EducationHeader
        role="STUDENT"
        currentPath={activePath}
        navigate={navigate}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        unreadNotificationsCount={unreadCount}
        onToggleNotifications={() => setNotificationsOpen(true)}
      />

      <div className="flex-1 flex w-full">
        <EducationSidebar
          role="STUDENT"
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
        title="Thông báo học sinh"
        subtitle="Cập nhật mới từ giáo viên và nhà trường"
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
