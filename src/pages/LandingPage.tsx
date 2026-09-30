import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Radio,
  Smartphone,
  MapPin,
  Shield,
  Zap,
  Server,
  Database,
  ArrowRight,
  CheckCircle2,
  Code2,
  Terminal,
} from 'lucide-react';

interface LandingPageProps {
  navigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ navigate }) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <nav className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/25">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <span className="font-extrabold text-slate-900 dark:text-white tracking-tight text-lg">
              Device<span className="text-indigo-600 dark:text-indigo-400">Monitor</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm font-semibold shadow-md shadow-indigo-600/25 transition cursor-pointer"
              >
                Vào Dashboard &rarr;
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="py-2 px-4 text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs md:text-sm font-semibold shadow-md shadow-indigo-600/25 transition cursor-pointer"
                >
                  Đăng ký
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-24 md:pb-28 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-500/10 dark:bg-indigo-500/15 blur-3xl rounded-full pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Nền tảng Quản lý & Định vị IoT Tập Trung
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] mb-6">
            Quản lý thiết bị của bạn
          </h1>

          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Theo dõi trạng thái và vị trí thiết bị thông qua một dashboard tập trung. Sẵn sàng kết nối Mobile App qua chuẩn REST API bảo mật.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto py-3.5 px-7 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Mở Dashboard của bạn</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/register')}
                  className="w-full sm:w-auto py-3.5 px-7 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Bắt đầu Đăng ký</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto py-3.5 px-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 font-semibold text-sm text-slate-800 dark:text-slate-200 shadow-sm transition cursor-pointer"
                >
                  Đăng nhập
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-16 bg-white dark:bg-slate-900/60 border-y border-slate-200 dark:border-slate-800/80">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-3">
              Mọi tính năng cần thiết cho giám sát thiết bị
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Kiến trúc mở chuẩn hóa giúp bạn theo dõi thông số pin, mạng, và tọa độ bản đồ chi tiết.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Bản đồ & Lịch sử Vị trí
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Tích hợp Leaflet & OpenStreetMap. Xem lộ trình di chuyển theo từng khoảng thời gian (Hôm nay, 7 ngày, 30 ngày) cùng độ chính xác GPS.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Trạng thái & Heartbeat
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Giám sát mức pin (%), trạng thái sạc, kiểu kết nối mạng (WiFi, 4G, 5G) và trạng thái Online, Idle, Offline được cập nhật liên tục.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Bảo mật & Quyền riêng tư
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                Xác thực bằng JWT và mã hóa mật khẩu bcrypt. Vị trí chỉ được thu thập khi người dùng thiết bị cho phép và cấp quyền rõ ràng.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Showcase */}
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 shadow-2xl">
            <div className="max-w-2xl mb-8">
              <span className="text-xs font-mono font-semibold uppercase text-indigo-400 tracking-wider">
                Kiến Trúc Hệ Thống (Ready for Mobile App)
              </span>
              <h3 className="text-2xl md:text-3xl font-extrabold mt-2 tracking-tight">
                Web First &bull; Sẵn sàng cho Mobile App kết nối qua REST API
              </h3>
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">
                Hệ thống backend Node.js + Express + Neon PostgreSQL được xây dựng sẵn sàng để tiếp nhận dữ liệu telemetry từ iOS & Android app mà không cần viết lại.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700">
                <div className="flex items-center gap-2 text-indigo-400 mb-2 font-bold">
                  <Smartphone className="w-4 h-4" /> 1. Mobile App (Giai đoạn sau)
                </div>
                <div className="text-slate-300 space-y-1">
                  <div>POST /api/devices/:id/location</div>
                  <div>POST /api/devices/:id/heartbeat</div>
                  <div className="text-slate-500">// Gửi định kỳ GPS + Battery</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700">
                <div className="flex items-center gap-2 text-emerald-400 mb-2 font-bold">
                  <Server className="w-4 h-4" /> 2. Backend & Neon DB
                </div>
                <div className="text-slate-300 space-y-1">
                  <div>Node.js Express + Prisma</div>
                  <div>Neon Serverless PostgreSQL</div>
                  <div className="text-slate-500">// Render Web Service</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700">
                <div className="flex items-center gap-2 text-amber-400 mb-2 font-bold">
                  <Radio className="w-4 h-4" /> 3. Web Dashboard
                </div>
                <div className="text-slate-300 space-y-1">
                  <div>React + Vite + Tailwind</div>
                  <div>Bản đồ Leaflet thời gian thực</div>
                  <div className="text-slate-500">// Quản lý thiết bị & Lịch sử</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800/80 py-8 bg-white dark:bg-slate-900 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
            <Radio className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>DeviceMonitor &bull; Nền tảng quản lý thiết bị</span>
          </div>
          <div>
            Thiết kế theo kiến trúc Web-First &bull; Neon PostgreSQL &bull; Deploy Render
          </div>
        </div>
      </footer>
    </div>
  );
};
