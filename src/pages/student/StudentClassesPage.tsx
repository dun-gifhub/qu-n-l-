import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { EducationCard } from '../../components/education/EducationCard.tsx';
import { EducationBadge } from '../../components/education/EducationBadge.tsx';
import { EducationButton } from '../../components/education/EducationButton.tsx';
import { Calendar, Clock } from 'lucide-react';

interface StudentClassesPageProps {
  navigate: (path: string) => void;
}

export const StudentClassesPage: React.FC<StudentClassesPageProps> = ({ navigate }) => {
  const { user } = useAuth();
  const className = user?.className || '10A1';
  const schoolName = user?.schoolName || 'THPT Chuyên';

  const schedule = [
    { day: 'Thứ Hai', subject: 'Toán học và Vật lý', time: '07:30 - 11:30', room: 'Phòng 204' },
    { day: 'Thứ Ba', subject: 'Ngữ văn và Tiếng Anh', time: '07:30 - 11:30', room: 'Phòng 204' },
    { day: 'Thứ Tư', subject: 'Hóa học và Sinh học', time: '07:30 - 11:30', room: 'Phòng thí nghiệm' },
    { day: 'Thứ Năm', subject: 'Lịch sử và Địa lý', time: '07:30 - 11:30', room: 'Phòng 204' },
    { day: 'Thứ Sáu', subject: 'Tin học và GDQP', time: '07:30 - 11:30', room: 'Phòng Tin' },
  ];

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Class Overview Card */}
      <div className="p-6 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-[var(--radius-card)] bg-[var(--accent-soft)] text-[var(--accent-ink)] flex items-center justify-center font-semibold font-mono text-xl border border-[var(--accent-border)] shrink-0">
            {className}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">
                Lớp {className}
              </h1>
              <EducationBadge variant="accent">Năm học hiện tại</EducationBadge>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              {schoolName} · Giáo viên chủ nhiệm theo dõi an toàn thiết bị trong giờ học
            </p>
          </div>
        </div>

        <EducationButton variant="primary" onClick={() => navigate('/dashboard')}>
          Trở về tổng quan
        </EducationButton>
      </div>

      {/* Sample Schedule Table */}
      <EducationCard
        title="Thời khóa biểu mẫu và khung giờ tập trung"
        subtitle="Lịch minh họa cho khung giờ giám sát tự động (07:30 - 11:30)"
        icon={<Calendar className="w-4 h-4" strokeWidth={1.5} />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-2">
          {schedule.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-[var(--radius-control)] bg-[var(--surface-muted)]/60 border border-[var(--border)] space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-[var(--accent-ink)]">{item.day}</span>
                <span className="w-2 h-2 rounded-full bg-[var(--success)]" />
              </div>
              <h4 className="font-medium text-xs text-[var(--text-primary)] leading-snug">
                {item.subject}
              </h4>
              <div className="pt-2 border-t border-[var(--border)] text-xs text-[var(--text-secondary)] space-y-1">
                <div className="flex items-center gap-2 font-mono tabular-nums">
                  <Clock className="w-4 h-4 text-[var(--accent-ink)]" strokeWidth={1.5} />
                  <span>{item.time}</span>
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">{item.room}</div>
              </div>
            </div>
          ))}
        </div>
      </EducationCard>
    </div>
  );
};
