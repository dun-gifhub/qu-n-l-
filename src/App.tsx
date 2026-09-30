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
import { PhoneReportPage } from './pages/PhoneReportPage.tsx';
import { AccountsManagementPage } from './pages/AccountsManagementPage.tsx';
import { AddDeviceModal } from './components/Device/AddDeviceModal.tsx';
import { Device } from './types/index.ts';
import { api } from './services/api.ts';

function AppContent() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [navMessage, setNavMessage] = useState<string | undefined>(undefined);

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
    const res = await api.getDevices();
    if (res.success && res.data) {
      setDevices(res.data);
    }
  };

  useEffect(() => {
    loadDevicesList();
  }, [currentPath]);

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

  // 1. Mobile Phone Reporter Routes (link để điện thoại báo vào)
  if (
    currentPath === '/report' ||
    currentPath === '/tracker' ||
    currentPath === '/client' ||
    currentPath === '/connect'
  ) {
    return <PhoneReportPage navigate={navigate} />;
  }

  // 2. Auth Routes
  if (currentPath === '/login') {
    return <LoginPage navigate={navigate} message={navMessage} />;
  }
  if (currentPath === '/register') {
    return <RegisterPage navigate={navigate} />;
  }
  if (currentPath === '/landing') {
    return <LandingPage navigate={navigate} />;
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
