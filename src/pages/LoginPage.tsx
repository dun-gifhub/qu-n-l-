import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import {
  GraduationCap,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  ShieldCheck,
  Users,
  MapPin,
  Globe,
  Bell,
} from 'lucide-react';
import { EducationButton } from '../components/education/EducationButton.tsx';
import { EducationInput } from '../components/education/EducationInput.tsx';
import { EducationModal } from '../components/education/EducationModal.tsx';

interface LoginPageProps {
  navigate: (path: string) => void;
  message?: string;
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigate, message }) => {
  const { login } = useAuth();
  const [loginMode, setLoginMode] = useState<'USER' | 'ADMIN'>('USER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotStatusMsg, setForgotStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotNewPassword) {
      setForgotStatusMsg({ type: 'error', text: 'Vui lòng nhập email hoặc số điện thoại và mật khẩu mới' });
      return;
    }
    if (forgotNewPassword.length < 6) {
      setForgotStatusMsg({ type: 'error', text: 'Mật khẩu mới phải có tối thiểu 6 ký tự' });
      return;
    }

    setIsForgotLoading(true);
    setForgotStatusMsg(null);
    const res = await api.forgotPassword({
      email: forgotEmail.trim(),
      phone: forgotPhone.trim() || undefined,
      newPassword: forgotNewPassword.trim(),
    });
    setIsForgotLoading(false);

    if (res.success) {
      setForgotStatusMsg({
        type: 'success',
        text: res.message || 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay.',
      });
      setEmail(forgotEmail.trim());
      setPassword(forgotNewPassword.trim());
      setTimeout(() => {
        setIsForgotModalOpen(false);
        setForgotStatusMsg(null);
      }, 1500);
    } else {
      setForgotStatusMsg({
        type: 'error',
        text: res.message || 'Không thể đặt lại mật khẩu. Vui lòng kiểm tra email hoặc số điện thoại.',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ Email hoặc Số điện thoại và mật khẩu');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const res = await login(email.trim(), password);
    setIsLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setErrorMsg(res.message || 'Email, số điện thoại hoặc mật khẩu không chính xác');
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 rounded-[var(--radius-panel)] overflow-hidden bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-elevated)]">
        {/* Left Side: Product Context & Structured Overview */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 bg-[var(--surface-muted)] border-r border-[var(--border)]">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[var(--radius-control)] bg-[var(--accent)] text-[var(--on-accent)] flex items-center justify-center">
                <GraduationCap className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div>
                <span className="text-lg font-semibold text-[var(--text-primary)] block leading-tight">
                  EduMonitor
                </span>
                <span className="text-xs text-[var(--text-secondary)]">
                  Hệ thống điều phối thiết bị học đường
                </span>
              </div>
            </div>
          </div>

          {/* Product Ledger Card */}
          <div className="my-8 p-5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] space-y-4">
            <div className="space-y-1">
              <div className="text-xs font-medium text-[var(--accent-ink)]">
                Giáo viên · Phụ huynh · Quản trị viên
              </div>
              <h3 className="font-semibold text-base text-[var(--text-primary)] leading-snug">
                Theo dõi vị trí GPS, thời gian dùng ứng dụng và phát hiện sử dụng trong giờ học
              </h3>
            </div>

            <div className="space-y-3 pt-2 border-t border-[var(--border)] text-xs text-[var(--text-secondary)]">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4 text-[var(--text-muted)] shrink-0" strokeWidth={1.5} />
                <span>Định vị GPS & lộ trình trên Google Maps</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-[var(--text-muted)] shrink-0" strokeWidth={1.5} />
                <span>Giám sát ứng dụng đang mở và website</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Bell className="w-4 h-4 text-[var(--text-muted)] shrink-0" strokeWidth={1.5} />
                <span>Cảnh báo sử dụng trong giờ hoặc ngắt kết nối</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-[var(--text-muted)]">
            DeviceMonitor Platform · Lưu trữ đồng bộ PostgreSQL
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-center bg-[var(--surface)]">
          <div className="max-w-md w-full mx-auto space-y-6">
            <div>
              <div className="lg:hidden flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-[var(--radius-control)] bg-[var(--accent)] text-[var(--on-accent)] flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <span className="font-semibold text-base text-[var(--text-primary)]">EduMonitor</span>
              </div>

              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                {loginMode === 'ADMIN' ? 'Đăng nhập Quản trị viên' : 'Đăng nhập hệ thống EduMonitor'}
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {loginMode === 'ADMIN'
                  ? 'Quản lý phê duyệt tài khoản giáo viên, phụ huynh và điều phối thiết bị toàn trường'
                  : 'Truy cập bảng theo dõi lớp học, vị trí thiết bị và nhật ký hoạt động'}
              </p>
            </div>

            {/* Role Switcher Tabs */}
            <div className="grid grid-cols-2 p-1 bg-[var(--surface-muted)] rounded-[var(--radius-control)] border border-[var(--border)]">
              <button
                type="button"
                onClick={() => {
                  if (loginMode !== 'USER') {
                    setLoginMode('USER');
                    setEmail('');
                    setPassword('');
                    setErrorMsg(null);
                  }
                }}
                className={`h-9 px-3 rounded-[6px] text-xs font-medium transition-colors duration-[var(--duration-fast)] flex items-center justify-center gap-2 cursor-pointer ${
                  loginMode === 'USER'
                    ? 'bg-[var(--surface)] text-[var(--text-primary)] border border-[var(--border)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                }`}
              >
                <Users className="w-4 h-4" strokeWidth={1.5} />
                <span>Giáo viên / Phụ huynh</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (loginMode !== 'ADMIN') {
                    setLoginMode('ADMIN');
                    setEmail('');
                    setPassword('');
                    setErrorMsg(null);
                  }
                }}
                className={`h-9 px-3 rounded-[6px] text-xs font-medium transition-colors duration-[var(--duration-fast)] flex items-center justify-center gap-2 cursor-pointer ${
                  loginMode === 'ADMIN'
                    ? 'bg-[var(--surface)] text-[var(--accent-ink)] border border-[var(--border)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                }`}
              >
                <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
                <span>Quản trị viên</span>
              </button>
            </div>

            {message && (
              <div className="p-3 rounded-[var(--radius-control)] bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--accent-ink)] text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                <span>{message}</span>
              </div>
            )}

            {errorMsg && (
              <div className="p-3 rounded-[var(--radius-control)] bg-[var(--danger-soft)] border border-[var(--danger-border)] text-[var(--danger)] text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
              <EducationInput
                label={loginMode === 'ADMIN' ? 'Email quản trị viên' : 'Email hoặc số điện thoại'}
                type="text"
                placeholder={loginMode === 'ADMIN' ? '' : 'gv.nguyen@truong.edu.vn hoặc 0901234567'}
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={
                  loginMode === 'ADMIN' ? (
                    <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
                  ) : (
                    <Mail className="w-4 h-4" strokeWidth={1.5} />
                  )
                }
                required
              />

              <div>
                <EducationInput
                  label={loginMode === 'ADMIN' ? 'Mật khẩu quản trị' : 'Mật khẩu'}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={loginMode === 'ADMIN' ? '' : 'Nhập mật khẩu'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" strokeWidth={1.5} />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                      aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" strokeWidth={1.5} />
                      ) : (
                        <Eye className="w-4 h-4" strokeWidth={1.5} />
                      )}
                    </button>
                  }
                  required
                />

                <div className="flex items-center justify-end mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setIsForgotModalOpen(true);
                    }}
                    className="text-xs font-medium text-[var(--accent-ink)] hover:underline cursor-pointer"
                  >
                    Quên mật khẩu
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <EducationButton
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  icon={<ArrowRight className="w-4 h-4" strokeWidth={1.5} />}
                  iconPosition="right"
                  isLoading={isLoading}
                >
                  {loginMode === 'ADMIN' ? 'Đăng nhập Quản trị viên' : 'Đăng nhập'}
                </EducationButton>
              </div>
            </form>

            <div className="pt-4 border-t border-[var(--border)] text-center text-xs text-[var(--text-secondary)]">
              Chưa có tài khoản Giáo viên hoặc Phụ huynh?{' '}
              <button
                onClick={() => navigate('/register')}
                className="font-medium text-[var(--accent-ink)] hover:underline cursor-pointer"
              >
                Đăng ký tài khoản mới
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <EducationModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Khôi phục mật khẩu"
        subtitle="Nhập email hoặc số điện thoại để thiết lập lại mật khẩu mới"
        maxWidth="md"
      >
        <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
          {forgotStatusMsg && (
            <div
              className={`p-3 rounded-[var(--radius-control)] text-xs font-medium flex items-center gap-2 ${
                forgotStatusMsg.type === 'success'
                  ? 'bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success-border)]'
                  : 'bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger-border)]'
              }`}
            >
              {forgotStatusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              )}
              <span>{forgotStatusMsg.text}</span>
            </div>
          )}

          <EducationInput
            label="Email tài khoản"
            type="text"
            placeholder="gv.nguyen@truong.edu.vn"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            required
          />

          <EducationInput
            label="Số điện thoại liên hệ (nếu có)"
            type="text"
            placeholder="0901234567"
            value={forgotPhone}
            onChange={(e) => setForgotPhone(e.target.value)}
          />

          <EducationInput
            label="Mật khẩu mới (tối thiểu 6 ký tự)"
            type="password"
            placeholder="Nhập mật khẩu mới"
            value={forgotNewPassword}
            onChange={(e) => setForgotNewPassword(e.target.value)}
            required
          />

          <div className="pt-2 flex justify-end gap-2">
            <EducationButton
              type="button"
              variant="outline"
              onClick={() => setIsForgotModalOpen(false)}
            >
              Hủy
            </EducationButton>
            <EducationButton
              type="submit"
              variant="primary"
              isLoading={isForgotLoading}
            >
              Xác nhận đổi mật khẩu
            </EducationButton>
          </div>
        </form>
      </EducationModal>
    </div>
  );
};
