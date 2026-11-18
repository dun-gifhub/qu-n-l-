import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { GradeScheduleManager } from '../components/Schedule/GradeScheduleManager.tsx';

export const SchedulesPage: React.FC = () => {
  const { user } = useAuth();
  const isReadOnly = user?.role === 'PARENT';

  return (
    <div className="space-y-6 animate-page-enter">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">
          Giờ học và lịch nghỉ theo khối
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Điều chỉnh khung giờ học hoặc đánh dấu nghỉ học cho từng khối để cảnh báo sử dụng điện thoại trong giờ luôn chính xác
        </p>
      </div>

      <GradeScheduleManager readOnly={isReadOnly} compactHeader />
    </div>
  );
};
