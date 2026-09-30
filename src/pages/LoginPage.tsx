import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Radio, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

interface LoginPageProps {
  navigate: (path: string) => void;
  message?: string;
}

const DEMO_ACCOUNTS = [
  {
    roleLabel: 'Vị trí 3: Admin Tối Thượng',
    desc: 'Toàn quyền hệ thống · Quản lý & duyệt tất cả tài khoản Giáo viên, Phụ huynh · Theo dõi mọi học sinh',
    email: 'admin@devicemonitor.vn',
    password: '123456',
  },
  {
    roleLabel: 'Vị trí 1: Giáo Viên Chủ Nhiệm (Trường LHP)',
    desc: 'Cô Nguyễn Thị Lan · Theo dõi toàn bộ học sinh đăng ký cùng trường THPT Chuyên Lê Hồng Phong',
    email: 'gv.lan@lehongphong.edu.vn',
    password: '123456',
  },
  {
    roleLabel: 'Vị trí 2: Phụ Huynh Học Sinh (PH Minh)',
    desc: 'Chỉ xem được con của mình (Minh Khôi & Ngọc Ánh) · Xem điện thoại dùng App gì, Web gì & chặn từ xa',
    email: 'ph.minh@gmail.com',
    password: '123456',
  },
  {
    roleLabel: 'Vị trí 2: Phụ Huynh Học Sinh 2 (PH Tuấn)',
    desc: 'Chỉ xem được con của mình (Trần Quốc Bảo - Lớp 10A2 THPT Chuyên Lê Hồng Phong)',
    email: 'ph.tuan@gmail.com',
    password: '123456',
  },
  {
    roleLabel: 'Tài Khoản Giáo Viên Chờ Admin Duyệt',
    desc: 'Thầy Trần Văn Hùng (THCS Nguyễn Du) · Minh họa trạng thái chờ Admin phê duyệt',
    email: 'gv.hung@nguyendu.edu.vn',
    password: '123456',
  },
];

export const LoginPage: React.FC<LoginPageProps> = ({ navigate, message }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setErrorMsg(res.message || 'Email hoặc mật khẩu không chính xác');
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setIsLoading(true);
    setErrorMsg(null);

    const res = await login(demoEmail, demoPassword);
    setIsLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setErrorMsg(res.message || 'Không thể đăng nhập tài khoản demo');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-4xl text-center">
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
          Đăng nhập Hệ thống Quản lý Học sinh & Thiết bị
        </h2>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          Chưa có tài khoản Giáo viên hoặc Phụ huynh?{' '}
          <button
            onClick={() => navigate('/register')}
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
          >
            Đăng ký tài khoản mới (Chờ Admin duyệt)
          </button>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Login Form */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 py-8 px-6 sm:px-8 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Đăng nhập bằng Email
            </h3>

            {message && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email tài khoản
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="admin@devicemonitor.vn"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isLoading ? 'Đang xác thực...' : 'Đăng nhập vào hệ thống'}
                  {!isLoading && <ArrowRight className="w-4 h-4" />}
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-1">
            <div>• <strong>Admin tối thượng</strong>: Duyệt tài khoản GV & PH, giám sát tất cả.</div>
            <div>• <strong>Giáo viên chủ nhiệm</strong>: Giám sát học sinh đăng ký cùng trường.</div>
            <div>• <strong>Phụ huynh</strong>: Chỉ xem con của mình, quản lý App & Web.</div>
          </div>
        </div>

        {/* Right: Quick 1-Click Login for the 3 Positions */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 py-6 px-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Chọn nhanh 3 vị trí để trải nghiệm ngay
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Nhấn vào bất kỳ vị trí nào bên dưới để đăng nhập tự động (Mật khẩu: 123456)
            </p>
          </div>

          <div className="space-y-2.5">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                disabled={isLoading}
                onClick={() => handleQuickDemoLogin(acc.email, acc.password)}
                className="w-full p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-left transition cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    {acc.roleLabel}
                  </span>
                  <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                    {acc.email}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {acc.desc}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
