import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { Device } from '../../types/index.ts';
import { EducationCard } from '../../components/education/EducationCard.tsx';
import { EducationButton } from '../../components/education/EducationButton.tsx';
import { EducationBadge } from '../../components/education/EducationBadge.tsx';
import {
  BookOpen,
  Users,
  Wifi,
  BellRing,
  ArrowRight,
  School,
  GraduationCap,
  Plus,
  Search,
} from 'lucide-react';

interface TeacherClassesPageProps {
  navigate: (path: string) => void;
}

export const TeacherClassesPage: React.FC<TeacherClassesPageProps> = ({ navigate }) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.getDevices().then((res) => {
      if (res.success && res.data) {
        setDevices(res.data);
      }
      setIsLoading(false);
    });
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
    const grade = devList[0]?.grade || (className.match(/\d+/)?.[0] ? `Khối ${className.match(/\d+/)?.[0]}` : 'Khối 10');

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

  const filteredClasses = classes.filter((c) =>
    c.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.school.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-[#172B4D] tracking-tight">
            Quản Lý Lớp Học Phụ Trách
          </h1>
          <p className="text-xs md:text-sm text-[#60758D] mt-1">
            Theo dõi sĩ số, trạng thái kết nối GPS và cảnh báo thiết bị theo từng lớp học
          </p>
        </div>

        <EducationButton
          variant="primary"
          pill
          icon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/report')}
        >
          Kết Nối Học Sinh Mới
        </EducationButton>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#60758D]" />
        <input
          type="text"
          placeholder="Tìm theo tên lớp học, trường học..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white text-[#172B4D] placeholder-[#60758D]/60 text-sm font-medium rounded-[14px] border border-[#DCE7F2] pl-10 pr-4 py-3 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20"
        />
      </div>

      {/* Classes Grid */}
      {isLoading ? (
        <div className="py-20 text-center text-[#60758D] text-xs">
          Đang tải danh sách lớp học...
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-[24px] border border-[#DCE7F2] space-y-3">
          <BookOpen className="w-12 h-12 text-[#0057B8] mx-auto" />
          <h3 className="font-extrabold text-base text-[#172B4D]">
            Chưa có lớp học nào trong hệ thống
          </h3>
          <p className="text-xs text-[#60758D] max-w-sm mx-auto">
            Học sinh đăng ký hoặc gửi báo cáo GPS trên điện thoại sẽ tự động phân loại vào lớp học tương ứng.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.map((item) => (
            <div
              key={item.className}
              className="p-6 rounded-[24px] bg-white border border-[#DCE7F2] hover:border-[#087FEA]/50 hover:shadow-md transition-all duration-200 space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-[16px] bg-[#EAF5FF] text-[#0057B8] flex items-center justify-center font-extrabold text-base border border-[#d2e7fc]">
                    {item.className.substring(0, 3)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-lg text-[#172B4D]">
                      Lớp {item.className}
                    </h3>
                    <p className="text-xs text-[#60758D] mt-0.5">{item.school}</p>
                  </div>
                </div>

                <EducationBadge variant="accent">
                  {item.grade}
                </EducationBadge>
              </div>

              {/* Stats within Class */}
              <div className="grid grid-cols-3 gap-2 p-3 rounded-[16px] bg-[#F5F9FD] border border-[#DCE7F2] text-center">
                <div>
                  <div className="text-xs text-[#60758D] font-medium">Sĩ số</div>
                  <div className="text-base font-extrabold text-[#172B4D] mt-0.5">
                    {item.total}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#16A34A] font-medium">Online</div>
                  <div className="text-base font-extrabold text-[#16A34A] mt-0.5">
                    {item.online}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-[#D97706] font-medium">Cảnh báo</div>
                  <div className="text-base font-extrabold text-[#D97706] mt-0.5">
                    {item.inClassAlert}
                  </div>
                </div>
              </div>

              <EducationButton
                variant="outline"
                size="sm"
                pill
                className="w-full text-xs"
                icon={<ArrowRight className="w-3.5 h-3.5" />}
                iconPosition="right"
                onClick={() => navigate('/devices')}
              >
                Xem danh sách học sinh
              </EducationButton>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
