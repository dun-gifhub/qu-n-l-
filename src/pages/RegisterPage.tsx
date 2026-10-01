import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { UserRole } from '../types/index.ts';
import {
  GraduationCap,
  Lock,
  Mail,
  User,
  ArrowRight,
  AlertCircle,
  Users,
  Eye,
  EyeOff,
  Phone,
  School,
  BookOpen,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { EducationButton } from '../components/education/EducationButton.tsx';
import { EducationInput } from '../components/education/EducationInput.tsx';

interface RegisterPageProps {
  navigate: (path: string, options?: { message?: string }) => void;
}

const SCHOOL_SUGGESTIONS = [
  'THPT Chuyên Lê Hồng Phong',
  'THCS Nguyễn Du',
  'THPT Nguyễn Thị Minh Khai',
  'THPT Bùi Thị Xuân',
];

export const RegisterPage: React.FC<RegisterPageProps> = ({ navigate }) => {
  const { register } = useAuth();
  const [role, setRole] = useState<UserRole>('TEACHER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [schoolName, setSchoolName] = useState('THPT Chuyên Lê Hồng Phong');
  const [className, setClassName] = useState('10A1');
  const [studentName, setStudentName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const errs: Record<string, string> = {};
    const cleanName = name.trim();
    if (!cleanName) {
      errs.name = 'Họ và tên không được để trống';
    }

    const cleanInput = email.trim();
    const isPhone = /^(\+?84|0)?[0-9]{8,12}$/.test(cleanInput.replace(/[\s.-]/g, ''));
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanInput || (!isPhone && !emailRegex.test(cleanInput))) {
      errs.email = 'Vui lòng nhập Email hoặc Số điện thoại hợp lệ (VD: 0901234567)';
    }

    if (!password || password.length < 6) {
      errs.password = 'Mật khẩu phải chứa ít nhất 6 ký tự';
    }

    if (confirmPassword && password !== confirmPassword) {
      errs.confirmPassword = 'Mật khẩu xác nhận không khớp với mật khẩu';
    }

    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      setGeneralError(Object.values(errs)[0]);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);
    if (!validate()) return;

    setIsLoading(true);

    const cleanInput = email.trim();
    const isPhone = /^(\+?84|0)?[0-9]{8,12}$/.test(cleanInput.replace(/[\s.-]/g, ''));
    const resolvedPhone = phone.trim() || (isPhone ? cleanInput : undefined);
    const resolvedEmail = isPhone && !cleanInput.includes('@')
      ? `${cleanInput.replace(/\D/g, '')}@phone.devicemonitor.com`
      : cleanInput;

    const res = await register({
      name: name.trim(),
      email: resolvedEmail,
      password: password.trim(),
      confirmPassword: (confirmPassword || password).trim(),
      role,
      schoolName: schoolName.trim() || 'THPT Chuyên Lê Hồng Phong',
      className: className.trim() || '10A1',
      studentName: studentName.trim() || (role === 'PARENT' ? `Con của ${name.trim() || 'học sinh'}` : undefined),
      phone: resolvedPhone,
    });
    setIsLoading(false);

    if (res.success) {
      navigate('/login', {
        message:
          res.message ||
          'Đăng ký tài khoản thành công! Hồ sơ đã được gửi đến Ban Giám Hiệu / Quản Trị Viên để phê duyệt.',
      });
    } else {
      if (res.errors) {
        setErrors(res.errors);
      }
      setGeneralError(
        res.message ||
          'Không thể hoàn tất đăng ký. Vui lòng kiểm tra lại thông tin đã nhập.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F9FD] via-[#EAF5FF]/40 to-[#F5F9FD] flex items-center justify-center p-4 sm:p-6 lg:p-8 font-education">
      <div className="max-w-4xl w-full bg-white rounded-[28px] border border-[#DCE7F2] shadow-[0_20px_50px_rgba(0,59,122,0.08)] overflow-hidden">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-[#003B7A] via-[#0057B8] to-[#087FEA] text-white p-6 sm:p-8 relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-[#FFD200] text-xs font-bold border border-white/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cổng Đăng Ký Tài Khoản Học Đường</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Đăng Ký Tài Khoản Mới
              </h1>
              <p className="text-xs sm:text-sm text-blue-100 font-medium">
                Tham gia hệ thống quản lý học sinh & giảng dạy thông minh EduMonitor
              </p>
            </div>

            <div className="shrink-0">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="px-4 py-2 rounded-full bg-white text-[#003B7A] hover:bg-[#FFD200] text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Đã có tài khoản? Đăng nhập →
              </button>
            </div>
          </div>

          <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-48 h-48 rounded-full bg-[#FFD200]/15 pointer-events-none blur-xl" />
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8 md:p-10">
          <form onSubmit={handleSubmit} className="space-y-6">
            {generalError && (
              <div className="p-4 rounded-[16px] bg-[#FEECEC] border border-[#FECACA] text-[#DC2626] text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{generalError}</span>
              </div>
            )}

            {/* Role Selection Switcher */}
            <div>
              <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider mb-2.5">
                1. Chọn vai trò đăng ký:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('TEACHER')}
                  className={`p-4 rounded-[18px] border text-left flex items-start gap-3 transition cursor-pointer ${
                    role === 'TEACHER'
                      ? 'border-[#0057B8] bg-[#EAF5FF] shadow-xs'
                      : 'border-[#DCE7F2] bg-white hover:bg-[#F5F9FD]'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${
                      role === 'TEACHER'
                        ? 'bg-[#0057B8] text-white'
                        : 'bg-[#F5F9FD] text-[#60758D]'
                    }`}
                  >
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-[#172B4D] block">
                      Giáo Viên Chủ Nhiệm
                    </span>
                    <span className="text-xs text-[#60758D] mt-0.5 block">
                      Quản lý lớp học, giám sát học sinh và gửi cảnh báo
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('PARENT')}
                  className={`p-4 rounded-[18px] border text-left flex items-start gap-3 transition cursor-pointer ${
                    role === 'PARENT'
                      ? 'border-[#0057B8] bg-[#EAF5FF] shadow-xs'
                      : 'border-[#DCE7F2] bg-white hover:bg-[#F5F9FD]'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0 ${
                      role === 'PARENT'
                        ? 'bg-[#0057B8] text-white'
                        : 'bg-[#F5F9FD] text-[#60758D]'
                    }`}
                  >
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-[#172B4D] block">
                      Học Sinh / Phụ Huynh
                    </span>
                    <span className="text-xs text-[#60758D] mt-0.5 block">
                      Theo dõi vị trí GPS, tiến trình học và bảo vệ thiết bị
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider">
                2. Thông tin cá nhân & Tài khoản:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EducationInput
                  label="Họ và tên"
                  placeholder="VD: Nguyễn Văn An"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={errors.name}
                  icon={<User className="w-4 h-4" />}
                  required
                />

                <EducationInput
                  label="Email hoặc Số điện thoại"
                  placeholder="VD: gv.an@truong.edu.vn hoặc 0901234567"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  icon={<Mail className="w-4 h-4" />}
                  helperText="Dùng để đăng nhập vào hệ thống"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5 text-left">
                  <label className="block text-xs md:text-sm font-semibold text-[#172B4D]">
                    Đơn vị trường học <span className="text-[#DC2626]">*</span>
                  </label>
                  <select
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full bg-white text-[#172B4D] text-sm font-medium rounded-[14px] border border-[#DCE7F2] px-4 py-3 focus:outline-none focus:border-[#0057B8] focus:ring-2 focus:ring-[#0057B8]/20"
                  >
                    {SCHOOL_SUGGESTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <EducationInput
                  label="Lớp học"
                  placeholder="VD: 10A1"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  icon={<School className="w-4 h-4" />}
                  required
                />
              </div>

              {role === 'PARENT' && (
                <EducationInput
                  label="Tên học sinh (con của bạn)"
                  placeholder="VD: Nguyễn Văn Bình"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  icon={<GraduationCap className="w-4 h-4" />}
                />
              )}
            </div>

            {/* Password Section */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-[#172B4D] uppercase tracking-wider">
                3. Thiết lập mật khẩu:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EducationInput
                  label="Mật khẩu (ít nhất 6 ký tự)"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  icon={<Lock className="w-4 h-4" />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[#60758D] hover:text-[#0057B8] cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  required
                />

                <EducationInput
                  label="Xác nhận lại mật khẩu"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu..."
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={errors.confirmPassword}
                  icon={<Lock className="w-4 h-4" />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-[#60758D] hover:text-[#0057B8] cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <EducationButton
                type="submit"
                variant="primary"
                pill
                className="w-full py-4 text-base shadow-md"
                icon={<ArrowRight className="w-5 h-5" />}
                iconPosition="right"
                isLoading={isLoading}
              >
                Hoàn Tất Đăng Ký Tài Khoản
              </EducationButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
