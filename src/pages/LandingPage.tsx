import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { ArrowRight, GraduationCap, Users, ShieldCheck } from 'lucide-react';

interface LandingPageProps {
  navigate: (path: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ navigate }) => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] flex flex-col">
      <header className="border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 z-30">
        <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            className="text-base font-semibold text-[var(--text-primary)] whitespace-nowrap"
          >
            DeviceMonitor
          </a>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--text-secondary)]">
            <a href="#roles" className="hover:text-[var(--text-primary)] transition-colors whitespace-nowrap">
              Phân quyền 3 cấp
            </a>
            <a href="#features" className="hover:text-[var(--text-primary)] transition-colors whitespace-nowrap">
              Giám sát App & Web
            </a>
            <a href="#school" className="hover:text-[var(--text-primary)] transition-colors whitespace-nowrap">
              Kết nối trường học
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="h-9 px-4 rounded-[var(--radius-control)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
              >
                Vào bảng điều khiển
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="h-9 px-3 text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer whitespace-nowrap"
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="h-9 px-4 rounded-[var(--radius-control)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
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
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="max-w-3xl">
            <p className="text-xs font-medium text-[var(--accent-ink)] mb-3">
              Hệ thống điều phối thiết bị học đường · Admin · Giáo viên · Phụ huynh
            </p>

            <h1 className="text-3xl md:text-5xl font-semibold tracking-tight text-[var(--text-primary)] leading-tight mb-6">
              Nền tảng phối hợp Nhà trường và Phụ huynh theo dõi thiết bị học sinh
            </h1>

            <p className="text-base text-[var(--text-secondary)] max-w-2xl mb-8 leading-relaxed">
              Phụ huynh theo dõi ứng dụng đang mở và website truy cập của con theo thời gian thực. Giáo viên chủ nhiệm nắm danh sách học sinh cùng trường trong giờ học, và Quản trị viên phê duyệt toàn bộ tài khoản.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <button
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
                className="h-11 px-6 rounded-[var(--radius-control)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
              >
                <span>{isAuthenticated ? 'Mở bảng điều khiển' : 'Đăng nhập hệ thống'}</span>
                <ArrowRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
              {!isAuthenticated && (
                <button
                  onClick={() => navigate('/register')}
                  className="h-11 px-5 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border-strong)] hover:bg-[var(--surface-muted)] font-medium text-sm text-[var(--text-primary)] transition-colors cursor-pointer whitespace-nowrap"
                >
                  Đăng ký Giáo viên hoặc Phụ huynh
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3 Positions Section */}
      <section id="roles" className="py-16 bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="max-w-2xl mb-10">
            <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-2">
              Ba vai trò phân quyền trong hệ thống
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Mỗi tài khoản khi đăng ký được phân quyền theo trách nhiệm và cần Quản trị viên phê duyệt trước khi hoạt động.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-[var(--radius-card)] bg-[var(--bg)] border border-[var(--border)] space-y-3">
              <div className="w-9 h-9 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] flex items-center justify-center">
                <GraduationCap className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                01. Giáo viên chủ nhiệm
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Giáo viên chủ nhiệm tự động đồng bộ và theo dõi các thiết bị học sinh đăng ký cùng đơn vị trường học, nhận cảnh báo sử dụng thiết bị trong giờ học.
              </p>
              <div className="pt-2 text-xs text-[var(--text-muted)]">
                Điều kiện: Quản trị viên phê duyệt · Đồng bộ theo trường học
              </div>
            </div>

            <div className="p-6 rounded-[var(--radius-card)] bg-[var(--bg)] border border-[var(--border)] space-y-3">
              <div className="w-9 h-9 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] flex items-center justify-center">
                <Users className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                02. Phụ huynh học sinh
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Phụ huynh chỉ xem và quản lý thiết bị của con mình: kiểm tra ứng dụng đang mở, lịch sử website, thời lượng sử dụng và khóa ứng dụng từ xa.
              </p>
              <div className="pt-2 text-xs text-[var(--text-muted)]">
                Điều kiện: Quản trị viên phê duyệt · Phạm vi gia đình
              </div>
            </div>

            <div className="p-6 rounded-[var(--radius-card)] bg-[var(--bg)] border border-[var(--border)] space-y-3">
              <div className="w-9 h-9 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-semibold text-[var(--text-primary)]">
                03. Quản trị viên hệ thống
              </h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Quản lý toàn bộ tài khoản Giáo viên và Phụ huynh, xét duyệt hoặc tạm khóa tài khoản đăng ký mới, và điều phối giám sát thiết bị toàn trường.
              </p>
              <div className="pt-2 text-xs text-[var(--text-muted)]">
                Quyền hạn: Toàn quyền quản trị · Phê duyệt tài khoản
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="mt-auto border-t border-[var(--border)] py-6 bg-[var(--surface)] text-xs text-[var(--text-secondary)]">
        <div className="max-w-[1440px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-medium text-[var(--text-primary)]">
            DeviceMonitor · Hệ thống điều phối thiết bị học đường
          </div>
          <div className="text-[var(--text-muted)]">
            Giáo viên chủ nhiệm · Phụ huynh · Quản trị viên
          </div>
        </div>
      </footer>
    </div>
  );
};
