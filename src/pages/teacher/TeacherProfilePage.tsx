import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { EducationCard } from '../../components/education/EducationCard.tsx';
import { EducationButton } from '../../components/education/EducationButton.tsx';
import { EducationInput } from '../../components/education/EducationInput.tsx';
import { EducationBadge } from '../../components/education/EducationBadge.tsx';
import {
  User,
  Mail,
  Phone,
  School,
  Shield,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Bell,
} from 'lucide-react';

export const TeacherProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setStatusMsg({ type: 'error', text: 'Mật khẩu mới phải có tối thiểu 6 ký tự' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatusMsg({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
      return;
    }

    setIsLoading(true);
    setStatusMsg(null);
    const res = await updateProfile({
      currentPassword: oldPassword,
      newPassword,
    });
    setIsLoading(false);

    if (res.success) {
      setStatusMsg({ type: 'success', text: 'Đổi mật khẩu thành công!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setStatusMsg({ type: 'error', text: res.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu cũ.' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <div className="p-6 md:p-8 rounded-[24px] bg-white border border-[#DCE7F2] shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#087FEA] to-[#003B7A] text-white flex items-center justify-center font-extrabold text-3xl shadow-md ring-4 ring-[#EAF5FF] shrink-0">
          {user?.name ? user.name.charAt(0) : 'G'}
        </div>

        <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#172B4D] tracking-tight">
              {user?.name}
            </h1>
            <EducationBadge variant="primary">
              Giáo Viên Giảng Dạy
            </EducationBadge>
            <EducationBadge variant="success">
              Đã Được Phê Duyệt
            </EducationBadge>
          </div>

          <p className="text-xs md:text-sm text-[#60758D] font-medium">
            Tài khoản quản lý giảng dạy và giám sát học sinh theo phân cấp nhà trường
          </p>

          <div className="pt-2 flex flex-wrap justify-center sm:justify-start items-center gap-4 text-xs text-[#60758D]">
            <span className="flex items-center gap-1.5 font-mono">
              <Mail className="w-4 h-4 text-[#0057B8]" />
              <span>{user?.email}</span>
            </span>
            {user?.schoolName && (
              <span className="flex items-center gap-1.5">
                <School className="w-4 h-4 text-[#0057B8]" />
                <span>{user.schoolName}</span>
              </span>
            )}
            {user?.className && (
              <span className="flex items-center gap-1.5 font-semibold text-[#0057B8]">
                <span>Chủ nhiệm Lớp: {user.className}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal & School Info */}
        <EducationCard
          title="Thông Tin Hồ Sơ & Trường Lớp"
          subtitle="Thông tin tài khoản đã đăng ký"
          icon={<User className="w-5 h-5 text-[#0057B8]" />}
        >
          <div className="space-y-4 text-sm">
            <div className="p-3.5 rounded-[16px] bg-[#F5F9FD] border border-[#DCE7F2] space-y-1">
              <span className="text-xs text-[#60758D] font-semibold">Họ và tên</span>
              <p className="font-extrabold text-[#172B4D]">{user?.name}</p>
            </div>

            <div className="p-3.5 rounded-[16px] bg-[#F5F9FD] border border-[#DCE7F2] space-y-1">
              <span className="text-xs text-[#60758D] font-semibold">Email đăng nhập</span>
              <p className="font-mono text-[#172B4D]">{user?.email}</p>
            </div>

            <div className="p-3.5 rounded-[16px] bg-[#F5F9FD] border border-[#DCE7F2] space-y-1">
              <span className="text-xs text-[#60758D] font-semibold">Đơn vị trường học</span>
              <p className="font-bold text-[#172B4D]">{user?.schoolName || 'Chưa cập nhật'}</p>
            </div>

            <div className="p-3.5 rounded-[16px] bg-[#F5F9FD] border border-[#DCE7F2] space-y-1">
              <span className="text-xs text-[#60758D] font-semibold">Lớp học phụ trách</span>
              <p className="font-bold text-[#0057B8]">
                {user?.className ? `Lớp ${user.className}` : 'Tất cả các lớp được phân công'}
              </p>
            </div>
          </div>
        </EducationCard>

        {/* Change Password Form */}
        <EducationCard
          title="Đổi Mật Khẩu Tài Khoản"
          subtitle="Tăng cường bảo mật đăng nhập"
          icon={<KeyRound className="w-5 h-5 text-[#0057B8]" />}
        >
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {statusMsg && (
              <div
                className={`p-3.5 rounded-[14px] text-xs font-semibold flex items-center gap-2 ${
                  statusMsg.type === 'success'
                    ? 'bg-[#EBFBF0] text-[#16A34A] border border-[#BDECC9]'
                    : 'bg-[#FEECEC] text-[#DC2626] border border-[#FECACA]'
                }`}
              >
                {statusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                )}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <EducationInput
              label="Mật khẩu hiện tại"
              type="password"
              placeholder="Nhập mật khẩu đang dùng..."
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />

            <EducationInput
              label="Mật khẩu mới (tối thiểu 6 ký tự)"
              type="password"
              placeholder="Nhập mật khẩu mới..."
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <EducationInput
              label="Xác nhận mật khẩu mới"
              type="password"
              placeholder="Nhập lại mật khẩu mới..."
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <div className="pt-2">
              <EducationButton
                type="submit"
                variant="primary"
                pill
                className="w-full"
                isLoading={isLoading}
              >
                Lưu Mật Khẩu Mới
              </EducationButton>
            </div>
          </form>
        </EducationCard>
      </div>
    </div>
  );
};
