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
      description: 'Máy chủ tiếp nhận thông số GPS và trạng thái học sinh mỗi giây.',
      timestamp: 'Vừa xong',
      isRead: false,
      type: 'info',
    },
    {
      id: 'notif-2',
      title: 'Lịch giảng dạy & Quản lý lớp học',
      description: 'Đã đồng bộ danh sách học sinh theo khối và lớp niên khóa 2026-2027.',
      timestamp: '15 phút trước',
      isRead: false,
      type: 'success',
    },
  ]);

  // Load activities to convert into real-time notifications
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
    <div className="min-h-screen bg-[#F5F9FD] text-[#172B4D] font-education flex flex-col antialiased">
      {/* Top Sticky Header */}
      <EducationHeader
        role="TEACHER"
        currentPath={activePath}
        navigate={navigate}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
        unreadNotificationsCount={unreadCount}
        onToggleNotifications={() => setNotificationsOpen(true)}
      />

      {/* Main Body with Sidebar */}
      <div className="flex-1 flex w-full">
        {/* Sidebar Desktop & Mobile */}
        <EducationSidebar
          role="TEACHER"
          currentPath={activePath}
          navigate={navigate}
          isOpenMobile={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* Content Area with left padding on desktop to accommodate sidebar */}
        <main className="flex-1 md:pl-[260px] flex flex-col min-w-0">
          <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
            {children}
          </div>
        </main>
      </div>

      {/* Notifications Modal */}
      <EducationModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Trung Tâm Thông Báo Giáo Viên"
        subtitle="Cảnh báo sử dụng thiết bị, trạng thái lớp học và cập nhật mới"
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
