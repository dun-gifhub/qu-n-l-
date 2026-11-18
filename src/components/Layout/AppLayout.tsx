import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { api } from '../../services/api.ts';
import { RealtimeToastContainer } from '../Notifications/RealtimeToastContainer.tsx';
import {
  LayoutDashboard,
  Smartphone,
  MapPin,
  Activity,
  Settings,
  LogOut,
  Sun,
  Moon,
  Menu,
  X,
  Radio,
  Globe,
  ExternalLink,
  Users,
  Clock,
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
  activePath: string;
  navigate: (path: string) => void;
  onOpenSimulator?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  activePath,
  navigate,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ type: string; status: string } | null>(null);

  useEffect(() => {
    api.checkHealth().then((res) => {
      if (res.success && res.data?.database) {
        setDbStatus(res.data.database);
      }
    });
  }, []);

  const navItems = [
    { label: 'Tổng quan giám sát', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Cổng điện thoại báo vào', path: '/report', icon: Radio },
    { label: 'Danh sách thiết bị', path: '/devices', icon: Smartphone },
    { label: 'Bản đồ Google Maps', path: '/map', icon: MapPin },
    ...(user?.role === 'ADMIN'
      ? [
          {
            label: 'Duyệt tài khoản',
            path: '/accounts',
            icon: Users,
          },
        ]
      : []),
    { label: 'Giám sát App & Web', path: '/app-usage', icon: Globe },
    { label: 'Giờ học theo khối', path: '/schedules', icon: Clock },
    { label: 'Nhật ký hoạt động', path: '/activity', icon: Activity },
    { label: 'Cài đặt hệ thống', path: '/settings', icon: Settings },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 h-14 bg-[var(--surface)] border-b border-[var(--border)] sticky top-0 z-30">
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/dashboard')}
        >
          <div className="w-8 h-8 rounded-[var(--radius-control)] bg-[var(--accent)] flex items-center justify-center text-[var(--on-accent)]">
            <Radio className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <span className="font-semibold text-[var(--text-primary)] text-base">
            DeviceMonitor
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/report')}
            className="h-8 px-3 rounded-[var(--radius-control)] bg-[var(--surface-muted)] text-[var(--text-primary)] text-xs font-medium flex items-center gap-2 border border-[var(--border)] cursor-pointer"
            title="Mở link để điện thoại báo vào"
          >
            <Radio className="w-4 h-4 text-[var(--text-secondary)]" strokeWidth={1.5} />
            <span>Link ĐT</span>
          </button>
          <button
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] rounded-[var(--radius-control)] cursor-pointer"
            aria-label="Chuyển giao diện sáng tối"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" strokeWidth={1.5} />
            ) : (
              <Moon className="w-4 h-4" strokeWidth={1.5} />
            )}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-8 h-8 flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--surface-muted)] rounded-[var(--radius-control)] cursor-pointer"
            aria-label="Menu"
          >
            {mobileMenuOpen ? (
              <X className="w-4 h-4" strokeWidth={1.5} />
            ) : (
              <Menu className="w-4 h-4" strokeWidth={1.5} />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-[var(--surface-overlay)]"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (256px) */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 md:h-screen z-40 w-64 bg-[var(--surface)] border-r border-[var(--border)] flex flex-col justify-between transition-transform duration-[var(--duration-base)] ease-[var(--ease-standard)] md:translate-x-0 shrink-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand */}
          <div
            className="h-16 flex items-center gap-3 px-4 border-b border-[var(--border)] cursor-pointer"
            onClick={() => handleNavClick('/dashboard')}
          >
            <div className="w-8 h-8 rounded-[var(--radius-control)] bg-[var(--accent)] flex items-center justify-center text-[var(--on-accent)] shrink-0">
              <Radio className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-[var(--text-primary)] text-base block leading-tight">
                DeviceMonitor
              </span>
              <span className="block text-[11px] font-mono text-[var(--text-muted)] truncate">
                {dbStatus?.type || 'Neon PostgreSQL'}
              </span>
            </div>
          </div>

          {/* Quick Action: Link để ĐT báo vào */}
          <div className="p-4 mx-3 mt-4 rounded-[var(--radius-card)] bg-[var(--surface-muted)] border border-[var(--border)] text-xs space-y-2">
            <div className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
              <span className="w-2 h-2 rounded-full bg-[var(--success)] telemetry-live-dot shrink-0" />
              <span>Điện thoại báo vào</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Mở link trên điện thoại học sinh để gửi tọa độ GPS và tình trạng pin
            </p>
            <button
              onClick={() => handleNavClick('/report')}
              className="w-full h-8 px-3 rounded-[var(--radius-control)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] font-medium text-xs flex items-center justify-center gap-2 transition-colors duration-[var(--duration-fast)] cursor-pointer"
            >
              <span>Mở cổng báo cáo</span>
              <ExternalLink className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>

          {/* Nav Items (36px row height, 4px gap, 16px stroke 1.5 icons) */}
          <div className="px-4 pt-6 pb-2 text-xs font-medium text-[var(--text-muted)]">
            Điều hướng quản trị
          </div>
          <nav className="px-3 pb-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activePath === item.path ||
                (item.path !== '/dashboard' && activePath.startsWith(item.path));
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full h-9 flex items-center gap-2 px-3 rounded-[var(--radius-control)] text-xs font-medium transition-[color,background-color,border-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer text-left ${
                    isActive
                      ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] border border-[var(--accent-border)]'
                      : 'text-[var(--text-secondary)] border border-transparent hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <span className="w-4 h-4 flex items-center justify-center shrink-0">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? 'text-[var(--accent-ink)]' : 'text-[var(--text-muted)]'
                      }`}
                      strokeWidth={1.5}
                    />
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Database Status & Footer */}
        <div className="p-4 border-t border-[var(--border)] space-y-3">
          <div className="p-2.5 rounded-[var(--radius-control)] bg-[var(--surface-muted)] border border-[var(--border)] text-xs flex items-center justify-between">
            <span className="text-[var(--text-secondary)]">Lưu trữ</span>
            <span className="font-mono text-[11px] font-medium text-[var(--text-primary)] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--success)]" />
              <span>{dbStatus?.type || 'PostgreSQL'}</span>
            </span>
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-[var(--radius-control)] bg-[var(--accent-soft)] text-[var(--accent-ink)] border border-[var(--accent-border)] font-medium text-xs flex items-center justify-center shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-[var(--text-primary)] truncate">
                  {user?.name || 'Quản trị viên'}
                </div>
                <div className="text-[11px] font-mono text-[var(--text-muted)] truncate">
                  {user?.email || 'admin@monitor.local'}
                </div>
              </div>
            </div>

            {user && (
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--danger)] rounded-[var(--radius-control)] hover:bg-[var(--danger-soft)] transition-colors duration-[var(--duration-fast)] cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Navbar */}
        <header className="hidden md:flex items-center justify-between h-16 px-8 bg-[var(--surface)] border-b border-[var(--border)] sticky top-0 z-20">
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <span className="font-medium text-[var(--text-primary)]">
              Hệ thống giám sát thiết bị học đường
            </span>
            <span>·</span>
            <span>Định vị GPS & nhật ký trực ban</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/report')}
              className="h-9 px-3 rounded-[var(--radius-control)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] text-xs font-medium flex items-center gap-2 border border-[var(--border)] transition-colors duration-[var(--duration-fast)] cursor-pointer whitespace-nowrap"
            >
              <Radio className="w-4 h-4 text-[var(--success)]" strokeWidth={1.5} />
              <span>Mở cổng điện thoại báo vào</span>
            </button>

            <button
              onClick={toggleTheme}
              className="w-9 h-9 flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] rounded-[var(--radius-control)] border border-[var(--border)] transition-colors duration-[var(--duration-fast)] cursor-pointer"
              title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" strokeWidth={1.5} />
              ) : (
                <Moon className="w-4 h-4" strokeWidth={1.5} />
              )}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Realtime Push Notification Toasts */}
      <RealtimeToastContainer navigate={navigate} />
    </div>
  );
};
