import React from 'react';
import { AppLayout } from '../components/Layout/AppLayout.tsx';

interface AdminLayoutProps {
  children: React.ReactNode;
  activePath: string;
  navigate: (path: string) => void;
  onOpenSimulator?: () => void;
}

/**
 * AdminLayout: GIỮ NGUYÊN 100% GIAO DIỆN ADMIN
 * Không đổi màu, không đổi font, không đổi layout theo yêu cầu bắt buộc của dự án.
 */
export const AdminLayout: React.FC<AdminLayoutProps> = ({
  children,
  activePath,
  navigate,
  onOpenSimulator,
}) => {
  return (
    <AppLayout
      activePath={activePath}
      navigate={navigate}
      onOpenSimulator={onOpenSimulator}
    >
      {children}
    </AppLayout>
  );
};
