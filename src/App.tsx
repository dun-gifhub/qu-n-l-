import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { AppLayout } from './components/Layout/AppLayout.tsx';
import { TeacherLayout } from './layouts/TeacherLayout.tsx';
import { StudentLayout } from './layouts/StudentLayout.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { RegisterPage } from './pages/RegisterPage.tsx';

// Admin Pages (100% giữ nguyên cho Admin)
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

// Teacher Pages (EdTech Design System mới)
import { TeacherDashboardPage } from './pages/teacher/TeacherDashboardPage.tsx';
import { TeacherClassesPage } from './pages/teacher/TeacherClassesPage.tsx';
import { TeacherProfilePage } from './pages/teacher/TeacherProfilePage.tsx';

// Student Pages (EdTech Design System mới)
import { StudentDashboardPage } from './pages/student/StudentDashboardPage.tsx';
import { StudentClassesPage } from './pages/student/StudentClassesPage.tsx';
import { StudentProfilePage } from './pages/student/StudentProfilePage.tsx';

import { Device } from './types/index.ts';
import { api } from './services/api.ts';
import { Clock, ShieldAlert, LogOut, RefreshCw, School, AlertCircle, GraduationCap } from 'lucide-react';
import { EducationButton } from './components/education/EducationButton.tsx';
import { EducationBadge } from './components/education/EducationBadge.tsx';

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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center font-education">
        <div className="w-10 h-10 border-4 border-[#0057B8] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs font-semibold text-[#60758D]">
          Đang xác thực hệ thống Giáo Dục EduMonitor...
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
            ? 'Bắt buộc phải đăng nhập để xem thông tin và bản đồ học sinh.'
            : undefined)
        }
      />
    );
  }

  // 4. Nếu tài khoản chưa được phê duyệt hoặc bị từ chối
  if (user.role !== 'ADMIN' && user.approvalStatus !== 'APPROVED') {
    const isPending = user.approvalStatus === 'PENDING';
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#F5F9FD] via-[#EAF5FF]/50 to-[#F5F9FD] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-education">
        <div className="max-w-md w-full bg-white rounded-[26px] p-8 border border-[#DCE7F2] shadow-[0_20px_50px_rgba(0,59,122,0.08)] text-center space-y-4">
          <div
            className={`w-16 h-16 rounded-[20px] mx-auto flex items-center justify-center ${
              isPending
                ? 'bg-[#FFF9D6] text-[#8C6B00] border border-[#FFE770]'
                : 'bg-[#FEECEC] text-[#DC2626] border border-[#FECACA]'
            }`}
          >
            {isPending ? <Clock className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
          </div>

          <div className="space-y-1">
            <h2 className="text-xl font-extrabold text-[#172B4D]">
              {isPending ? 'Tài Khoản Đang Chờ Phê Duyệt' : 'Tài Khoản Chưa Được Kích Hoạt'}
            </h2>
            <p className="text-xs text-[#60758D] leading-relaxed">
              {isPending
                ? 'Hồ sơ Giáo viên / Học sinh của bạn đã được đăng ký thành công và đang chờ Quản trị viên (Admin) xét duyệt. Vui lòng liên hệ Admin nhà trường để được kích hoạt quyền truy cập.'
                : 'Tài khoản của bạn đã bị từ chối hoặc tạm khóa. Vui lòng liên hệ Admin để được hỗ trợ.'}
            </p>
          </div>

          <div className="p-4 rounded-[18px] bg-[#F5F9FD] border border-[#DCE7F2] text-left text-xs space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-[#60758D]">Họ và tên:</span>
              <span className="font-extrabold text-[#172B4D]">{user.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#60758D]">Tài khoản:</span>
              <span className="font-mono text-[#172B4D]">{user.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#60758D]">Vai trò:</span>
              <EducationBadge variant="primary">
                {user.role === 'TEACHER' ? 'Giáo Viên' : 'Học Sinh / PH'}
              </EducationBadge>
            </div>
            {user.schoolName && (
              <div className="flex justify-between items-center">
                <span className="text-[#60758D]">Trường học:</span>
                <span className="font-semibold text-[#172B4D]">{user.schoolName}</span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-[#DCE7F2]">
              <span className="text-[#60758D]">Trạng thái:</span>
              <EducationBadge variant={isPending ? 'warning' : 'danger'}>
                {isPending ? 'ĐANG CHỜ DUYỆT' : 'CHƯA ĐƯỢC DUYỆT'}
              </EducationBadge>
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <EducationButton
              variant="primary"
              pill
              className="w-full"
              isLoading={isRefreshingStatus}
              icon={<RefreshCw className={`w-4 h-4 ${isRefreshingStatus ? 'animate-spin' : ''}`} />}
              onClick={async () => {
                setIsRefreshingStatus(true);
                if (refreshUser) await refreshUser();
                setIsRefreshingStatus(false);
              }}
            >
              Kiểm Tra Lại Trạng Thái
            </EducationButton>

            <EducationButton
              variant="outline"
              pill
              className="w-full"
              icon={<LogOut className="w-4 h-4" />}
              onClick={() => logout()}
            >
              Đăng Xuất
            </EducationButton>
          </div>
        </div>
      </div>
    );
  }

  // Parse device detail routes: /devices/:id or /devices/:id/(location|history|usage)
  const deviceDetailMatch = currentPath.match(
    /^\/devices\/([^\/]+)(?:\/(location|history|usage))?$/
  );

  // =========================================================================
  // XXI. ADMIN — TUYỆT ĐỐI GIỮ NGUYÊN 100% GIAO DIỆN HIỆN TẠI
  // =========================================================================
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

  // =========================================================================
  // TEACHER LAYOUT & EDTECH PAGES
  // =========================================================================
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

        {currentPath === '/activity' && <ActivityPage />}

        {(currentPath === '/profile' || currentPath === '/settings') && (
          <TeacherProfilePage />
        )}

        {/* Global Add Device Modal */}
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

  // =========================================================================
  // STUDENT / PARENT LAYOUT & EDTECH PAGES
  // =========================================================================
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
