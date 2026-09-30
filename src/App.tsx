import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { AppLayout } from './components/Layout/AppLayout.tsx';
import { LandingPage } from './pages/LandingPage.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { DevicesPage } from './pages/DevicesPage.tsx';
import { DeviceDetailPage } from './pages/DeviceDetailPage.tsx';
import { MapOverviewPage } from './pages/MapOverviewPage.tsx';
import { ActivityPage } from './pages/ActivityPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { AppWebMonitorPage } from './pages/AppWebMonitorPage.tsx';
import { AccountsManagementPage } from './pages/AccountsManagementPage.tsx';
import { MobileSimulatorModal } from './components/Simulator/MobileSimulatorModal.tsx';
import { AddDeviceModal } from './components/Device/AddDeviceModal.tsx';
import { Device } from './types/index.ts';
import { api } from './services/api.ts';
import { Clock, ShieldCheck, RefreshCw, LogOut, XCircle } from 'lucide-react';

function AppContent() {
  const { user, isAuthenticated, isLoading, refreshUser, login, logout } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [navMessage, setNavMessage] = useState<string | undefined>(undefined);

  // Global modals
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simulatorDeviceId, setSimulatorDeviceId] = useState<string | undefined>(undefined);
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
    if (
      isAuthenticated &&
      user &&
      (user.role === 'ADMIN' || user.approvalStatus === 'APPROVED')
    ) {
      const res = await api.getDevices();
      if (res.success && res.data) {
        setDevices(res.data);
      }
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadDevicesList();
    }
  }, [isAuthenticated, user?.id, user?.approvalStatus, currentPath]);

  const handleOpenSimulator = (deviceId?: string) => {
    setSimulatorDeviceId(deviceId);
    setIsSimulatorOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
          Đang tải hệ thống DeviceMonitor...
        </p>
      </div>
    );
  }

  const isPublicRoute =
    currentPath === '/' || currentPath === '/login' || currentPath === '/register';
  if (!isAuthenticated && !isPublicRoute) {
    return (
      <LoginPage
        navigate={navigate}
        message="Vui lòng đăng nhập để truy cập trang quản trị."
      />
    );
  }

  if (currentPath === '/') {
    return <LandingPage navigate={navigate} />;
  }
  if (currentPath === '/login') {
    return <LoginPage navigate={navigate} message={navMessage} />;
  }
  if (currentPath === '/register') {
    return <RegisterPage navigate={navigate} />;
  }

  // Gate for Pending or Rejected Teacher / Parent accounts
  if (user && user.role !== 'ADMIN' && user.approvalStatus !== 'APPROVED') {
    const isRejected = user.approvalStatus === 'REJECTED';
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-5 shadow-lg">
          <div
            className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center ${
              isRejected
                ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}
          >
            {isRejected ? <XCircle className="w-7 h-7" /> : <Clock className="w-7 h-7" />}
          </div>

          <div>
            <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
              {isRejected
                ? 'Tài khoản chưa được Admin phê duyệt'
                : 'Tài khoản đang chờ Admin phê duyệt'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
              Xin chào <strong>{user.name}</strong> ({user.role === 'TEACHER' ? 'Giáo viên chủ nhiệm' : 'Phụ huynh học sinh'}). Theo quy định bảo mật của hệ thống, tài khoản của Giáo viên và Phụ huynh phải được <strong>Admin tối thượng duyệt</strong> trước khi xem dữ liệu thiết bị học sinh.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Họ và tên:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Email:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Vị trí đăng ký:</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                {user.role === 'TEACHER' ? 'Giáo viên chủ nhiệm' : 'Phụ huynh học sinh'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Trường học:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {user.schoolName || 'Chưa cập nhật'}
              </span>
            </div>
            {user.studentName && (
              <div className="flex justify-between">
                <span className="text-slate-400">Học sinh (Con):</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {user.studentName}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
            <button
              onClick={() => refreshUser()}
              className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-50 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Kiểm tra trạng thái duyệt</span>
            </button>

            <button
              onClick={async () => {
                const res = await login('admin@devicemonitor.vn', '123456');
                if (res.success) {
                  navigate('/accounts');
                }
              }}
              className="flex-1 py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Vào Admin để duyệt ngay</span>
            </button>
          </div>

          <button
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="text-xs text-slate-400 hover:text-slate-600 inline-flex items-center gap-1 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất tài khoản</span>
          </button>
        </div>
      </div>
    );
  }

  const deviceDetailMatch = currentPath.match(
    /^\/devices\/([^\/]+)(?:\/(location|history|usage))?$/
  );

  return (
    <AppLayout
      activePath={currentPath}
      navigate={navigate}
      onOpenSimulator={() => handleOpenSimulator()}
    >
      {currentPath === '/dashboard' && (
        <DashboardPage
          navigate={navigate}
          onOpenAddDevice={() => setIsAddDeviceOpen(true)}
          onOpenSimulator={() => handleOpenSimulator()}
        />
      )}

      {currentPath === '/devices' && (
        <DevicesPage
          navigate={navigate}
          onOpenAddDevice={() => setIsAddDeviceOpen(true)}
          onOpenSimulator={handleOpenSimulator}
        />
      )}

      {currentPath === '/app-usage' && (
        <AppWebMonitorPage
          navigate={navigate}
          onOpenSimulator={handleOpenSimulator}
        />
      )}

      {currentPath === '/accounts' && (
        <AccountsManagementPage navigate={navigate} />
      )}

      {deviceDetailMatch && (
        <DeviceDetailPage
          deviceId={deviceDetailMatch[1]}
          initialTab={deviceDetailMatch[2] || 'status'}
          navigate={navigate}
          onOpenSimulator={handleOpenSimulator}
        />
      )}

      {currentPath === '/map' && (
        <MapOverviewPage
          navigate={navigate}
          onOpenSimulator={handleOpenSimulator}
        />
      )}

      {currentPath === '/activity' && <ActivityPage />}

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

      {/* Global Mobile Simulator Modal */}
      <MobileSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        devices={devices}
        defaultDeviceId={simulatorDeviceId}
        onDataSent={() => {
          loadDevicesList();
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
