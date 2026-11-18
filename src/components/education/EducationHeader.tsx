import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  Bell,
  GraduationCap,
  LogOut,
  User as UserIcon,
  ChevronDown,
  Menu,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { EducationBadge } from './EducationBadge.tsx';

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
  navigate,
  onOpenMobileMenu,
  unreadNotificationsCount = 0,
  onToggleNotifications,
}) => {
  const { user, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const roleLabel =
    role === 'TEACHER'
      ? 'Giáo viên'
      : role === 'STUDENT'
      ? 'Học sinh'
      : 'Phụ huynh';

  const roleBadgeVariant = role === 'TEACHER' ? 'primary' : 'neutral';

  return (
    <header className="sticky top-0 z-40 bg-[var(--surface)] border-b border-[var(--border)]">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile hamburger & Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={onOpenMobileMenu}
              className="md:hidden p-2 rounded-[var(--radius-control)] text-[var(--text-primary)] hover:bg-[var(--surface-muted)] transition-colors duration-[var(--duration-fast)] cursor-pointer"
              aria-label="Mở menu"
            >
              <Menu className="w-5 h-5 text-[var(--text-secondary)]" strokeWidth={1.5} />
            </button>

            <div
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="w-9 h-9 rounded-[var(--radius-control)] bg-[var(--accent)] flex items-center justify-center text-[var(--on-accent)]">
                <GraduationCap className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <div>
                <span className="font-semibold text-base text-[var(--text-primary)] block leading-tight">
                  EduMonitor
                </span>
                <p className="text-xs text-[var(--text-muted)] hidden sm:block">
                  Điều phối thiết bị học đường
                </p>
              </div>
            </div>
          </div>

          {/* Right: Actions & User Profile */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/report')}
              className="hidden lg:inline-flex items-center gap-2 px-3 h-9 rounded-[var(--radius-control)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] text-xs font-medium transition-colors duration-[var(--duration-fast)] border border-[var(--border)] cursor-pointer"
              title="Mở đường dẫn báo cáo trên điện thoại"
            >
              <Smartphone className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
              <span>Cổng báo cáo điện thoại</span>
            </button>

            <button
              onClick={onToggleNotifications}
              className="relative w-9 h-9 rounded-[var(--radius-control)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center transition-colors duration-[var(--duration-fast)] cursor-pointer border border-[var(--border)]"
              aria-label="Xem thông báo"
            >
              <Bell className="w-4 h-4" strokeWidth={1.5} />
              {unreadNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-[4px] bg-[var(--danger)] text-[var(--on-accent)] text-[11px] font-mono font-medium tabular-nums flex items-center justify-center">
                  {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                </span>
              )}
            </button>

            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                className="flex items-center gap-2 p-1.5 rounded-[var(--radius-control)] hover:bg-[var(--surface-muted)] border border-transparent hover:border-[var(--border)] transition-colors duration-[var(--duration-fast)] cursor-pointer"
              >
                <div className="text-right hidden sm:block px-1">
                  <div className="text-xs font-medium text-[var(--text-primary)] truncate max-w-[160px]">
                    {user?.name || 'Tài khoản'}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    {roleLabel} {user?.className ? `· Lớp ${user.className}` : ''}
                  </div>
                </div>

                <div className="w-8 h-8 rounded-[var(--radius-control)] bg-[var(--accent-soft)] text-[var(--accent-ink)] border border-[var(--accent-border)] flex items-center justify-center font-medium text-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>

                <ChevronDown className="w-4 h-4 text-[var(--text-muted)] hidden sm:block" strokeWidth={1.5} />
              </button>

              {profileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProfileDropdownOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border-strong)] shadow-[var(--shadow-elevated)] p-2 z-50">
                    <div className="p-3 border-b border-[var(--border)] bg-[var(--surface-muted)] rounded-[var(--radius-control)] mb-2">
                      <div className="font-semibold text-sm text-[var(--text-primary)] truncate">
                        {user?.name}
                      </div>
                      <div className="text-xs text-[var(--text-muted)] font-mono truncate mt-0.5">
                        {user?.email}
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <EducationBadge variant={roleBadgeVariant}>
                          {roleLabel}
                        </EducationBadge>
                        {user?.schoolName && (
                          <span className="text-[11px] text-[var(--text-secondary)] truncate">
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
                      className="w-full h-9 flex items-center gap-2 px-3 rounded-[var(--radius-control)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-muted)] transition-colors duration-[var(--duration-fast)] cursor-pointer text-left"
                    >
                      <UserIcon className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
                      <span>Thông tin hồ sơ</span>
                    </button>

                    <button
                      onClick={() => {
                        navigate('/settings');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full h-9 flex items-center gap-2 px-3 rounded-[var(--radius-control)] text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-muted)] transition-colors duration-[var(--duration-fast)] cursor-pointer text-left"
                    >
                      <ShieldCheck className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
                      <span>Cài đặt & Đổi mật khẩu</span>
                    </button>

                    <div className="my-1 border-t border-[var(--border)]" />

                    <button
                      onClick={async () => {
                        setProfileDropdownOpen(false);
                        await logout();
                        navigate('/login');
                      }}
                      className="w-full h-9 flex items-center gap-2 px-3 rounded-[var(--radius-control)] text-xs font-medium text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors duration-[var(--duration-fast)] cursor-pointer text-left"
                    >
                      <LogOut className="w-4 h-4" strokeWidth={1.5} />
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
