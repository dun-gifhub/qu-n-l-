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
import { MobileSimulatorModal } from './components/Simulator/MobileSimulatorModal.tsx';
import { AddDeviceModal } from './components/Device/AddDeviceModal.tsx';
import { Device } from './types/index.ts';
import { api } from './services/api.ts';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState<string>(() => window.location.pathname || '/');
  const [navMessage, setNavMessage] = useState<string | undefined>(undefined);

  // Global modals
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simulatorDeviceId, setSimulatorDeviceId] = useState<string | undefined>(undefined);
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);

  // Navigation handler
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

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Fetch devices for the simulator modal when authenticated
  const loadDevicesList = async () => {
    if (isAuthenticated) {
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
  }, [isAuthenticated, currentPath]);

  const handleOpenSimulator = (deviceId?: string) => {
    setSimulatorDeviceId(deviceId);
    setIsSimulatorOpen(true);
  };

  // Loading spinner during auth check
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-xs font-semibold text-slate-500 dark:text-slate-400">
          Đang tải DeviceMonitor...
        </p>
      </div>
    );
  }

  // Protected route check
  const isPublicRoute = currentPath === '/' || currentPath === '/login' || currentPath === '/register';
  if (!isAuthenticated && !isPublicRoute) {
    return (
      <LoginPage
        navigate={navigate}
        message="Vui lòng đăng nhập để truy cập trang quản trị."
      />
    );
  }

  // Public Pages (No sidebar layout)
  if (currentPath === '/') {
    return <LandingPage navigate={navigate} />;
  }
  if (currentPath === '/login') {
    return <LoginPage navigate={navigate} message={navMessage} />;
  }
  if (currentPath === '/register') {
    return <RegisterPage navigate={navigate} />;
  }

  // Parse device detail routes: /devices/:id or /devices/:id/location or /devices/:id/history
  const deviceDetailMatch = currentPath.match(/^\/devices\/([^\/]+)(?:\/(location|history))?$/);

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
