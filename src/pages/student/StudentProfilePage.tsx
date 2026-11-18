import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { EducationCard } from '../../components/education/EducationCard.tsx';
import { EducationButton } from '../../components/education/EducationButton.tsx';
import { EducationInput } from '../../components/education/EducationInput.tsx';
import { EducationBadge } from '../../components/education/EducationBadge.tsx';
import {
  User,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
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
      setStatusMsg({ type: 'success', text: 'Đổi mật khẩu thành công' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setStatusMsg({ type: 'error', text: res.message || 'Không thể đổi mật khẩu' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-page-enter">
      {/* Header Profile Card */}
      <div className="p-6 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <div className="w-20 h-20 rounded-[var(--radius-panel)] bg-[var(--surface-muted)] border border-[var(--border-strong)] text-[var(--text-primary)] flex items-center justify-center font-semibold text-2xl shrink-0">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'H'}
        </div>

        <div className="space-y-2 text-center sm:text-left flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">
              {user?.studentName || user?.name}
            </h1>
            <EducationBadge variant="accent">Học sinh và phụ huynh</EducationBadge>
            <EducationBadge variant="success">Đã kích hoạt</EducationBadge>
          </div>

          <p className="text-sm text-[var(--text-secondary)]">
            Học sinh lớp {user?.className || '10A1'} · {user?.schoolName || 'THPT Chuyên'}
          </p>

          <div className="pt-2 flex flex-wrap justify-center sm:justify-start items-center gap-4 text-xs text-[var(--text-secondary)]">
            <span className="flex items-center gap-2 font-mono">
              <Mail className="w-4 h-4 text-[var(--text-muted)]" strokeWidth={1.5} />
              <span>{user?.email}</span>
            </span>
            {user?.phone && (
              <span className="flex items-center gap-2 font-mono">
                <Phone className="w-4 h-4 text-[var(--text-muted)]" strokeWidth={1.5} />
                <span>{user.phone}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Grid: Info & Password */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <EducationCard
          title="Thông tin học sinh và lớp học"
          subtitle="Chi tiết tài khoản đang hoạt động"
          icon={<User className="w-4 h-4" strokeWidth={1.5} />}
        >
          <div className="space-y-3 text-sm">
            <div className="p-4 rounded-[var(--radius-control)] bg-[var(--surface-muted)]/60 border border-[var(--border)] space-y-1">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Tên học sinh</span>
              <p className="font-semibold text-[var(--text-primary)]">
                {user?.studentName || user?.name}
              </p>
            </div>

            <div className="p-4 rounded-[var(--radius-control)] bg-[var(--surface-muted)]/60 border border-[var(--border)] space-y-1">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Lớp học</span>
              <p className="font-medium text-[var(--accent-ink)]">Lớp {user?.className || '10A1'}</p>
            </div>

            <div className="p-4 rounded-[var(--radius-control)] bg-[var(--surface-muted)]/60 border border-[var(--border)] space-y-1">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Trường theo học</span>
              <p className="font-medium text-[var(--text-primary)]">{user?.schoolName || 'THPT Chuyên'}</p>
            </div>

            <div className="p-4 rounded-[var(--radius-control)] bg-[var(--surface-muted)]/60 border border-[var(--border)] space-y-1">
              <span className="text-xs font-medium text-[var(--text-secondary)]">Tài khoản đăng nhập</span>
              <p className="font-mono text-xs text-[var(--text-primary)]">{user?.email}</p>
            </div>
          </div>
        </EducationCard>

        <EducationCard
          title="Đổi mật khẩu"
          subtitle="Bảo vệ tài khoản học tập"
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
              placeholder="Nhập mật khẩu hiện tại"
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
                Cập nhật mật khẩu
              </EducationButton>
            </div>
          </form>
        </EducationCard>
      </div>
    </div>
  );
};
