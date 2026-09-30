import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Radio,
  Smartphone,
  MapPin,
  Shield,
  ArrowRight,
  GraduationCap,
  Users,
  ShieldCheck,
  Globe,
} from 'lucide-react';

interface LandingPageProps {
  navigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ navigate }) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Bar Contract: Zone 1 Brand, Zone 2 Nav Links, Zone 3 Primary Actions */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap"
          >
            DeviceMonitor
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            <a href="#roles" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap">
              3 Vị Trí Phân Quyền
            </a>
            <a href="#features" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap">
              Giám Sát App & Web
            </a>
            <a href="#school" className="hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap">
              Kết Nối Trường Học
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer whitespace-nowrap"
              >
                Vào Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="py-2 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 transition cursor-pointer whitespace-nowrap"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer whitespace-nowrap"
                >
                  Đăng ký
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-4">
            Hệ thống Quản lý Thiết bị Học sinh · Phân quyền 3 cấp Admin · Giáo viên · Phụ huynh
          </p>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight mb-6">
            Nền tảng phối hợp Nhà trường & Phụ huynh quản lý thiết bị học sinh
          </h1>

          <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Phụ huynh xem điện thoại con đang dùng ứng dụng gì, truy cập trang web nào để quản lý. Giáo viên chủ nhiệm theo dõi học sinh đăng ký cùng trường, và Admin tối thượng quản lý, phê duyệt toàn bộ tài khoản.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
              className="w-full sm:w-auto py-3.5 px-7 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
            >
              <span>{isAuthenticated ? 'Mở Dashboard Quản Trị' : 'Trải nghiệm 3 Vị trí ngay'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            {!isAuthenticated && (
              <button
                onClick={() => navigate('/register')}
                className="w-full sm:w-auto py-3.5 px-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 font-semibold text-sm text-slate-800 dark:text-slate-200 transition cursor-pointer whitespace-nowrap"
              >
                Đăng ký Giáo viên / Phụ huynh
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3 Positions Section */}
      <section id="roles" className="py-16 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
              3 Vị trí phân quyền chặt chẽ trong hệ thống
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Mỗi tài khoản khi đăng ký sẽ được phân quyền theo đúng trách nhiệm và được Admin phê duyệt trước khi hoạt động.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Position 1: Teacher */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <GraduationCap className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                01. Vị trí Giáo Viên Chủ Nhiệm
              </h3>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Giáo viên chủ nhiệm của trường sẽ tự động biết và theo dõi được tất cả các học sinh đăng ký cùng trường học đó. Kiểm soát việc sử dụng điện thoại trong giờ học và định vị an toàn.
              </p>
              <div className="pt-2 text-xs text-slate-500">
                Yêu cầu: Được Admin duyệt tài khoản · Đồng bộ theo Trường học
              </div>
            </div>

            {/* Position 2: Parent */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                02. Vị trí Phụ Huynh Học Sinh
              </h3>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Phụ huynh chỉ xem và quản lý riêng con của mình. Theo dõi chi tiết điện thoại con đang mở App gì (TikTok, Game, Học tập), truy cập Web gì, thời gian sử dụng và chặn App/Web từ xa.
              </p>
              <div className="pt-2 text-xs text-slate-500">
                Yêu cầu: Được Admin duyệt tài khoản · Bảo mật riêng tư từng gia đình
              </div>
            </div>

            {/* Position 3: Supreme Admin */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                03. Quyền Tối Thượng Admin
              </h3>
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Bao gồm tất cả các quyền trong hệ thống: Quản lý tất cả tài khoản của Giáo viên và Phụ huynh, xét duyệt hoặc khóa tài khoản đăng ký mới, và theo dõi toàn bộ tài khoản cũng như thiết bị.
              </p>
              <div className="pt-2 text-xs text-slate-500">
                Quyền hạn: Toàn quyền quản trị · Phê duyệt Giáo viên & Phụ huynh
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-8 bg-white dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-bold text-slate-800 dark:text-slate-200">
            DeviceMonitor · Hệ thống Quản lý Thiết bị Trường học & Gia đình
          </div>
          <div>
            3 Vị trí: Giáo viên chủ nhiệm · Phụ huynh · Admin tối thượng
          </div>
        </div>
      </footer>
    </div>
  );
};
