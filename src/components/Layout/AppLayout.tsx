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
  User as UserIcon,
  LogOut,
  Menu,
  X,
  Sun,
  Moon,
  Radio,
  Database,
  Play,
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
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Thiết bị', path: '/devices', icon: Smartphone },
    { label: 'Bản đồ vị trí', path: '/map', icon: MapPin },
    { label: 'Hoạt động', path: '/activity', icon: Activity },
    { label: 'Cài đặt & API', path: '/settings', icon: Settings },
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <span className="font-bold text-slate-900 dark:text-slate-100 tracking-tight text-base">
            Device<span className="text-indigo-600 dark:text-indigo-400">Monitor</span>
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

      {/* Sidebar (Desktop fixed, Mobile drawer) */}
      <aside
        className={`fixed md:sticky top-0 left-0 bottom-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-200 ease-in-out md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Logo & Brand */}
          <div
            className="h-16 flex items-center gap-3 px-6 border-b border-slate-100 dark:border-slate-800/80 cursor-pointer"
            onClick={() => handleNavClick('/dashboard')}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-lg">
                Device<span className="text-indigo-600 dark:text-indigo-400">Monitor</span>
              </span>
              <span className="block text-[10px] uppercase font-bold tracking-wider text-slate-400 -mt-0.5">
                IoT & Telemetry
              </span>
            </div>
          </div>

          {/* Nav Items */}
          <div className="p-4 space-y-1">
            <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Quản trị
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePath === item.path || (item.path !== '/dashboard' && activePath.startsWith(item.path));
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick simulator banner */}
          {onOpenSimulator && (
            <div className="px-4 py-2">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100/60 dark:from-indigo-950/40 dark:to-slate-900 border border-indigo-200/60 dark:border-indigo-800/50">
                <div className="flex items-center gap-2 mb-1 text-xs font-bold text-indigo-900 dark:text-indigo-300">
                  <Play className="w-3.5 h-3.5 fill-indigo-600 text-indigo-600 dark:fill-indigo-400 dark:text-indigo-400" />
                  <span>Mô phỏng Mobile</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
                  Bơm tọa độ GPS và pin để kiểm tra live map.
                </p>
                <button
                  onClick={onOpenSimulator}
                  className="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition"
                >
                  Mở Simulator
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Info & Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
          {/* DB Indicator */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-[11px] text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
            <span className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <span>DB:</span>
            </span>
            <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
              {dbStatus?.type || 'Neon PostgreSQL'}
            </span>
          </div>

          {/* User profile row */}
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
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Navbar */}
        <header className="hidden md:flex items-center justify-between h-16 px-8 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Hệ thống hoạt động bình thường
            </span>
            <span className="text-xs text-slate-400">
              REST API Mobile Ready
            </span>
          </div>

          <div className="flex items-center gap-3">
            {onOpenSimulator && (
              <button
                onClick={onOpenSimulator}
                className="py-1.5 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-xs font-semibold flex items-center gap-1.5 border border-indigo-200 dark:border-indigo-800 transition shadow-xs cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Mô phỏng Mobile App</span>
              </button>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              title={theme === 'dark' ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 p-1.5 pr-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition cursor-pointer"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {user?.name?.split(' ').slice(-1)[0] || 'Tài khoản'}
              </span>
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
