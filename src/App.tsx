import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { AppLayout } from './components/Layout/AppLayout.tsx';
import { TeacherLayout } from './layouts/TeacherLayout.tsx';
import { StudentLayout } from './layouts/StudentLayout.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';

// Admin Pages
import { DashboardPage } from './pages/DashboardPage.tsx';
import { DevicesPage } from './pages/DevicesPage.tsx';
import { DeviceDetailPage } from './pages/DeviceDetailPage.tsx';
import { MapOverviewPage } from './pages/MapOverviewPage.tsx';
import { ActivityPage } from './pages/ActivityPage.tsx';
import { SettingsPage } from './pages/SettingsPage.tsx';
import { AppWebMonitorPage } from './pages/AppWebMonitorPage.tsx';
import { AccountsManagementPage } from './pages/AccountsManagementPage.tsx';
import { AddDeviceModal } from './components/Device/AddDeviceModal.tsx';
import { PhoneReportPage } from './pages/PhoneReportPage.tsx';
import { SchedulesPage } from './pages/SchedulesPage.tsx';

// Teacher Pages
import { TeacherDashboardPage } from './pages/teacher/TeacherDashboardPage.tsx';
import { TeacherClassesPage } from './pages/teacher/TeacherClassesPage.tsx';
import { TeacherProfilePage } from './pages/teacher/TeacherProfilePage.tsx';

// Student Pages
import { StudentDashboardPage } from './pages/student/StudentDashboardPage.tsx';
import { StudentClassesPage } from './pages/student/StudentClassesPage.tsx';
import { StudentProfilePage } from './pages/student/StudentProfilePage.tsx';

import { Device } from './types/index.ts';
import { api } from './services/api.ts';
import { Clock, ShieldAlert, LogOut, RefreshCw } from 'lucide-react';
import { EducationButton } from './components/education/EducationButton.tsx';
import { EducationBadge } from './components/education/EducationBadge.tsx';

function AppContent() {
  const { user, isAuthenticated, isLoading, logout, refreshUser } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [navMessage, setNavMessage] = useState<string | undefined>(undefined);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);

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
      <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs font-medium text-[var(--text-secondary)]">
          Đang xác thực hệ thống EduMonitor
        </p>
      </div>
    );
  }

  // 1. Mobile Phone Reporter Routes
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

  // 3. Authentication Gate
  if (!isAuthenticated || !user) {
    return (
      <LoginPage
        navigate={navigate}
        message={
          navMessage ||
          (currentPath !== '/login'
            ? 'Yêu cầu đăng nhập để xem thông tin thiết bị và bản đồ học sinh.'
            : undefined)
        }
      />
    );
  }

  // 4. Approval Gate
  if (user.role !== 'ADMIN' && user.approvalStatus !== 'APPROVED') {
    const isPending = user.approvalStatus === 'PENDING';
    return (
      <div className="min-h-screen bg-[var(--bg)] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-[var(--surface)] rounded-[var(--radius-panel)] p-6 border border-[var(--border)] shadow-[var(--shadow-elevated)] text-center space-y-5">
          <div
            className={`w-12 h-12 rounded-[var(--radius-card)] mx-auto flex items-center justify-center ${
              isPending
                ? 'bg-[var(--warning-soft)] text-[var(--warning)] border border-[var(--warning-border)]'
                : 'bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger-border)]'
            }`}
          >
            {isPending ? (
              <Clock className="w-5 h-5" strokeWidth={1.5} />
            ) : (
              <ShieldAlert className="w-5 h-5" strokeWidth={1.5} />
            )}
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">
              {isPending ? 'Tài khoản đang chờ phê duyệt' : 'Tài khoản chưa được kích hoạt'}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              {isPending
                ? 'Hồ sơ Giáo viên hoặc Phụ huynh của bạn đã được đăng ký và đang chờ Quản trị viên xét duyệt. Vui lòng liên hệ Quản trị viên nhà trường để kích hoạt quyền truy cập.'
                : 'Tài khoản của bạn đã bị từ chối hoặc tạm khóa. Vui lòng liên hệ Quản trị viên để được hỗ trợ.'}
            </p>
          </div>

          <div className="p-4 rounded-[var(--radius-card)] bg-[var(--surface-muted)] border border-[var(--border)] text-left text-xs space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-secondary)]">Họ và tên</span>
              <span className="font-medium text-[var(--text-primary)]">{user.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-secondary)]">Tài khoản</span>
              <span className="font-mono text-[var(--text-primary)]">{user.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[var(--text-secondary)]">Vai trò</span>
              <EducationBadge variant="primary">
                {user.role === 'TEACHER' ? 'Giáo viên' : 'Phụ huynh'}
              </EducationBadge>
            </div>
            {user.schoolName && (
              <div className="flex justify-between items-center">
                <span className="text-[var(--text-secondary)]">Trường học</span>
                <span className="font-medium text-[var(--text-primary)]">{user.schoolName}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-[var(--border)]">
              <span className="text-[var(--text-secondary)]">Trạng thái</span>
              <EducationBadge variant={isPending ? 'warning' : 'danger'}>
                {isPending ? 'Đang chờ duyệt' : 'Chưa được duyệt'}
              </EducationBadge>
            </div>
          </div>

          <div className="pt-1 flex flex-col gap-2">
            <EducationButton
              variant="primary"
              className="w-full"
              isLoading={isRefreshingStatus}
              icon={<RefreshCw className={`w-4 h-4 ${isRefreshingStatus ? 'animate-spin' : ''}`} strokeWidth={1.5} />}
              onClick={async () => {
                setIsRefreshingStatus(true);
                if (refreshUser) await refreshUser();
                setIsRefreshingStatus(false);
              }}
            >
              Kiểm tra lại trạng thái
            </EducationButton>

            <EducationButton
              variant="outline"
              className="w-full"
              icon={<LogOut className="w-4 h-4" strokeWidth={1.5} />}
              onClick={() => logout()}
            >
              Đăng xuất
            </EducationButton>
          </div>
        </div>
      </div>
    );
  }

  const deviceDetailMatch = currentPath.match(
    /^\/devices\/([^\/]+)(?:\/(location|history|usage))?$/
  );

  // ADMIN
  if (user.role === 'ADMIN') {
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

        {currentPath === '/schedules' && <SchedulesPage />}

        {currentPath === '/settings' && <SettingsPage />}

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

  // TEACHER
  if (user.role === 'TEACHER') {
    return (
      <TeacherLayout activePath={currentPath} navigate={navigate}>
        {(currentPath === '/' || currentPath === '/dashboard') && (
          <TeacherDashboardPage
            navigate={navigate}
            onOpenAddDevice={() => setIsAddDeviceOpen(true)}
          />
        )}

        {currentPath === '/classes' && (
          <TeacherClassesPage navigate={navigate} />
        )}

        {currentPath === '/devices' && (
          <TeacherDashboardPage
            navigate={navigate}
            onOpenAddDevice={() => setIsAddDeviceOpen(true)}
          />
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

        {currentPath === '/app-usage' && (
          <AppWebMonitorPage navigate={navigate} />
        )}

        {currentPath === '/schedules' && <SchedulesPage />}

        {currentPath === '/activity' && <ActivityPage />}

        {(currentPath === '/profile' || currentPath === '/settings') && (
          <TeacherProfilePage />
        )}

        <AddDeviceModal
          isOpen={isAddDeviceOpen}
          onClose={() => setIsAddDeviceOpen(false)}
          onDeviceCreated={(newDev) => {
            setDevices((prev) => [newDev, ...prev]);
            navigate(`/devices/${newDev.id}`);
          }}
        />
      </TeacherLayout>
    );
  }

  // STUDENT / PARENT
  return (
    <StudentLayout activePath={currentPath} navigate={navigate}>
      {(currentPath === '/' || currentPath === '/dashboard') && (
        <StudentDashboardPage navigate={navigate} />
      )}

      {currentPath === '/classes' && (
        <StudentClassesPage navigate={navigate} />
      )}

      {currentPath === '/devices' && (
        <StudentDashboardPage navigate={navigate} />
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

      {currentPath === '/schedules' && <SchedulesPage />}

      {currentPath === '/activity' && <ActivityPage />}

      {(currentPath === '/profile' || currentPath === '/settings') && (
        <StudentProfilePage />
      )}
    </StudentLayout>
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
