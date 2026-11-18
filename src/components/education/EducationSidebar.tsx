import React from 'react';
import {
  Home,
  BookOpen,
  Users,
  MapPin,
  Bell,
  Globe,
  User,
  Smartphone,
  ExternalLink,
  School,
  X,
  Clock,
} from 'lucide-react';

export interface EducationSidebarItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  badge?: string;
}

interface EducationSidebarProps {
  role: 'TEACHER' | 'STUDENT' | 'PARENT';
  currentPath: string;
  navigate: (path: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const EducationSidebar: React.FC<EducationSidebarProps> = ({
  role,
  currentPath,
  navigate,
  isOpenMobile,
  onCloseMobile,
}) => {
  const teacherNavItems: EducationSidebarItem[] = [
    { label: 'Tổng quan', path: '/dashboard', icon: Home },
    { label: 'Danh sách học sinh', path: '/devices', icon: Users },
    { label: 'Lớp học phụ trách', path: '/classes', icon: BookOpen },
    { label: 'Bản đồ Google Maps', path: '/map', icon: MapPin },
    { label: 'Giám sát App & Web', path: '/app-usage', icon: Globe },
    { label: 'Giờ học theo khối', path: '/schedules', icon: Clock },
    { label: 'Nhật ký & Cảnh báo', path: '/activity', icon: Bell },
    { label: 'Hồ sơ giáo viên', path: '/profile', icon: User },
  ];

  const studentNavItems: EducationSidebarItem[] = [
    { label: 'Tổng quan học tập', path: '/dashboard', icon: Home },
    { label: 'Thiết bị & An toàn', path: '/devices', icon: Smartphone },
    { label: 'Lớp học của em', path: '/classes', icon: BookOpen },
    { label: 'Bản đồ định vị GPS', path: '/map', icon: MapPin },
    { label: 'Nhật ký hoạt động', path: '/activity', icon: Bell },
    { label: 'Hồ sơ cá nhân', path: '/profile', icon: User },
  ];

  const navItems = role === 'TEACHER' ? teacherNavItems : studentNavItems;

  const handleItemClick = (path: string) => {
    navigate(path);
    onCloseMobile();
  };

  return (
    <>
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-[var(--surface-overlay)] z-50 md:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 md:z-30 w-64 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col justify-between transition-transform duration-[var(--duration-base)] ease-[var(--ease-standard)] md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Mobile Header */}
          <div className="flex md:hidden items-center justify-between p-4 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-[var(--radius-control)] bg-[var(--accent)] flex items-center justify-center text-[var(--on-accent)]">
                <School className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <span className="font-semibold text-base text-[var(--text-primary)]">
                EduMonitor
              </span>
            </div>
            <button
              onClick={onCloseMobile}
              className="p-2 rounded-[var(--radius-control)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] cursor-pointer"
              aria-label="Đóng menu"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>

          {/* Section Label */}
          <div className="px-4 pt-6 pb-2 text-xs font-medium text-[var(--text-muted)]">
            {role === 'TEACHER' ? 'Điều hướng giảng dạy' : 'Điều hướng học sinh'}
          </div>

          {/* Navigation Items (36px height, 4px gap, uniform 16px icon box, 8px label gap) */}
          <nav className="px-3 pb-4 space-y-1 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentPath === item.path ||
                (item.path !== '/dashboard' && currentPath.startsWith(item.path));

              return (
                <button
                  key={item.path}
                  onClick={() => handleItemClick(item.path)}
                  className={`w-full h-9 flex items-center justify-between px-3 rounded-[var(--radius-control)] text-xs font-medium transition-[color,background-color,border-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer text-left ${
                    isActive
                      ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] border border-[var(--accent-border)]'
                      : 'text-[var(--text-secondary)] border border-transparent hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-4 h-4 flex items-center justify-center shrink-0">
                      <Icon
                        className={`w-4 h-4 ${
                          isActive ? 'text-[var(--accent-ink)]' : 'text-[var(--text-muted)]'
                        }`}
                        strokeWidth={1.5}
                      />
                    </span>
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[11px] font-mono tabular-nums text-[var(--text-muted)]">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Card */}
        <div className="p-4 border-t border-[var(--border)]">
          <div className="p-4 rounded-[var(--radius-card)] bg-[var(--surface-muted)] border border-[var(--border)] space-y-2">
            <div className="text-xs font-medium text-[var(--text-primary)]">
              Cổng di động
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Truyền tọa độ GPS trực tiếp từ điện thoại học sinh
            </p>
            <button
              onClick={() => handleItemClick('/report')}
              className="w-full h-8 px-3 rounded-[var(--radius-control)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border-strong)] text-xs font-medium flex items-center justify-center gap-2 transition-colors duration-[var(--duration-fast)] cursor-pointer"
            >
              <span>Mở cổng báo cáo</span>
              <ExternalLink className="w-3.5 h-3.5 text-[var(--text-secondary)]" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
