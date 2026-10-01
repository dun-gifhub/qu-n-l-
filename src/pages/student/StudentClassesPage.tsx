import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { EducationCard } from '../../components/education/EducationCard.tsx';
import { EducationBadge } from '../../components/education/EducationBadge.tsx';
import { EducationButton } from '../../components/education/EducationButton.tsx';
import {
  BookOpen,
  Users,
  Calendar,
  Clock,
  School,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

interface StudentClassesPageProps {
  navigate: (path: string) => void;
}

export const StudentClassesPage: React.FC<StudentClassesPageProps> = ({ navigate }) => {
  const { user } = useAuth();
  const className = user?.className || '10A1';
  const schoolName = user?.schoolName || 'THPT Chuyên';

  const schedule = [
    { day: 'Thứ Hai', subject: 'Toán học & Vật lý', time: '07:30 - 11:30', room: 'Phòng 204' },
    { day: 'Thứ Ba', subject: 'Ngữ văn & Tiếng Anh', time: '07:30 - 11:30', room: 'Phòng 204' },
    { day: 'Thứ Tư', subject: 'Hóa học & Sinh học', time: '07:30 - 11:30', room: 'Phòng Lab' },
    { day: 'Thứ Năm', subject: 'Lịch sử & Địa lý', time: '07:30 - 11:30', room: 'Phòng 204' },
    { day: 'Thứ Sáu', subject: 'Tin học & GDQP', time: '07:30 - 11:30', room: 'Phòng Tin' },
  ];

  return (
    <div className="space-y-6">
      {/* Class Overview Card */}
      <div className="p-6 md:p-8 rounded-[24px] bg-white border border-[#DCE7F2] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-[20px] bg-[#EAF5FF] text-[#0057B8] flex items-center justify-center font-extrabold text-2xl border border-[#d2e7fc]">
            {className}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-[#172B4D]">
                Lớp {className}
              </h1>
              <EducationBadge variant="accent">
                Niên khóa 2026-2027
              </EducationBadge>
            </div>
            <p className="text-xs md:text-sm text-[#60758D]">
              {schoolName} · Giáo viên chủ nhiệm quản lý giám sát an toàn
            </p>
          </div>
        </div>

        <EducationButton
          variant="primary"
          pill
          onClick={() => navigate('/dashboard')}
        >
          Trở Về Tổng Quan
        </EducationButton>
      </div>

      {/* Schedule Table */}
      <EducationCard
        title="Thời Khóa Biểu & Khung Giờ Học An Toàn"
        subtitle="Hệ thống tự động kích hoạt chế độ giám sát tập trung trong giờ học"
        icon={<Calendar className="w-5 h-5 text-[#0057B8]" />}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mt-2">
          {schedule.map((item, idx) => (
            <div
              key={idx}
              className="p-4 rounded-[18px] bg-[#F5F9FD] border border-[#DCE7F2] space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-[#0057B8]">{item.day}</span>
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
              </div>
              <h4 className="font-bold text-xs text-[#172B4D] leading-snug">
                {item.subject}
              </h4>
              <div className="pt-2 border-t border-[#DCE7F2]/60 text-[11px] text-[#60758D] space-y-0.5">
                <div className="flex items-center gap-1 font-mono">
                  <Clock className="w-3 h-3 text-[#0057B8]" />
                  <span>{item.time}</span>
                </div>
                <div className="text-[10px] text-[#60758D] font-medium">
                  {item.room}
                </div>
              </div>
            </div>
          ))}
        </div>
      </EducationCard>
    </div>
  );
};
