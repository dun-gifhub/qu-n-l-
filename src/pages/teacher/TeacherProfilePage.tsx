import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
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
      setStatusMsg({ type: 'success', text: 'Đổi mật khẩu thành công' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setStatusMsg({
        type: 'error',
        text: res.message || 'Không thể đổi mật khẩu. Vui lòng kiểm tra lại mật khẩu cũ.',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-page-enter">
      {/* Profile Header Card */}
      <div className="p-6 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-20 h-20 rounded-[var(--radius-panel)] bg-[var(--surface-muted)] border border-[var(--border-strong)] text-[var(--text-primary)] flex items-center justify-center font-semibold text-2xl shrink-0">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
        </div>

        <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">
              {user?.name}
            </h1>
            <EducationBadge variant="primary">Giáo viên giảng dạy</EducationBadge>
            <EducationBadge variant="success">Đã được phê duyệt</EducationBadge>
          </div>

          <p className="text-sm text-[var(--text-secondary)]">
            Tài khoản quản lý giảng dạy và giám sát học sinh theo phân cấp nhà trường
          </p>

          <div className="pt-2 flex flex-wrap justify-center sm:justify-start items-center gap-4 text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-2 font-mono">
              <Mail className="w-4 h-4 text-[var(--text-muted)]" strokeWidth={1.5} />
              <span>{user?.email}</span>
            </span>
            {user?.schoolName && (
              <span className="flex items-center gap-2">
                <School className="w-4 h-4 text-[var(--text-muted)]" strokeWidth={1.5} />
                <span>{user.schoolName}</span>
              </span>
            )}
            {user?.className && (
              <span className="font-medium text-[var(--accent-ink)]">
                Chủ nhiệm lớp {user.className}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <EducationCard
          title="Thông tin hồ sơ và trường lớp"
          subtitle="Thông tin tài khoản đã đăng ký"
          icon={<User className="w-4 h-4" strokeWidth={1.5} />}
        >
          <div className="space-y-3 text-sm">
            <div className="p-4 rounded-[var(--radius-control)] bg-[var(--surface-muted)]/60 border border-[var(--border)] space-y-1">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Họ và tên</span>
              <p className="font-semibold text-[var(--text-primary)]">{user?.name}</p>
            </div>

            <div className="p-4 rounded-[var(--radius-control)] bg-[var(--surface-muted)]/60 border border-[var(--border)] space-y-1">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Email đăng nhập</span>
              <p className="font-mono text-xs text-[var(--text-primary)]">{user?.email}</p>
            </div>

            <div className="p-4 rounded-[var(--radius-control)] bg-[var(--surface-muted)]/60 border border-[var(--border)] space-y-1">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Đơn vị trường học</span>
              <p className="font-medium text-[var(--text-primary)]">{user?.schoolName || 'Chưa cập nhật'}</p>
            </div>

            <div className="p-4 rounded-[var(--radius-control)] bg-[var(--surface-muted)]/60 border border-[var(--border)] space-y-1">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Lớp học phụ trách</span>
              <p className="font-medium text-[var(--accent-ink)]">
                {user?.className ? `Lớp ${user.className}` : 'Tất cả các lớp được phân công'}
              </p>
            </div>
          </div>
        </EducationCard>

        <EducationCard
          title="Đổi mật khẩu tài khoản"
          subtitle="Tăng cường bảo mật đăng nhập"
          icon={<KeyRound className="w-4 h-4" strokeWidth={1.5} />}
        >
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {statusMsg && (
              <div
                className={`p-4 rounded-[var(--radius-control)] text-xs font-medium flex items-center gap-2 border ${
                  statusMsg.type === 'success'
                    ? 'bg-[var(--success-soft)] text-[var(--success)] border-[var(--success-border)]'
                    : 'bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger-border)]'
                }`}
              >
                {statusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                )}
                <span>{statusMsg.text}</span>
              </div>
            )}

            <EducationInput
              label="Mật khẩu hiện tại"
              type="password"
              placeholder="Nhập mật khẩu đang dùng"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />

            <EducationInput
              label="Mật khẩu mới (tối thiểu 6 ký tự)"
              type="password"
              placeholder="Nhập mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <EducationInput
              label="Xác nhận mật khẩu mới"
              type="password"
              placeholder="Nhập lại mật khẩu mới"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <div className="pt-2">
              <EducationButton
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
              >
                Lưu mật khẩu mới
              </EducationButton>
            </div>
          </form>
        </EducationCard>
      </div>
    </div>
  );
};
