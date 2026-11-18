import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { GradeScheduleManager } from '../components/Schedule/GradeScheduleManager.tsx';
import { StudentExcuseManager } from '../components/Schedule/StudentExcuseManager.tsx';
import { Clock, UserCheck } from 'lucide-react';

export const SchedulesPage: React.FC = () => {
  const { user } = useAuth();
  const isReadOnly = user?.role === 'PARENT';

  const getTabFromUrl = (): 'grades' | 'excuse' => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') === 'excuse' ? 'excuse' : 'grades';
  };

  const [activeTab, setActiveTab] = useState<'grades' | 'excuse'>(getTabFromUrl);

  useEffect(() => {
    const onPop = () => setActiveTab(getTabFromUrl());
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const handleSelectTab = (tab: 'grades' | 'excuse') => {
    setActiveTab(tab);
    const nextUrl = tab === 'excuse' ? '/schedules?tab=excuse' : '/schedules';
    window.history.replaceState({}, '', nextUrl);
  };

  return (
    <div className="space-y-6 animate-page-enter">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">
          Giờ học theo khối và Đặc cách nghỉ có lý do
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Điều chỉnh khung giờ học hoặc báo nghỉ cho từng khối, hoặc đặc cách từng học sinh nghỉ có phép để không báo cảnh báo dùng điện thoại trong giờ
        </p>
      </div>

      {/* Two-tab Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] pb-3">
        <button
          type="button"
          onClick={() => handleSelectTab('grades')}
          className={`h-9 px-4 rounded-[var(--radius-control)] text-xs font-medium inline-flex items-center gap-2 border transition-colors duration-[var(--duration-fast)] cursor-pointer ${
            activeTab === 'grades'
              ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border-transparent'
              : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-muted)]'
          }`}
        >
          <Clock className="w-4 h-4" strokeWidth={1.5} />
          <span>Giờ học & lịch nghỉ theo khối</span>
        </button>

        <button
          type="button"
          onClick={() => handleSelectTab('excuse')}
          className={`h-9 px-4 rounded-[var(--radius-control)] text-xs font-medium inline-flex items-center gap-2 border transition-colors duration-[var(--duration-fast)] cursor-pointer ${
            activeTab === 'excuse'
              ? 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border-transparent'
              : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-muted)]'
          }`}
        >
          <UserCheck className="w-4 h-4" strokeWidth={1.5} />
          <span>Đặc cách học sinh nghỉ có lý do</span>
        </button>
      </div>

      {activeTab === 'grades' ? (
        <GradeScheduleManager readOnly={isReadOnly} compactHeader />
      ) : (
        <StudentExcuseManager readOnly={isReadOnly} />
      )}
    </div>
  );
};
