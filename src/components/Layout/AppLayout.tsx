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
  Share2,
  ExternalLink,
  Users,
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
    { label: 'Dashboard Giám Sát', path: '/dashboard', icon: LayoutDashboard },
    {
      label: '📱 Link ĐT Báo Vào',
      path: '/report',
      icon: Radio,
      badge: 'Render',
      isHighlight: true,
    },
    {
      label: 'Danh Sách Thiết Bị',
      path: '/devices',
      icon: Smartphone,
    },
    { label: 'Bản Đồ Google Maps', path: '/map', icon: MapPin },
    ...(user?.role === 'ADMIN'
      ? [
          {
            label: 'Duyệt Tài Khoản (Admin)',
            path: '/accounts',
            icon: Users,
            badge: 'Admin',
            isHighlight: true,
          },
        ]
      : []),
    { label: 'Giám Sát App & Web', path: '/app-usage', icon: Globe },
    { label: 'Nhật Ký Hoạt Động', path: '/activity', icon: Activity },
    { label: 'Cài Đặt Hệ Thống', path: '/settings', icon: Settings },
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
          <button
            onClick={() => navigate('/report')}
            className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800"
            title="Mở link để điện thoại báo vào"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Link ĐT</span>
          </button>
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
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <Radio className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-lg block leading-none">
                DeviceMonitor
              </span>
              <span className="block text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mt-1 truncate">
                Neon PostgreSQL & Render
              </span>
            </div>
          </div>

          {/* Quick Action: Link để ĐT báo vào */}
          <div className="p-3 mx-3 mt-3 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/60 text-xs">
            <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-200">
              <Radio className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
              <span>Điện thoại báo vào:</span>
            </div>
            <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80 mt-1 leading-relaxed">
              Mở link trên điện thoại học sinh để định vị GPS & tình trạng pin tự động báo về.
            </p>
            <button
              onClick={() => handleNavClick('/report')}
              className="mt-2 w-full py-1.5 px-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <span>Mở Link Báo Cáo</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {/* Nav Items */}
          <div className="p-3 space-y-1">
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
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : item.isHighlight
                      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/30 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/60'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-3 truncate">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </span>
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                        isActive
                          ? 'bg-white text-indigo-600'
                          : 'bg-emerald-500 text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Database Status & Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800 text-[11px] flex items-center justify-between">
            <span className="text-slate-500 dark:text-slate-400">Database:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              {dbStatus?.type || 'Neon PostgreSQL'}
            </span>
          </div>

          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                  {user?.name || 'Quản lý Hệ thống'}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {user?.email || 'admin@monitor.local'}
                </div>
              </div>
            </div>

            {user && (
              <button
                onClick={handleLogout}
                title="Đăng xuất"
                className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop Top Navbar */}
        <header className="hidden md:flex items-center justify-between h-16 px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-20">
          <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-bold text-slate-900 dark:text-white">
              Hệ Thống Giám Sát Thiết Bị
            </span>
            <span>·</span>
            <span>Kết nối Neon PostgreSQL & Render · Báo cáo định vị thời gian thực</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/report')}
              className="py-1.5 px-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800 transition cursor-pointer whitespace-nowrap shadow-xs"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
              <span>📱 Mở Link Điện Thoại Báo Vào</span>
            </button>

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

      {/* Global Realtime Push Notification Toasts */}
      <RealtimeToastContainer navigate={navigate} />
    </div>
  );
};
