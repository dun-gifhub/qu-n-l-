import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Bell,
  GraduationCap,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Menu,
  X,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { EducationBadge } from './EducationBadge.tsx';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface EducationHeaderProps {
  role: 'TEACHER' | 'STUDENT' | 'PARENT';
  currentPath: string;
  navigate: (path: string) => void;
  onOpenMobileMenu?: () => void;
  unreadNotificationsCount?: number;
  onToggleNotifications?: () => void;
}

export const EducationHeader: React.FC<EducationHeaderProps> = ({
  role,
  currentPath,
  navigate,
  onOpenMobileMenu,
  unreadNotificationsCount = 0,
  onToggleNotifications,
}) => {
  const { user, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const roleLabel =
    role === 'TEACHER'
      ? 'Giáo Viên'
      : role === 'STUDENT'
      ? 'Học Sinh'
      : 'Phụ Huynh';

  const roleBadgeVariant = role === 'TEACHER' ? 'primary' : 'accent';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#DCE7F2] shadow-2xs font-education">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-18">
          {/* Left: Mobile hamburger & Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 rounded-xl text-[#172B4D] hover:bg-[#EAF5FF] transition cursor-pointer"
              aria-label="Mở menu"
            >
              <Menu className="w-5 h-5 text-[#0057B8]" />
            </button>

            <div
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-[14px] bg-[#0057B8] flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg text-[#003B7A] tracking-tight">
                    EduMonitor
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-[#FFD200] text-[#172B4D]">
                    PRO
                  </span>
                </div>
                <p className="text-[10px] text-[#60758D] font-medium hidden sm:block">
                  Cổng Thông Tin Học Đường Thông Minh
                </p>
              </div>
            </div>
          </div>

          {/* Right: Actions & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Phone Connect Link */}
            <button
              onClick={() => navigate('/report')}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#EAF5FF] hover:bg-[#d6ecff] text-[#0057B8] text-xs font-bold transition border border-[#DCE7F2] cursor-pointer"
              title="Mở đường dẫn báo cáo trên điện thoại"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Link ĐT Học Sinh</span>
            </button>

            {/* Notification Button */}
            <button
              onClick={onToggleNotifications}
              className="relative p-2.5 rounded-full bg-[#F5F9FD] hover:bg-[#EAF5FF] text-[#172B4D] hover:text-[#0057B8] transition cursor-pointer border border-[#DCE7F2]"
              aria-label="Xem thông báo"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#DC2626] text-white text-[9px] font-black flex items-center justify-center animate-pulse">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>

            {/* User Profile Dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1.5 pl-2.5 rounded-full hover:bg-[#F5F9FD] border border-transparent hover:border-[#DCE7F2] transition cursor-pointer"
              >
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-[#172B4D] truncate max-w-[140px]">
                    {user?.name || 'Tài khoản'}
                  </div>
                  <div className="text-[10px] text-[#0057B8] font-semibold">
                    {roleLabel} {user?.className ? `· Lớp ${user.className}` : ''}
                  </div>
                </div>

                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#087FEA] to-[#003B7A] text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs ring-2 ring-[#EAF5FF]">
                  {user?.name ? user.name.charAt(0) : 'U'}
                </div>

                <ChevronDown className="w-3.5 h-3.5 text-[#60758D] hidden sm:block" />
              </button>

              {profileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-[20px] border border-[#DCE7F2] shadow-[0_12px_32px_rgba(0,59,122,0.12)] p-2 z-50 animate-in fade-in duration-150">
                    <div className="p-3 border-b border-[#DCE7F2]/70 bg-[#F5F9FD] rounded-[14px] mb-1.5">
                      <div className="font-extrabold text-sm text-[#172B4D] truncate">
                        {user?.name}
                      </div>
                      <div className="text-xs text-[#60758D] font-mono truncate mt-0.5">
                        {user?.email}
                      </div>
                      <div className="mt-2 flex items-center gap-1.5">
                        <EducationBadge variant={roleBadgeVariant}>
                          {roleLabel}
                        </EducationBadge>
                        {user?.schoolName && (
                          <span className="text-[11px] text-[#60758D] truncate">
                            {user.schoolName}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        navigate('/profile');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[12px] text-xs font-bold text-[#172B4D] hover:bg-[#EAF5FF] hover:text-[#0057B8] transition cursor-pointer text-left"
                    >
                      <UserIcon className="w-4 h-4 text-[#0057B8]" />
                      <span>Thông tin hồ sơ</span>
                    </button>

                    <button
                      onClick={() => {
                        navigate('/settings');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[12px] text-xs font-bold text-[#172B4D] hover:bg-[#EAF5FF] hover:text-[#0057B8] transition cursor-pointer text-left"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#0057B8]" />
                      <span>Cài đặt & Đổi mật khẩu</span>
                    </button>

                    <div className="my-1 border-t border-[#DCE7F2]/70" />

                    <button
                      onClick={async () => {
                        setProfileDropdownOpen(false);
                        await logout();
                        navigate('/login');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[12px] text-xs font-bold text-[#DC2626] hover:bg-[#FEECEC] transition cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
