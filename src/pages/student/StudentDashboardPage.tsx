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
  Smartphone,
  Battery,
  Wifi,
  MapPin,
  Clock,
  Sparkles,
  Trophy,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  Calendar,
  AlertCircle,
  Zap,
} from 'lucide-react';

interface StudentDashboardPageProps {
  navigate: (path: string) => void;
}

export const StudentDashboardPage: React.FC<StudentDashboardPageProps> = ({ navigate }) => {
  const { user } = useAuth();
  const [devices, setDevices] = useState<Device[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getDevices(), api.getAllActivity()]).then(([devRes, actRes]) => {
      if (devRes.success && devRes.data) {
        setDevices(devRes.data);
      }
      if (actRes.success && actRes.data) {
        setActivities(actRes.data.slice(0, 5));
      }
      setIsLoading(false);
    });
  }, []);

  const myDevice = devices[0] || null;
  const isOnline = myDevice?.status === 'ONLINE';

  return (
    <div className="space-y-6">
      {/* Student Hero Banner */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-[#0057B8] via-[#087FEA] to-[#003B7A] text-white p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-[#FFD200] text-xs font-bold border border-white/20">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Không Gian Học Tập & An Toàn Số</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
              Xin chào, {user?.studentName || user?.name || 'Học sinh'} 👋
            </h1>

            <p className="text-sm text-blue-100 font-medium leading-relaxed">
              Tiếp tục hành trình học tập của bạn! Đảm bảo thiết bị luôn kết nối an toàn với thầy cô và phụ huynh.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <span className="text-xs bg-white/15 px-3 py-1.5 rounded-xl border border-white/20 font-bold">
                Lớp {user?.className || '10A1'} · {user?.schoolName || 'THPT Chuyên'}
              </span>
              <span className="text-xs bg-[#FFD200] text-[#172B4D] px-3 py-1.5 rounded-xl font-extrabold flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5" />
                <span>Học Sinh Tích Cực</span>
              </span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col gap-2">
            <EducationButton
              variant="accent"
              pill
              icon={<Smartphone className="w-4 h-4" />}
              onClick={() => navigate('/report')}
            >
              📱 Mở Báo Cáo Trên ĐT
            </EducationButton>
          </div>
        </div>

        {/* Background glow */}
        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-64 h-64 rounded-full bg-[#FFD200]/10 pointer-events-none blur-2xl" />
      </div>

      {/* Learning Progress Section (Section VII) */}
      <EducationCard
        title="Tiến Độ Học Tập & Tuân Thủ Giờ Học"
        subtitle="Mức độ chuyên cần và an toàn không gian mạng trong tuần"
        icon={<Trophy className="w-5 h-5 text-[#8C6B00]" />}
        accentBorder
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#60758D] uppercase tracking-wider">
              Chỉ số chuyên cần tuần này
            </span>
            <span className="text-lg font-extrabold text-[#0057B8] tabular-nums">
              88% Hoàn thành
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3.5 rounded-full bg-[#EAF5FF] overflow-hidden p-0.5 border border-[#DCE7F2]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0057B8] to-[#087FEA] transition-all duration-500"
              style={{ width: '88%' }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center text-xs">
            <div className="p-3 rounded-xl bg-[#F5F9FD] border border-[#DCE7F2]">
              <span className="text-[#60758D] block">Số giờ học tập</span>
              <strong className="text-sm font-extrabold text-[#172B4D] mt-0.5 block">24 giờ</strong>
            </div>
            <div className="p-3 rounded-xl bg-[#F5F9FD] border border-[#DCE7F2]">
              <span className="text-[#60758D] block">Đúng giờ lên lớp</span>
              <strong className="text-sm font-extrabold text-[#16A34A] mt-0.5 block">100%</strong>
            </div>
            <div className="p-3 rounded-xl bg-[#F5F9FD] border border-[#DCE7F2]">
              <span className="text-[#60758D] block">Cảnh báo vi phạm</span>
              <strong className="text-sm font-extrabold text-[#16A34A] mt-0.5 block">0 lần</strong>
            </div>
            <div className="p-3 rounded-xl bg-[#F5F9FD] border border-[#DCE7F2]">
              <span className="text-[#60758D] block">Trạng thái định vị</span>
              <strong className="text-sm font-extrabold text-[#0057B8] mt-0.5 block">An toàn</strong>
            </div>
          </div>
        </div>
      </EducationCard>

      {/* Device Status & Live Location */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Device Information Card */}
        <EducationCard
          title="Thiết Bị Điện Thoại Học Sinh"
          subtitle="Tình trạng phần cứng và mạng kết nối"
          icon={<Smartphone className="w-5 h-5 text-[#0057B8]" />}
        >
          {myDevice ? (
            <div className="space-y-4">
              <div className="p-4 rounded-[18px] bg-[#F5F9FD] border border-[#DCE7F2] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#60758D] font-semibold">Tên thiết bị:</span>
                  <span className="text-xs font-extrabold text-[#172B4D]">{myDevice.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#60758D] font-semibold">Trạng thái:</span>
                  <EducationBadge variant={isOnline ? 'success' : 'neutral'}>
                    {isOnline ? '🟢 Đang Online' : '⚪ Ngoại tuyến'}
                  </EducationBadge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#60758D] font-semibold">Mức pin:</span>
                  <span className="text-xs font-bold text-[#172B4D] flex items-center gap-1">
                    {myDevice.charging ? <Zap className="w-3.5 h-3.5 text-[#D97706]" /> : <Battery className="w-3.5 h-3.5 text-[#16A34A]" />}
                    {myDevice.batteryLevel ?? 100}% {myDevice.charging ? '(Đang sạc)' : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#60758D] font-semibold">Mạng kết nối:</span>
                  <span className="text-xs font-mono font-bold text-[#0057B8]">
                    {myDevice.networkType || 'WIFI'}
                  </span>
                </div>
              </div>

              {myDevice.latitude && myDevice.longitude && (
                <div className="p-3.5 rounded-[16px] bg-[#EAF5FF] border border-[#d2e7fc] flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[11px] text-[#60758D] block">Tọa độ GPS hiện tại:</span>
                    <span className="font-mono font-bold text-[#0057B8]">
                      {myDevice.latitude.toFixed(4)}, {myDevice.longitude.toFixed(4)}
                    </span>
                  </div>
                  <a
                    href={`https://www.google.com/maps?q=${myDevice.latitude},${myDevice.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1 px-3 rounded-full bg-[#0057B8] text-white font-bold text-[11px] hover:bg-[#003B7A] transition"
                  >
                    Xem Maps ↗
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-[#60758D] space-y-3">
              <p>Chưa có thiết bị nào liên kết với tài khoản này.</p>
              <EducationButton
                variant="primary"
                size="sm"
                pill
                onClick={() => navigate('/report')}
              >
                📱 Kết Nối Thiết Bị
              </EducationButton>
            </div>
          )}
        </EducationCard>

        {/* Live GPS Map */}
        <div className="lg:col-span-2">
          <EducationCard
            title="Bản Đồ Định Vị GPS Trực Tuyến"
            subtitle="Vị trí thực được truyền liên tục tới Giáo viên và Phụ huynh"
            icon={<MapPin className="w-5 h-5 text-[#0057B8]" />}
            action={
              <EducationButton
                variant="ghost"
                size="sm"
                onClick={() => navigate('/map')}
              >
                Mở rộng ↗
              </EducationButton>
            }
          >
            <div className="rounded-[18px] overflow-hidden border border-[#DCE7F2]">
              <DeviceMap devices={devices} height="320px" />
            </div>
          </EducationCard>
        </div>
      </div>
    </div>
  );
};
