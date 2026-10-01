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
  School,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Smartphone,
  Phone,
} from 'lucide-react';

export const StudentProfilePage: React.FC = () => {
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
      setStatusMsg({ type: 'error', text: res.message || 'Không thể đổi mật khẩu.' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Profile Card */}
      <div className="p-6 md:p-8 rounded-[24px] bg-white border border-[#DCE7F2] shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#087FEA] to-[#0057B8] text-white flex items-center justify-center font-extrabold text-3xl shadow-md ring-4 ring-[#EAF5FF] shrink-0">
          {user?.name ? user.name.charAt(0) : 'S'}
        </div>

        <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl md:text-3xl font-extrabold text-[#172B4D] tracking-tight">
              {user?.studentName || user?.name}
            </h1>
            <EducationBadge variant="accent">
              Học Sinh / Phụ Huynh
            </EducationBadge>
            <EducationBadge variant="success">
              Đã Kích Hoạt
            </EducationBadge>
          </div>

          <p className="text-xs md:text-sm text-[#60758D] font-medium">
            Học sinh Lớp {user?.className || '10A1'} · {user?.schoolName || 'THPT Chuyên'}
          </p>

          <div className="pt-2 flex flex-wrap justify-center sm:justify-start items-center gap-4 text-xs text-[#60758D]">
            <span className="flex items-center gap-1.5 font-mono">
              <Mail className="w-4 h-4 text-[#0057B8]" />
              <span>{user?.email}</span>
            </span>
            {user?.phone && (
              <span className="flex items-center gap-1.5 font-mono">
                <Phone className="w-4 h-4 text-[#0057B8]" />
                <span>{user.phone}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Info & Password */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <EducationCard
          title="Thông Tin Học Sinh & Lớp Học"
          subtitle="Chi tiết tài khoản đang hoạt động"
          icon={<User className="w-5 h-5 text-[#0057B8]" />}
        >
          <div className="space-y-3.5 text-sm">
            <div className="p-3.5 rounded-[16px] bg-[#F5F9FD] border border-[#DCE7F2] space-y-1">
              <span className="text-xs text-[#60758D] font-semibold">Tên học sinh</span>
              <p className="font-extrabold text-[#172B4D]">
                {user?.studentName || user?.name}
              </p>
            </div>

            <div className="p-3.5 rounded-[16px] bg-[#F5F9FD] border border-[#DCE7F2] space-y-1">
              <span className="text-xs text-[#60758D] font-semibold">Lớp học</span>
              <p className="font-bold text-[#0057B8]">Lớp {user?.className || '10A1'}</p>
            </div>

            <div className="p-3.5 rounded-[16px] bg-[#F5F9FD] border border-[#DCE7F2] space-y-1">
              <span className="text-xs text-[#60758D] font-semibold">Trường theo học</span>
              <p className="font-bold text-[#172B4D]">{user?.schoolName || 'THPT Chuyên'}</p>
            </div>

            <div className="p-3.5 rounded-[16px] bg-[#F5F9FD] border border-[#DCE7F2] space-y-1">
              <span className="text-xs text-[#60758D] font-semibold">Tài khoản đăng nhập</span>
              <p className="font-mono text-xs text-[#172B4D]">{user?.email}</p>
            </div>
          </div>
        </EducationCard>

        <EducationCard
          title="Đổi Mật Khẩu"
          subtitle="Bảo vệ tài khoản học tập"
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
              placeholder="Nhập mật khẩu hiện tại..."
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
                Cập Nhật Mật Khẩu
              </EducationButton>
            </div>
          </form>
        </EducationCard>
      </div>
    </div>
  );
};
