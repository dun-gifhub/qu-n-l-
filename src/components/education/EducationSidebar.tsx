import React from 'react';
import {
  Home,
  BookOpen,
  Users,
  MapPin,
  Bell,
  Globe,
  User,
  Shield,
  Smartphone,
  ExternalLink,
  School,
  X,
} from 'lucide-react';

export interface EducationSidebarItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeVariant?: 'accent' | 'primary';
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
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-[#001D40]/40 backdrop-blur-xs z-50 md:hidden animate-in fade-in"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 md:z-30 w-[260px] bg-white border-r border-[#DCE7F2] flex flex-col justify-between transition-transform duration-300 md:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        } font-education`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Mobile Header with close button */}
          <div className="flex md:hidden items-center justify-between p-4 border-b border-[#DCE7F2]">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#0057B8] flex items-center justify-center text-white font-bold">
                <School className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-base text-[#003B7A]">
                EduMonitor
              </span>
            </div>
            <button
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-[#60758D] hover:bg-[#EAF5FF]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Section Label */}
          <div className="px-5 pt-6 pb-2 text-[11px] font-extrabold uppercase tracking-wider text-[#60758D]">
            {role === 'TEACHER' ? 'Menu Giảng Dạy' : 'Menu Học Sinh & PH'}
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1.5 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                currentPath === item.path ||
                (item.path !== '/dashboard' && currentPath.startsWith(item.path));

              return (
                <button
                  key={item.path}
                  onClick={() => handleItemClick(item.path)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-[14px] text-xs font-bold transition-all duration-150 cursor-pointer text-left ${
                    isActive
                      ? 'bg-[#EAF5FF] text-[#0057B8] shadow-2xs font-extrabold'
                      : 'text-[#172B4D] hover:bg-[#F5F9FD] hover:text-[#0057B8]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`p-1.5 rounded-[10px] transition-colors ${
                        isActive
                          ? 'bg-[#0057B8] text-white shadow-2xs'
                          : 'bg-[#F5F9FD] text-[#60758D]'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="truncate">{item.label}</span>
                  </div>

                  {isActive && (
                    <span className="w-1.5 h-4 rounded-full bg-[#FFD200] shrink-0" />
                  )}

                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.badgeVariant === 'accent'
                          ? 'bg-[#FFD200] text-[#172B4D]'
                          : 'bg-[#0057B8] text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Card */}
        <div className="p-4 border-t border-[#DCE7F2]/80 bg-[#F5F9FD]/60">
          <div className="p-3.5 rounded-[16px] bg-gradient-to-br from-[#0057B8] to-[#003B7A] text-white space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#FFD200] uppercase tracking-wider">
                Cổng di động
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-xs font-semibold leading-snug">
              Truyền tọa độ GPS trực tiếp từ điện thoại học sinh
            </p>
            <button
              onClick={() => handleItemClick('/report')}
              className="w-full mt-1 py-1.5 px-3 rounded-full bg-white hover:bg-[#FFD200] text-[#003B7A] hover:text-[#172B4D] text-[11px] font-extrabold flex items-center justify-center gap-1 transition cursor-pointer"
            >
              <span>Mở link báo cáo</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
