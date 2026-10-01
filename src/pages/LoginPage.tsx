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
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  School,
  ShieldCheck,
  Smartphone,
  BookOpen,
  Users,
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotStatusMsg, setForgotStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotNewPassword) {
      setForgotStatusMsg({ type: 'error', text: 'Vui lòng nhập email/SĐT và mật khẩu mới' });
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
        text: res.message || 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.',
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
      setErrorMsg('Vui lòng nhập đầy đủ Email/Số điện thoại và mật khẩu');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const res = await login(email.trim(), password);
    setIsLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setErrorMsg(res.message || 'Email, Số điện thoại hoặc mật khẩu không chính xác');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F9FD] via-[#EAF5FF]/40 to-[#F5F9FD] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-education">
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 rounded-[28px] overflow-hidden bg-white border border-[#DCE7F2] shadow-[0_20px_50px_rgba(0,59,122,0.08)]">
        {/* Left Side: Educational Visual Illustration (Desktop) */}
        <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-10 bg-gradient-to-br from-[#003B7A] via-[#0057B8] to-[#087FEA] text-white relative overflow-hidden">
          {/* Brand header */}
          <div className="relative z-10 space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-[16px] bg-white text-[#0057B8] flex items-center justify-center font-extrabold shadow-md">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight">EduMonitor</span>
                <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-black bg-[#FFD200] text-[#172B4D]">
                  PRO
                </span>
              </div>
            </div>
            <p className="text-xs text-blue-100 font-medium pt-1">
              Nền Tảng Quản Lý Giảng Dạy & An Toàn Học Đường
            </p>
          </div>

          {/* Educational Visual Card */}
          <div className="relative z-10 my-8 space-y-4">
            <div className="p-5 rounded-[22px] bg-white/10 backdrop-blur-md border border-white/20 space-y-3">
              <div className="flex items-center gap-2.5 text-[#FFD200] font-bold text-xs">
                <Sparkles className="w-4 h-4" />
                <span>Dành Cho Giáo Viên & Học Sinh</span>
              </div>
              <h3 className="font-extrabold text-lg leading-snug">
                Theo dõi vị trí an toàn, chuyên cần và bảo vệ học sinh trên không gian mạng.
              </h3>
              <div className="grid grid-cols-2 gap-2 pt-2 text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFD200]" />
                  <span>Định vị Google Maps</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFD200]" />
                  <span>Cảnh báo giờ học</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFD200]" />
                  <span>Quản lý lớp học</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFD200]" />
                  <span>Tiếp nhận 1 giây</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="relative z-10 text-xs text-blue-200 font-medium">
            © 2026 EduMonitor Platform · Chuẩn Giáo Dục Thông Minh
          </div>

          {/* Decorative background glow circles */}
          <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-64 h-64 rounded-full bg-white/10 pointer-events-none blur-2xl" />
          <div className="absolute bottom-0 left-0 translate-y-16 -translate-x-12 w-64 h-64 rounded-full bg-[#FFD200]/15 pointer-events-none blur-2xl" />
        </div>

        {/* Right Side: Login Card */}
        <div className="lg:col-span-7 p-6 sm:p-10 md:p-12 flex flex-col justify-center bg-white">
          <div className="max-w-md w-full mx-auto space-y-6">
            {/* Header */}
            <div>
              <div className="lg:hidden flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-[12px] bg-[#0057B8] text-white flex items-center justify-center font-bold">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-xl text-[#003B7A]">EduMonitor</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#172B4D] tracking-tight">
                Chào mừng trở lại! 👋
              </h2>
              <p className="text-xs sm:text-sm text-[#60758D] mt-1.5 font-medium">
                Đăng nhập để tiếp tục học tập và quản lý lớp học.
              </p>
            </div>

            {/* Notification or Redirect Message */}
            {message && (
              <div className="p-3.5 rounded-[14px] bg-[#EAF5FF] border border-[#d2e7fc] text-[#0057B8] text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 rounded-[14px] bg-[#FEECEC] border border-[#FECACA] text-[#DC2626] text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <EducationInput
                label="Email hoặc Số điện thoại"
                type="text"
                placeholder="VD: gv.nguyen@truong.edu.vn hoặc 0901234567"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="w-4 h-4" />}
                required
              />

              <div>
                <EducationInput
                  label="Mật khẩu"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={<Lock className="w-4 h-4" />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[#60758D] hover:text-[#0057B8] transition cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                    className="text-xs font-bold text-[#0057B8] hover:text-[#003B7A] hover:underline cursor-pointer"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <EducationButton
                  type="submit"
                  variant="primary"
                  pill
                  className="w-full text-base py-3.5 shadow-md"
                  icon={<ArrowRight className="w-4 h-4" />}
                  iconPosition="right"
                  isLoading={isLoading}
                >
                  Đăng Nhập
                </EducationButton>
              </div>
            </form>

            {/* Quick Demo Access Bar */}
            <div className="p-3.5 rounded-[18px] bg-[#F5F9FD] border border-[#DCE7F2] text-xs space-y-1.5">
              <span className="font-extrabold text-[#172B4D] block">
                🔑 Tài khoản kiểm thử nhanh (Demo):
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@devicemonitor.com');
                    setPassword('admin123');
                  }}
                  className="px-2.5 py-1 rounded-full bg-white border border-[#DCE7F2] hover:border-[#0057B8] font-bold text-[#172B4D] text-[11px] cursor-pointer"
                >
                  Admin: admin@devicemonitor.com
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('0987654321');
                    setPassword('admin123');
                  }}
                  className="px-2.5 py-1 rounded-full bg-white border border-[#DCE7F2] hover:border-[#0057B8] font-bold text-[#172B4D] text-[11px] cursor-pointer"
                >
                  Học sinh/PH: 0987654321
                </button>
              </div>
            </div>

            {/* Register Link */}
            <div className="pt-4 border-t border-[#DCE7F2] text-center text-xs text-[#60758D]">
              Chưa có tài khoản Giáo viên hoặc Học sinh?{' '}
              <button
                onClick={() => navigate('/register')}
                className="font-extrabold text-[#0057B8] hover:underline cursor-pointer"
              >
                Đăng ký ngay tại đây →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <EducationModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Khôi Phục Mật Khẩu"
        subtitle="Nhập email hoặc SĐT để thiết lập lại mật khẩu mới"
        maxWidth="md"
      >
        <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
          {forgotStatusMsg && (
            <div
              className={`p-3.5 rounded-[14px] text-xs font-semibold flex items-center gap-2 ${
                forgotStatusMsg.type === 'success'
                  ? 'bg-[#EBFBF0] text-[#16A34A] border border-[#BDECC9]'
                  : 'bg-[#FEECEC] text-[#DC2626] border border-[#FECACA]'
              }`}
            >
              {forgotStatusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{forgotStatusMsg.text}</span>
            </div>
          )}

          <EducationInput
            label="Email tài khoản"
            type="text"
            placeholder="VD: gv.nguyen@truong.edu.vn"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            required
          />

          <EducationInput
            label="Số điện thoại liên hệ (nếu có)"
            type="text"
            placeholder="VD: 0901234567"
            value={forgotPhone}
            onChange={(e) => setForgotPhone(e.target.value)}
          />

          <EducationInput
            label="Mật khẩu mới (tối thiểu 6 ký tự)"
            type="password"
            placeholder="Nhập mật khẩu mới muốn đặt..."
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
              Xác Nhận Đổi Mật Khẩu
            </EducationButton>
          </div>
        </form>
      </EducationModal>
    </div>
  );
};
