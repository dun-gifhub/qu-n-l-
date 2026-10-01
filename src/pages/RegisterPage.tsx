import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { UserRole } from '../types/index.ts';
import { Radio, Lock, Mail, User, ArrowRight, AlertCircle, GraduationCap, Users, Eye, EyeOff, Phone } from 'lucide-react';

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
  const [role, setRole] = useState<UserRole>('PARENT');
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

    // Only validate confirmPassword if the user manually entered something in it
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
          'Đăng ký thành công! Tài khoản Giáo viên / Phụ huynh của bạn đã được gửi tới Admin để phê duyệt.',
      });
    } else {
      if (res.errors) {
        setErrors(res.errors);
      }
      const firstErr = res.errors ? Object.values(res.errors)[0] : null;
      setGeneralError(firstErr || res.message || 'Không thể tạo tài khoản');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center">
        <div
          className="inline-flex items-center gap-2 cursor-pointer mb-3"
          onClick={() => navigate('/')}
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
            <Radio className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-slate-900 dark:text-white">
            DeviceMonitor
          </span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Đăng ký Tài khoản Giáo viên / Phụ huynh
        </h2>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          Tài khoản sau khi đăng ký sẽ được <strong>Admin tối thượng phê duyệt</strong>. Đã có tài khoản?{' '}
          <button
            onClick={() => navigate('/login')}
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            Đăng nhập ngay
          </button>
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white dark:bg-slate-900 py-7 px-6 sm:px-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {generalError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span className="font-medium">{generalError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Chọn vị trí đăng ký (Sẽ được Admin duyệt)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setRole('PARENT')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    role === 'PARENT'
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    <span>Vị trí: Phụ Huynh</span>
                  </div>
                  <p className="text-[11px] mt-1 opacity-80">
                    Theo dõi con mình, xem điện thoại dùng App gì, Web gì
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('TEACHER')}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    role === 'TEACHER'
                      ? 'border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <div className="font-bold text-xs flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4" />
                    <span>Vị trí: Giáo Viên CN</span>
                  </div>
                  <p className="text-[11px] mt-1 opacity-80">
                    Theo dõi tất cả học sinh đăng ký cùng trường học
                  </p>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {role === 'TEACHER' ? 'Họ tên Giáo viên' : 'Họ tên Phụ huynh'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={role === 'TEACHER' ? 'Cô Nguyễn Thị Lan' : 'PH Nguyễn Hoàng Minh'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                />
                {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Số điện thoại liên hệ
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="tel"
                    inputMode="tel"
                    placeholder="0901234567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email hoặc Số điện thoại đăng nhập *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  placeholder="name@example.com hoặc 0901234567"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Hỗ trợ cả Email lẫn Số điện thoại di động để đăng nhập dễ dàng trên điện thoại
              </p>
              {errors.email && <p className="text-[11px] text-rose-500 mt-1">{errors.email}</p>}
            </div>

            {/* School Name & Class Name */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Trường học (Kết nối Giáo viên & Học sinh cùng trường)
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder="VD: THPT Chuyên Lê Hồng Phong"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {SCHOOL_SUGGESTIONS.map((s) => (
                    <button
                      type="button"
                      key={s}
                      onClick={() => setSchoolName(s)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
                {errors.schoolName && <p className="text-[11px] text-rose-500 mt-1">{errors.schoolName}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {role === 'TEACHER' ? 'Lớp chủ nhiệm' : 'Lớp của con'}
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="VD: 10A1"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {role === 'PARENT' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Họ và tên con (Học sinh)
                  </label>
                  <span className="text-[10px] text-slate-400">Không bắt buộc</span>
                </div>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="VD: Nguyễn Minh Khôi (hoặc để trống, hệ thống tự điền)"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                />
                {errors.studentName && <p className="text-[11px] text-rose-500 mt-1">{errors.studentName}</p>}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mật khẩu (≥ 6 ký tự) *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-[11px] text-rose-500 mt-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-[11px] text-rose-500 mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 text-[11px] text-amber-800 dark:text-amber-300">
              Lưu ý: Tài khoản <strong>{role === 'TEACHER' ? 'Giáo viên chủ nhiệm' : 'Phụ huynh'}</strong> sau khi tạo sẽ ở trạng thái <strong>Chờ Admin duyệt</strong> để đảm bảo an toàn thông tin học sinh.
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
              >
                {isLoading ? 'Đang gửi đăng ký...' : 'Đăng ký & Gửi yêu cầu Admin duyệt'}
                {!isLoading && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
