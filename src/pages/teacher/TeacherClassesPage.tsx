import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { Device } from '../../types/index.ts';
import { EducationButton } from '../../components/education/EducationButton.tsx';
import { EducationBadge } from '../../components/education/EducationBadge.tsx';
import { GradeScheduleManager } from '../../components/Schedule/GradeScheduleManager.tsx';
import { StudentExcuseManager } from '../../components/Schedule/StudentExcuseManager.tsx';
import {
  BookOpen,
  ArrowRight,
  Plus,
  Search,
  Clock,
  UserCheck,
} from 'lucide-react';

interface TeacherClassesPageProps {
  navigate: (path: string) => void;
}

export const TeacherClassesPage: React.FC<TeacherClassesPageProps> = ({ navigate }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'classes' | 'schedules' | 'excuse'>('classes');

  const loadDevices = () => {
    api.getDevices().then((res) => {
      if (res.success && res.data) {
        setDevices(res.data);
      }
      setIsLoading(false);
    });
  };

  useEffect(() => {
    loadDevices();
  }, []);

  // Group devices by class
  const classMap = new Map<string, Device[]>();
  devices.forEach((d) => {
    const className = d.className || 'Chưa phân lớp';
    if (!classMap.has(className)) {
      classMap.set(className, []);
    }
    classMap.get(className)!.push(d);
  });

  const classes = Array.from(classMap.entries()).map(([className, devList]) => {
    const total = devList.length;
    const online = devList.filter((d) => d.status === 'ONLINE').length;
    const inClassAlert = devList.filter((d) => d.inClassAlert).length;
    const school = devList[0]?.schoolName || 'THPT Chuyên';
    const grade =
      devList[0]?.grade ||
      (className.match(/\d+/)?.[0] ? `Khối ${className.match(/\d+/)?.[0]}` : 'Khối 10');

    return {
      className,
      total,
      online,
      inClassAlert,
      school,
      grade,
      devices: devList,
    };
  });

  const filteredClasses = classes.filter(
    (c) =>
      c.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.school.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">
            Quản lý lớp học phụ trách
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Theo dõi sĩ số, trạng thái kết nối GPS và cảnh báo thiết bị theo từng lớp học
          </p>
        </div>

        <EducationButton
          variant="primary"
          icon={<Plus className="w-4 h-4" strokeWidth={1.5} />}
          onClick={() => navigate('/report')}
        >
          Kết nối học sinh mới
        </EducationButton>
      </div>

      {/* Section Switcher */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[var(--border)] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('classes')}
          className={`h-9 px-3.5 rounded-[var(--radius-control)] text-xs font-medium inline-flex items-center gap-2 border transition-colors duration-[var(--duration-fast)] cursor-pointer ${
            activeTab === 'classes'
              ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] border-[var(--accent-border)]'
              : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-muted)]'
          }`}
        >
          <BookOpen className="w-4 h-4" strokeWidth={1.5} />
          <span>Danh sách lớp học</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('schedules')}
          className={`h-9 px-3.5 rounded-[var(--radius-control)] text-xs font-medium inline-flex items-center gap-2 border transition-colors duration-[var(--duration-fast)] cursor-pointer ${
            activeTab === 'schedules'
              ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] border-[var(--accent-border)]'
              : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-muted)]'
          }`}
        >
          <Clock className="w-4 h-4" strokeWidth={1.5} />
          <span>Giờ học & lịch nghỉ theo khối</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('excuse')}
          className={`h-9 px-3.5 rounded-[var(--radius-control)] text-xs font-medium inline-flex items-center gap-2 border transition-colors duration-[var(--duration-fast)] cursor-pointer ${
            activeTab === 'excuse'
              ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] border-[var(--accent-border)]'
              : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--surface-muted)]'
          }`}
        >
          <UserCheck className="w-4 h-4" strokeWidth={1.5} />
          <span>Đặc cách học sinh nghỉ có lý do</span>
        </button>
      </div>

      {activeTab === 'schedules' ? (
        <GradeScheduleManager onSchedulesChanged={loadDevices} />
      ) : activeTab === 'excuse' ? (
        <StudentExcuseManager onChanged={loadDevices} />
      ) : (
        <>
      {/* Search Bar */}
      <div className="relative">
        <Search
          className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
          strokeWidth={1.5}
        />
        <input
          type="text"
          placeholder="Tìm theo tên lớp học hoặc trường"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 bg-[var(--surface)] text-[var(--text-primary)] placeholder-[var(--text-muted)] text-sm rounded-[var(--radius-control)] border border-[var(--border-strong)] pl-9 pr-4 focus:outline-none"
        />
      </div>

      {/* Classes Grid */}
      {isLoading ? (
        <div className="py-16 text-center text-[var(--text-muted)] text-xs">
          Đang tải danh sách lớp học
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="p-12 text-center bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] space-y-3">
          <BookOpen className="w-8 h-8 text-[var(--accent-ink)] mx-auto" strokeWidth={1.5} />
          <h3 className="font-semibold text-base text-[var(--text-primary)]">
            Chưa có lớp học nào trong hệ thống
          </h3>
          <p className="text-xs text-[var(--text-secondary)] max-w-sm mx-auto leading-relaxed">
            Học sinh đăng ký hoặc gửi báo cáo GPS trên điện thoại sẽ tự động phân loại vào lớp học tương ứng.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.map((item) => (
            <div
              key={item.className}
              className="p-5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--border-strong)] shadow-[var(--shadow-card)] transition-[border-color,background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] space-y-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-[var(--radius-control)] bg-[var(--accent-soft)] text-[var(--accent-ink)] flex items-center justify-center font-semibold font-mono text-sm border border-[var(--accent-border)] shrink-0">
                    {item.className.substring(0, 4)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-[var(--text-primary)]">
                      Lớp {item.className}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-1">{item.school}</p>
                  </div>
                </div>

                <EducationBadge variant="accent">{item.grade}</EducationBadge>
              </div>

              {/* Stats within Class */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-[var(--radius-control)] bg-[var(--surface-muted)]/60 border border-[var(--border)] text-center">
                <div>
                  <div className="text-xs text-[var(--text-secondary)]">Sĩ số</div>
                  <div className="text-base font-semibold font-mono tabular-nums text-[var(--text-primary)] mt-1">
                    {item.total}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--success)]">Trực tuyến</div>
                  <div className="text-base font-semibold font-mono tabular-nums text-[var(--success)] mt-1">
                    {item.online}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[var(--warning)]">Cảnh báo</div>
                  <div className="text-base font-semibold font-mono tabular-nums text-[var(--warning)] mt-1">
                    {item.inClassAlert}
                  </div>
                </div>
              </div>

              <EducationButton
                variant="outline"
                size="sm"
                className="w-full text-xs"
                icon={<ArrowRight className="w-4 h-4" strokeWidth={1.5} />}
                iconPosition="right"
                onClick={() => navigate('/devices')}
              >
                Xem danh sách học sinh
              </EducationButton>
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
};
