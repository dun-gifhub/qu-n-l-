import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Device, ActivityEvent } from '../../types/index.ts';
import { EducationCard } from '../../components/education/EducationCard.tsx';
import { EducationButton } from '../../components/education/EducationButton.tsx';
import { EducationStatCard } from '../../components/education/EducationStatCard.tsx';
import { EducationBadge } from '../../components/education/EducationBadge.tsx';
import { DeviceMap } from '../../components/Map/DeviceMap.tsx';
import {
  Users,
  BookOpen,
  Wifi,
  BellRing,
  MapPin,
  ExternalLink,
  Smartphone,
  Plus,
  Search,
  Filter,
  ArrowRight,
  Battery,
  Zap,
  Sparkles,
  School,
  AlertTriangle,
  RefreshCw,
  Clock,
  Radio,
  Trash2,
} from 'lucide-react';

interface TeacherDashboardPageProps {
  navigate: (path: string) => void;
  onOpenAddDevice?: () => void;
}

export const TeacherDashboardPage: React.FC<TeacherDashboardPageProps> = ({
  navigate,
  onOpenAddDevice,
}) => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ONLINE' | 'IN_CLASS' | 'ALERT'>('ALL');

  const loadData = async () => {
    try {
      const [devRes, actRes] = await Promise.all([
        api.getDevices(),
        api.getAllActivity(),
      ]);
      if (devRes.success && devRes.data) {
        setDevices(devRes.data);
      }
      if (actRes.success && actRes.data) {
        setActivities(actRes.data.slice(0, 6));
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  const availableClasses = Array.from(
    new Set(devices.map((d) => d.className).filter(Boolean) as string[])
  ).sort();

  const filteredDevices = devices.filter((d) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      (d.studentName || '').toLowerCase().includes(q) ||
      d.name.toLowerCase().includes(q) ||
      (d.className || '').toLowerCase().includes(q) ||
      (d.schoolName || '').toLowerCase().includes(q);

    if (selectedClass !== 'ALL' && d.className !== selectedClass) return false;
    if (statusFilter === 'ONLINE' && d.status !== 'ONLINE') return false;
    if (statusFilter === 'IN_CLASS' && !d.inClassAlert) return false;
    if (statusFilter === 'ALERT' && !d.isUninstalled && !d.inClassAlert && !d.isNoNetwork)
      return false;

    return matchSearch;
  });

  const totalStudents = devices.length;
  const onlineCount = devices.filter((d) => d.status === 'ONLINE').length;
  const inClassCount = devices.filter((d) => d.inClassAlert).length;
  const totalClasses = availableClasses.length || 1;

  return (
    <div className="space-y-6">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#003B7A] via-[#0057B8] to-[#087FEA] text-white p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[#FFD200] text-xs font-bold border border-white/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cổng Thông Tin Giảng Dạy & Giám Sát Lớp Học</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Xin chào, Thầy/Cô {user?.name || 'Giáo viên'} 👋
            </h1>

            <p className="text-sm text-blue-100 font-medium leading-relaxed">
              Chúc Thầy/Cô có một ngày giảng dạy hiệu quả! Theo dõi trực tuyến an toàn, mức pin và vị trí GPS của học sinh trong trường.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <span className="text-xs bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 font-semibold flex items-center gap-1.5">
                <School className="w-3.5 h-3.5 text-[#FFD200]" />
                <span>{user?.schoolName || 'Trường THPT Chuyên'}</span>
              </span>
              {user?.className && (
                <span className="text-xs bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 font-semibold">
                  Chủ nhiệm: Lớp {user.className}
                </span>
              )}
            </div>
          </div>

          {/* Quick Actions in Hero */}
          <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 shrink-0">
            <EducationButton
              variant="accent"
              pill
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                if (onOpenAddDevice) onOpenAddDevice();
                else navigate('/devices');
              }}
            >
              Thêm Học Sinh
            </EducationButton>

            <EducationButton
              variant="secondary"
              pill
              icon={<Smartphone className="w-4 h-4" />}
              onClick={() => navigate('/report')}
            >
              Mở Link Báo Cáo ĐT
            </EducationButton>
          </div>
        </div>

        {/* Decorative Background Elements */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 rounded-full bg-white/5 pointer-events-none blur-xl" />
        <div className="absolute top-0 right-1/4 -translate-y-8 w-40 h-40 rounded-full bg-[#FFD200]/10 pointer-events-none blur-lg" />
      </div>

      {/* Critical Alert Bar if any */}
      {inClassCount > 0 && (
        <div
          onClick={() => setStatusFilter('IN_CLASS')}
          className="p-4 rounded-[20px] bg-[#FFF6E5] border border-[#FED7AA] flex items-center justify-between gap-4 cursor-pointer hover:bg-[#ffeed1] transition shadow-2xs"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-[14px] bg-[#D97706] text-white flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs md:text-sm font-extrabold text-[#9A3412] uppercase tracking-wide">
                Cảnh Báo: Học sinh hoạt động trong khung giờ học!
              </h4>
              <p className="text-xs text-[#B45309] truncate mt-0.5">
                Phát hiện <strong>{inClassCount} thiết bị</strong> đang trực tuyến và tương tác trong giờ học.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#D97706] shrink-0 hover:underline">
            Lọc xem ngay ↗
          </span>
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <EducationStatCard
          label="Tổng Số Lớp"
          value={totalClasses.toString().padStart(2, '0')}
          subtext="Lớp học phụ trách"
          icon={<BookOpen className="w-6 h-6" />}
          highlightColor="blue"
          onClick={() => navigate('/classes')}
        />
        <EducationStatCard
          label="Tổng Học Sinh"
          value={totalStudents.toString().padStart(2, '0')}
          subtext="Học sinh trong danh sách"
          icon={<Users className="w-6 h-6" />}
          highlightColor="yellow"
          onClick={() => navigate('/devices')}
        />
        <EducationStatCard
          label="Đang Trực Tuyến"
          value={onlineCount.toString().padStart(2, '0')}
          subtext="Đang phát tín hiệu GPS"
          icon={<Wifi className="w-6 h-6" />}
          highlightColor="green"
          onClick={() => setStatusFilter('ONLINE')}
        />
        <EducationStatCard
          label="Cảnh Báo Giờ Học"
          value={inClassCount.toString().padStart(2, '0')}
          subtext="Cần giáo viên lưu ý"
          icon={<BellRing className="w-6 h-6" />}
          highlightColor={inClassCount > 0 ? 'red' : 'blue'}
          onClick={() => setStatusFilter('IN_CLASS')}
        />
      </div>

      {/* Interactive Map Section */}
      <EducationCard
        title="Bản Đồ Định Vị GPS Học Sinh Trực Tuyến"
        subtitle="Hiển thị vị trí thực của học sinh theo từng lớp học trên nền Google Maps vệ tinh"
        icon={<MapPin className="w-5 h-5 text-[#0057B8]" />}
        action={
          <EducationButton
            variant="ghost"
            size="sm"
            icon={<ExternalLink className="w-3.5 h-3.5" />}
            iconPosition="right"
            onClick={() => navigate('/map')}
          >
            Toàn màn hình
          </EducationButton>
        }
      >
        <div className="rounded-[18px] overflow-hidden border border-[#DCE7F2]">
          <DeviceMap devices={filteredDevices} height="360px" />
        </div>
      </EducationCard>

      {/* Main Two-Column: Device Monitoring List & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Monitoring List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Header & Filter Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-[20px] border border-[#DCE7F2]">
            <div className="flex items-center gap-2">
              <h2 className="text-base md:text-lg font-extrabold text-[#172B4D]">
                Danh Sách Giám Sát Học Sinh
              </h2>
              <EducationBadge variant="primary">
                {filteredDevices.length} máy
              </EducationBadge>
            </div>

            <div className="flex items-center gap-2">
              {/* Class selector */}
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-[#F5F9FD] border border-[#DCE7F2] rounded-xl text-xs font-semibold px-3 py-2 text-[#172B4D] focus:outline-none cursor-pointer"
              >
                <option value="ALL">Tất cả các lớp</option>
                {availableClasses.map((c) => (
                  <option key={c} value={c}>
                    Lớp {c}
                  </option>
                ))}
              </select>

              {/* Status filter button */}
              {statusFilter !== 'ALL' && (
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className="text-xs font-bold text-[#DC2626] hover:underline"
                >
                  Xóa lọc
                </button>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#60758D]" />
            <input
              type="text"
              placeholder="Tìm theo tên học sinh, lớp, mã máy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-[#172B4D] placeholder-[#60758D]/60 text-xs md:text-sm font-medium rounded-[14px] border border-[#DCE7F2] pl-10 pr-4 py-2.5 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20"
            />
          </div>

          {/* Device Cards */}
          {isLoading ? (
            <div className="py-16 text-center text-[#60758D] text-xs flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-[#0057B8]" />
              <span>Đang tải thông tin học sinh...</span>
            </div>
          ) : filteredDevices.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-[20px] border border-[#DCE7F2] space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#EAF5FF] text-[#0057B8] flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-sm text-[#172B4D]">
                Không tìm thấy học sinh phù hợp
              </h3>
              <p className="text-xs text-[#60758D] max-w-sm mx-auto">
                Hãy thử chọn lớp khác hoặc mở liên kết báo cáo trên điện thoại học sinh để bắt đầu truyền dữ liệu.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <EducationButton
                  variant="primary"
                  size="sm"
                  pill
                  onClick={() => navigate('/report')}
                >
                  Mở Link Báo Cáo
                </EducationButton>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredDevices.map((d) => {
                const isOnline = d.status === 'ONLINE';
                const inClass = Boolean(d.inClassAlert);
                const isUninstalled = Boolean(d.isUninstalled);
                const isNoNet = Boolean(d.isNoNetwork || d.networkType === 'NONE');

                return (
                  <div
                    key={d.id}
                    onClick={() => navigate(`/devices/${d.id}`)}
                    className={`p-5 rounded-[22px] bg-white border transition-all duration-200 cursor-pointer space-y-3 shadow-xs hover:-translate-y-1 hover:shadow-md hover:border-[#087FEA]/50 ${
                      inClass
                        ? 'border-[#FED7AA] bg-[#FFF9F0]'
                        : isUninstalled
                        ? 'border-[#FECACA] bg-[#FFF5F5]'
                        : 'border-[#DCE7F2]'
                    }`}
                  >
                    {/* Header info */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-[14px] flex items-center justify-center font-bold text-sm shrink-0 shadow-2xs ${
                            inClass
                              ? 'bg-[#D97706] text-white'
                              : isUninstalled
                              ? 'bg-[#DC2626] text-white'
                              : isOnline
                              ? 'bg-[#EBFBF0] text-[#16A34A] border border-[#BDECC9]'
                              : 'bg-[#F5F9FD] text-[#60758D] border border-[#DCE7F2]'
                          }`}
                        >
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-sm text-[#172B4D] truncate">
                            {d.studentName || d.name}
                          </h4>
                          <p className="text-xs text-[#60758D] truncate mt-0.5">
                            {d.schoolName || 'Chưa rõ trường'}{' '}
                            {d.className ? `· Lớp ${d.className}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 ${
                          isUninstalled
                            ? 'bg-[#FEECEC] text-[#DC2626] border border-[#FECACA]'
                            : inClass
                            ? 'bg-[#FFF6E5] text-[#D97706] border border-[#FED7AA] animate-pulse'
                            : isNoNet
                            ? 'bg-[#FFF6E5] text-[#D97706] border border-[#FED7AA]'
                            : isOnline
                            ? 'bg-[#EBFBF0] text-[#16A34A] border border-[#BDECC9]'
                            : 'bg-[#F5F9FD] text-[#60758D] border border-[#DCE7F2]'
                        }`}
                      >
                        {isUninstalled
                          ? '⚠️ ĐÃ GỠ APP'
                          : inClass
                          ? '🚨 DÙNG GIỜ HỌC'
                          : isNoNet
                          ? '🔴 MẤT MẠNG'
                          : isOnline
                          ? '🟢 ONLINE'
                          : 'OFFLINE'}
                      </span>
                    </div>

                    {/* Sensor Data */}
                    <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-[#DCE7F2]/70 text-xs">
                      <div className="flex items-center gap-1.5 text-[#172B4D]">
                        {d.charging ? (
                          <Zap className="w-3.5 h-3.5 text-[#D97706] shrink-0" />
                        ) : (
                          <Battery className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                        )}
                        <span className="font-semibold">Pin: {d.batteryLevel ?? 100}%</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[#172B4D]">
                        <Wifi className="w-3.5 h-3.5 text-[#0057B8] shrink-0" />
                        <span className="font-semibold">{d.networkType || 'WIFI'}</span>
                      </div>
                    </div>

                    {/* GPS Coordinates & Google Maps Link */}
                    {d.latitude && d.longitude ? (
                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-[#DCE7F2]/70 text-[#60758D]">
                        <span className="font-mono truncate">
                          GPS: {d.latitude.toFixed(4)}, {d.longitude.toFixed(4)}
                        </span>
                        <a
                          href={`https://www.google.com/maps?q=${d.latitude},${d.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-[#0057B8] font-bold hover:underline flex items-center gap-1 shrink-0"
                        >
                          <span>Google Maps</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ) : (
                      <div className="text-[11px] pt-2 border-t border-[#DCE7F2]/70 text-[#60758D]">
                        GPS: Chưa cập nhật tọa độ
                      </div>
                    )}

                    {/* Card Footer: Detail Button */}
                    <div className="pt-2 border-t border-[#DCE7F2]/70 flex items-center justify-between">
                      <span className="text-[11px] text-[#60758D] font-mono">
                        Cập nhật: {d.lastSeen ? new Date(d.lastSeen).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/devices/${d.id}`);
                        }}
                        className="py-1 px-3 rounded-full bg-[#EAF5FF] hover:bg-[#0057B8] text-[#0057B8] hover:text-white font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>Chi tiết</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Live Event Activity Stream */}
        <div className="space-y-4">
          <EducationCard
            title="Nhật Ký Lớp Học Mới Nhất"
            subtitle="Sự kiện trực tiếp từ thiết bị học sinh"
            icon={<Clock className="w-5 h-5 text-[#0057B8]" />}
            action={
              <button
                onClick={() => navigate('/activity')}
                className="text-xs font-bold text-[#0057B8] hover:underline cursor-pointer"
              >
                Xem tất cả ↗
              </button>
            }
          >
            <div className="space-y-3 mt-2">
              {activities.length === 0 ? (
                <p className="text-xs text-[#60758D] text-center py-6">
                  Chưa có nhật ký hoạt động nào
                </p>
              ) : (
                activities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-[16px] bg-[#F5F9FD] border border-[#DCE7F2] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-extrabold text-[#172B4D] truncate">
                        {act.studentName || act.deviceName}
                      </span>
                      <span className="text-[10px] text-[#60758D] font-mono shrink-0">
                        {new Date(act.timestamp).toLocaleTimeString('vi-VN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-[#60758D] leading-relaxed line-clamp-2">
                      {act.description}
                    </p>
                  </div>
                ))
              )}
            </div>
          </EducationCard>

          {/* Quick Notice Card */}
          <div className="p-5 rounded-[22px] bg-gradient-to-br from-[#FFF9D6] to-[#FFF0A0] border border-[#FFE770] text-[#172B4D] space-y-2.5 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="text-lg">💡</span>
              <h4 className="font-extrabold text-sm">Gợi ý dành cho Thầy/Cô</h4>
            </div>
            <p className="text-xs text-[#60758D] leading-relaxed font-medium">
              Thầy/Cô có thể gửi trực tiếp link <strong className="text-[#003B7A] font-mono">/report</strong> tới nhóm Zalo phụ huynh hoặc lớp học để học sinh bật định vị chỉ trong 5 giây mà không cần cài đặt ứng dụng phức tạp.
            </p>
            <EducationButton
              variant="outline"
              size="sm"
              pill
              className="bg-white hover:bg-slate-50 text-xs"
              onClick={() => navigate('/report')}
            >
              Mở Trang Báo Cáo
            </EducationButton>
          </div>
        </div>
      </div>
    </div>
  );
};
