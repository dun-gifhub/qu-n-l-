import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { api } from '../../services/api.ts';
import {
  LayoutDashboard,
  Smartphone,
  MapPin,
  Activity,
  Settings,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Radio,
  Database,
  Play,
  Globe,
  Users,
  ShieldCheck,
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
  onOpenSimulator,
}) => {
  const { user, login, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ type: string; status: string } | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  useEffect(() => {
    api.checkHealth().then((res) => {
      if (res.success && res.data?.database) {
        setDbStatus(res.data.database);
      }
    });
  }, []);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      api.getUsers().then((res) => {
        if (res.success && res.data) {
          setPendingCount(res.data.filter((u) => u.approvalStatus === 'PENDING').length);
        }
      });
    } else {
      setPendingCount(0);
    }
  }, [user, activePath]);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    {
      label: user?.role === 'PARENT' ? 'Thiết bị của con' : 'Thiết bị học sinh',
      path: '/devices',
      icon: Smartphone,
    },
    { label: 'Giám sát App & Web', path: '/app-usage', icon: Globe },
    ...(user?.role === 'ADMIN' || user?.role === 'TEACHER'
      ? [
          {
            label: user.role === 'ADMIN' ? 'Duyệt & Quản lý TK' : 'Trường & Lớp học',
            path: '/accounts',
            icon: Users,
            badge: user.role === 'ADMIN' && pendingCount > 0 ? pendingCount : undefined,
          },
        ]
      : []),
    { label: 'Bản đồ vị trí', path: '/map', icon: MapPin },
    { label: 'Nhật ký hoạt động', path: '/activity', icon: Activity },
    { label: 'Cài đặt tài khoản', path: '/settings', icon: Settings },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleQuickRoleSwitch = async (email: string) => {
    setIsSwitchingRole(true);
    const res = await login(email, '123456');
    setIsSwitchingRole(false);
    if (res.success) {
      navigate('/dashboard');
    }
  };

  const roleBadgeLabel =
    user?.role === 'ADMIN'
      ? 'Admin Tối Thượng'
      : user?.role === 'TEACHER'
      ? 'Giáo Viên Chủ Nhiệm'
      : 'Phụ Huynh Học Sinh';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">
            <Radio className="w-4 h-4" />
          </div>
          <span className="font-bold text-slate-900 dark:text-slate-100 tracking-tight text-base">
            DeviceMonitor
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenSimulator && (
            <button
              onClick={onOpenSimulator}
              className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold flex items-center gap-1 border border-indigo-200 dark:border-indigo-800"
              title="Mô phỏng Mobile App"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          )}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand */}
          <div
            className="h-16 flex items-center gap-3 px-6 border-b border-slate-100 dark:border-slate-800/80 cursor-pointer"
            onClick={() => handleNavClick('/dashboard')}
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <Radio className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-lg block leading-none">
                DeviceMonitor
              </span>
              <span className="block text-[11px] font-medium text-indigo-600 dark:text-indigo-400 mt-1 truncate">
                {roleBadgeLabel}
              </span>
            </div>
          </div>

          {/* Current Role Context Summary */}
          <div className="px-4 pt-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 text-xs space-y-1">
              <div className="font-bold text-slate-900 dark:text-white truncate">
                {user?.name}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                {user?.role === 'ADMIN'
                  ? 'Quyền tối thượng · Giám sát toàn hệ thống'
                  : user?.role === 'TEACHER'
                  ? `Trường: ${user.schoolName || 'Chưa gán'}`
                  : `Con: ${user?.studentName || 'Học sinh'}`}
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <div className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activePath === item.path ||
                (item.path !== '/dashboard' && activePath.startsWith(item.path));
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-3 truncate">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                        isActive
                          ? 'bg-white text-indigo-600'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Role Switcher for testing the 3 positions */}
          <div className="px-4 py-2">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 space-y-2">
              <div className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                Chuyển nhanh 3 vị trí:
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                <button
                  type="button"
                  disabled={isSwitchingRole || user?.email === 'admin@devicemonitor.vn'}
                  onClick={() => handleQuickRoleSwitch('admin@devicemonitor.vn')}
                  className={`py-1.5 px-2.5 rounded-lg text-[11px] font-semibold text-left transition cursor-pointer truncate ${
                    user?.email === 'admin@devicemonitor.vn'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500'
                  }`}
                >
                  1. Admin Tối Thượng (Tất cả quyền)
                </button>
                <button
                  type="button"
                  disabled={isSwitchingRole || user?.email === 'gv.lan@lehongphong.edu.vn'}
                  onClick={() => handleQuickRoleSwitch('gv.lan@lehongphong.edu.vn')}
                  className={`py-1.5 px-2.5 rounded-lg text-[11px] font-semibold text-left transition cursor-pointer truncate ${
                    user?.email === 'gv.lan@lehongphong.edu.vn'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500'
                  }`}
                >
                  2. Giáo Viên CN (Trường LHP)
                </button>
                <button
                  type="button"
                  disabled={isSwitchingRole || user?.email === 'ph.minh@gmail.com'}
                  onClick={() => handleQuickRoleSwitch('ph.minh@gmail.com')}
                  className={`py-1.5 px-2.5 rounded-lg text-[11px] font-semibold text-left transition cursor-pointer truncate ${
                    user?.email === 'ph.minh@gmail.com'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-500'
                  }`}
                >
                  3. Phụ Huynh (Chỉ xem con mình)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* User Info & Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {user?.name || 'Người dùng'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {user?.email}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Navbar */}
        <header className="hidden md:flex items-center justify-between h-16 px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-bold text-slate-900 dark:text-white">
              {roleBadgeLabel}
            </span>
            <span>·</span>
            <span>
              {user?.role === 'ADMIN'
                ? 'Theo dõi toàn bộ tài khoản & duyệt Giáo viên / Phụ huynh'
                : user?.role === 'TEACHER'
                ? `Theo dõi học sinh trường ${user?.schoolName || ''}`
                : `Quản lý điện thoại con: ${user?.studentName || 'Học sinh'}`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user?.role === 'ADMIN' && pendingCount > 0 && (
              <button
                onClick={() => navigate('/accounts')}
                className="py-1.5 px-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold cursor-pointer whitespace-nowrap"
              >
                {pendingCount} tài khoản chờ Admin duyệt
              </button>
            )}

            {onOpenSimulator && (
              <button
                onClick={onOpenSimulator}
                className="py-1.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 text-xs font-semibold flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800 transition cursor-pointer whitespace-nowrap"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Mô phỏng Điện thoại Học sinh</span>
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
