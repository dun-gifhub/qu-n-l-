import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { AppLayout } from './components/Layout/AppLayout.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { DevicesPage } from './pages/DevicesPage.tsx';
import { DeviceDetailPage } from './pages/DeviceDetailPage.tsx';
import { MapOverviewPage } from './pages/MapOverviewPage.tsx';
import { ActivityPage } from './pages/ActivityPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { AppWebMonitorPage } from './pages/AppWebMonitorPage.tsx';
import { PhoneReportPage } from './pages/PhoneReportPage.tsx';
import { AccountsManagementPage } from './pages/AccountsManagementPage.tsx';
import { AddDeviceModal } from './components/Device/AddDeviceModal.tsx';
import { Device } from './types/index.ts';
import { api } from './services/api.ts';
import { Clock, ShieldAlert, LogOut, RefreshCw, School, AlertCircle } from 'lucide-react';

function AppContent() {
  const { user, isAuthenticated, isLoading, logout, refreshUser } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [navMessage, setNavMessage] = useState<string | undefined>(undefined);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);

  // Global modals
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);

  const navigate = (path: string, options?: { message?: string }) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    if (options?.message) {
      setNavMessage(options.message);
    } else {
      setNavMessage(undefined);
    }
    window.scrollTo(0, 0);
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const loadDevicesList = async () => {
    if (!isAuthenticated) return;
    const res = await api.getDevices();
    if (res.success && res.data) {
      setDevices(res.data);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDevicesList();
    }
  }, [currentPath, isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
          Đang xác thực hệ thống DeviceMonitor...
        </p>
      </div>
    );
  }

  // 1. Mobile Phone Reporter Routes (dành cho điện thoại học sinh truyền tọa độ)
  if (
    currentPath === '/report' ||
    currentPath === '/tracker' ||
    currentPath === '/client' ||
    currentPath === '/connect'
  ) {
    return <PhoneReportPage navigate={navigate} />;
  }

  // 2. Auth Routes
  if (currentPath === '/register') {
    return <RegisterPage navigate={navigate} />;
  }

  // 3. BẮT BUỘC PHẢI ĐĂNG NHẬP MỚI CÓ THỂ XEM
  if (!isAuthenticated || !user) {
    return (
      <LoginPage
        navigate={navigate}
        message={
          navMessage ||
          (currentPath !== '/login'
            ? 'Bắt buộc phải đăng nhập để xem thông tin và bản đồ thiết bị học sinh.'
            : undefined)
        }
      />
    );
  }

  // 4. Nếu tài khoản chưa được phê duyệt hoặc bị từ chối
  if (user.role !== 'ADMIN' && user.approvalStatus !== 'APPROVED') {
    const isPending = user.approvalStatus === 'PENDING';
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center">
          <div
            className={`w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4 ${
              isPending
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
            }`}
          >
            {isPending ? <Clock className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
          </div>

          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {isPending ? 'Tài Khoản Đang Chờ Phê Duyệt' : 'Tài Khoản Chưa Được Cấp Quyền'}
          </h2>

          <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {isPending
              ? 'Tài khoản của bạn đã được đăng ký thành công và đang chờ Quản trị viên (Admin) xét duyệt. Vui lòng liên hệ Admin nhà trường để được kích hoạt quyền xem.'
              : 'Tài khoản của bạn đã bị từ chối hoặc khóa bởi Quản trị viên. Vui lòng liên hệ Admin để biết thêm chi tiết.'}
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-left text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Họ và tên:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email:</span>
              <span className="font-mono text-slate-700 dark:text-slate-300">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Vai trò đăng ký:</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {user.role === 'TEACHER' ? 'Giáo viên phụ trách' : 'Phụ huynh học sinh'}
              </span>
            </div>
            {user.schoolName && (
              <div className="flex justify-between">
                <span className="text-slate-500">Trường:</span>
                <span className="text-slate-700 dark:text-slate-300">{user.schoolName}</span>
              </div>
            )}
            <div className="flex justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
              <span className="text-slate-500">Trạng thái:</span>
              <span
                className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                  isPending
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}
              >
                {isPending ? 'CHỜ DUYỆT' : 'TỪ CHỐI / KHÓA'}
              </span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={async () => {
                setIsRefreshingStatus(true);
                if (refreshUser) await refreshUser();
                setIsRefreshingStatus(false);
              }}
              disabled={isRefreshingStatus}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-xs transition"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshingStatus ? 'animate-spin' : ''}`} />
              <span>Kiểm tra lại trạng thái duyệt</span>
            </button>

            <button
              onClick={() => logout()}
              className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Đăng xuất tài khoản</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Parse device detail routes: /devices/:id or /devices/:id/(location|history|usage)
  const deviceDetailMatch = currentPath.match(
    /^\/devices\/([^\/]+)(?:\/(location|history|usage))?$/
  );

  return (
    <AppLayout activePath={currentPath} navigate={navigate}>
      {(currentPath === '/' || currentPath === '/dashboard') && (
        <DashboardPage
          navigate={navigate}
          onOpenAddDevice={() => setIsAddDeviceOpen(true)}
        />
      )}

      {currentPath === '/devices' && (
        <DevicesPage
          navigate={navigate}
          onOpenAddDevice={() => setIsAddDeviceOpen(true)}
        />
      )}

      {currentPath === '/app-usage' && (
        <AppWebMonitorPage navigate={navigate} />
      )}

      {deviceDetailMatch && (
        <DeviceDetailPage
          deviceId={deviceDetailMatch[1]}
          initialTab={deviceDetailMatch[2] || 'status'}
          navigate={navigate}
        />
      )}

      {currentPath === '/map' && (
        <MapOverviewPage navigate={navigate} />
      )}

      {currentPath === '/activity' && <ActivityPage />}

      {currentPath === '/accounts' && (
        <AccountsManagementPage navigate={navigate} />
      )}

      {currentPath === '/settings' && <SettingsPage />}

      {/* Global Add Device Modal */}
      <AddDeviceModal
        isOpen={isAddDeviceOpen}
        onClose={() => setIsAddDeviceOpen(false)}
        onDeviceCreated={(newDev) => {
          setDevices((prev) => [newDev, ...prev]);
          navigate(`/devices/${newDev.id}`);
        }}
      />
    </AppLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
