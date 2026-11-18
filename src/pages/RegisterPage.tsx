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
  School,
  BookOpen,
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
  const [phone] = useState('');
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
      errs.email = 'Vui lòng nhập Email hoặc Số điện thoại hợp lệ (ví dụ 0901234567)';
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
    const resolvedEmail =
      isPhone && !cleanInput.includes('@')
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
          'Đăng ký tài khoản thành công. Hồ sơ đã được gửi đến Quản trị viên để phê duyệt.',
      });
    } else {
      if (res.errors) {
        setErrors(res.errors);
      }
      setGeneralError(
        res.message || 'Không thể hoàn tất đăng ký. Vui lòng kiểm tra lại thông tin đã nhập.'
      );
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl w-full bg-[var(--surface)] rounded-[var(--radius-panel)] border border-[var(--border)] shadow-[var(--shadow-elevated)] overflow-hidden">
        {/* Top Header */}
        <div className="bg-[var(--surface-muted)] border-b border-[var(--border)] p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-xs font-medium text-[var(--accent-ink)]">
                Cổng đăng ký tài khoản học đường
              </div>
              <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                Đăng ký tài khoản mới
              </h1>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                Tham gia hệ thống điều phối thiết bị và lớp học EduMonitor
              </p>
            </div>

            <div className="shrink-0">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="h-9 px-4 rounded-[var(--radius-control)] bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border-strong)] text-xs font-medium transition-colors cursor-pointer"
              >
                Đã có tài khoản · Đăng nhập
              </button>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {generalError && (
              <div className="p-4 rounded-[var(--radius-control)] bg-[var(--danger-soft)] border border-[var(--danger-border)] text-[var(--danger)] text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                <span>{generalError}</span>
              </div>
            )}

            {/* Role Selection Switcher */}
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-2">
                1. Chọn vai trò đăng ký
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('TEACHER')}
                  className={`p-4 rounded-[var(--radius-card)] border text-left flex items-start gap-3 transition-colors duration-[var(--duration-fast)] cursor-pointer ${
                    role === 'TEACHER'
                      ? 'border-[var(--accent-border)] bg-[var(--accent-soft)]'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)]/60'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-[var(--radius-control)] flex items-center justify-center shrink-0 ${
                      role === 'TEACHER'
                        ? 'bg-[var(--accent)] text-[var(--on-accent)]'
                        : 'bg-[var(--surface-muted)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <BookOpen className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-[var(--text-primary)] block">
                      Giáo viên chủ nhiệm
                    </span>
                    <span className="text-xs text-[var(--text-secondary)] mt-0.5 block">
                      Quản lý lớp học, giám sát học sinh cùng trường và nhận cảnh báo
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('PARENT')}
                  className={`p-4 rounded-[var(--radius-card)] border text-left flex items-start gap-3 transition-colors duration-[var(--duration-fast)] cursor-pointer ${
                    role === 'PARENT'
                      ? 'border-[var(--accent-border)] bg-[var(--accent-soft)]'
                      : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-muted)]/60'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-[var(--radius-control)] flex items-center justify-center shrink-0 ${
                      role === 'PARENT'
                        ? 'bg-[var(--accent)] text-[var(--on-accent)]'
                        : 'bg-[var(--surface-muted)] text-[var(--text-secondary)]'
                    }`}
                  >
                    <Users className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <div>
                    <span className="font-semibold text-sm text-[var(--text-primary)] block">
                      Học sinh / Phụ huynh
                    </span>
                    <span className="text-xs text-[var(--text-secondary)] mt-0.5 block">
                      Theo dõi vị trí GPS, ứng dụng đang mở và bảo vệ thiết bị của con
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Basic Information */}
            <div className="space-y-4">
              <label className="block text-xs font-medium text-[var(--text-secondary)]">
                2. Thông tin cá nhân và tài khoản
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EducationInput
                  label="Họ và tên"
                  placeholder="Nguyễn Văn An"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={errors.name}
                  icon={<User className="w-4 h-4" strokeWidth={1.5} />}
                  required
                />

                <EducationInput
                  label="Email hoặc số điện thoại"
                  placeholder="gv.an@truong.edu.vn hoặc 0901234567"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  icon={<Mail className="w-4 h-4" strokeWidth={1.5} />}
                  helperText="Dùng để đăng nhập vào hệ thống"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5 text-left">
                  <label className="block text-xs font-medium text-[var(--text-secondary)]">
                    Đơn vị trường học <span className="text-[var(--danger)]">*</span>
                  </label>
                  <select
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full h-10 bg-[var(--surface)] text-[var(--text-primary)] text-sm font-normal rounded-[var(--radius-control)] border border-[var(--border-strong)] px-3 focus:outline-none focus:border-[var(--accent)]"
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
                  placeholder="10A1"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  icon={<School className="w-4 h-4" strokeWidth={1.5} />}
                  required
                />
              </div>

              {role === 'PARENT' && (
                <EducationInput
                  label="Tên học sinh (con của bạn)"
                  placeholder="Nguyễn Văn Bình"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  icon={<GraduationCap className="w-4 h-4" strokeWidth={1.5} />}
                />
              )}
            </div>

            {/* Password Section */}
            <div className="space-y-4">
              <label className="block text-xs font-medium text-[var(--text-secondary)]">
                3. Thiết lập mật khẩu
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EducationInput
                  label="Mật khẩu (tối thiểu 6 ký tự)"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  icon={<Lock className="w-4 h-4" strokeWidth={1.5} />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
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

                <EducationInput
                  label="Xác nhận lại mật khẩu"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={errors.confirmPassword}
                  icon={<Lock className="w-4 h-4" strokeWidth={1.5} />}
                  rightElement={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" strokeWidth={1.5} />
                      ) : (
                        <Eye className="w-4 h-4" strokeWidth={1.5} />
                      )}
                    </button>
                  }
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <EducationButton
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                icon={<ArrowRight className="w-4 h-4" strokeWidth={1.5} />}
                iconPosition="right"
                isLoading={isLoading}
              >
                Hoàn tất đăng ký tài khoản
              </EducationButton>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
