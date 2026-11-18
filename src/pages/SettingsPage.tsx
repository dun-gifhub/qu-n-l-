import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import {
  User,
  Shield,
  Database,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
  Copy,
  Check,
  ExternalLink,
  Server,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [schoolName, setSchoolName] = useState(user?.schoolName || '');
  const [className, setClassName] = useState(user?.className || '');
  const [studentName, setStudentName] = useState(user?.studentName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [dbInfo, setDbInfo] = useState<{ type: string; status: string } | null>(null);
  const [dbStats, setDbStats] = useState<{
    isNeonConnected: boolean;
    totalUsers: number;
    totalDevices: number;
    totalLocations: number;
    databaseEngine: string;
  } | null>(null);
  const [customDbUrl, setCustomDbUrl] = useState('');
  const [isConnectingDb, setIsConnectingDb] = useState(false);
  const [dbConnectResult, setDbConnectResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedRenderGuide, setCopiedRenderGuide] = useState(false);

  const loadDbData = async () => {
    try {
      const [healthRes, statsRes] = await Promise.all([
        api.checkHealth(),
        api.getDatabaseStats(),
      ]);
      if (healthRes.success && healthRes.data?.database) {
        setDbInfo(healthRes.data.database);
      }
      if (statsRes.success && statsRes.data) {
        setDbStats(statsRes.data);
      }
    } catch {}
  };

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setSchoolName(user.schoolName || '');
      setClassName(user.className || '');
      setStudentName(user.studentName || '');
      setPhone(user.phone || '');
    }
    loadDbData();
  }, [user]);

  const handleConnectDb = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customDbUrl.trim()) return;
    setIsConnectingDb(true);
    setDbConnectResult(null);
    try {
      const res = await api.connectDatabase(customDbUrl.trim());
      if (res.success) {
        setDbConnectResult({
          type: 'success',
          message: 'Kết nối Neon PostgreSQL thành công. Hệ thống đã đồng bộ lại danh sách thiết bị.',
        });
        setCustomDbUrl('');
        await loadDbData();
      } else {
        setDbConnectResult({
          type: 'error',
          message: res.message || 'Không thể kết nối đến cơ sở dữ liệu. Vui lòng kiểm tra lại URL.',
        });
      }
    } catch (err: any) {
      setDbConnectResult({
        type: 'error',
        message: err.message || 'Lỗi kết nối cơ sở dữ liệu',
      });
    } finally {
      setIsConnectingDb(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);

    if (newPassword && newPassword !== confirmNewPassword) {
      setStatusMsg({ type: 'error', text: 'Mật khẩu mới xác nhận không khớp' });
      return;
    }

    setIsLoading(true);
    const res = await updateProfile({
      name: name.trim(),
      schoolName: schoolName.trim(),
      className: className.trim(),
      studentName: studentName.trim(),
      phone: phone.trim(),
      currentPassword: currentPassword || undefined,
      newPassword: newPassword || undefined,
    });
    setIsLoading(false);

    if (res.success) {
      setStatusMsg({ type: 'success', text: 'Cập nhật thông tin tài khoản và trường học thành công' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      setStatusMsg({ type: 'error', text: res.message || 'Không thể cập nhật thông tin' });
    }
  };

  const roleText =
    user?.role === 'ADMIN'
      ? 'Admin tối thượng (Quản lý tất cả tài khoản & thiết bị)'
      : user?.role === 'TEACHER'
      ? 'Giáo viên chủ nhiệm (Theo dõi học sinh cùng trường)'
      : 'Phụ huynh học sinh (Chỉ xem & quản lý con của mình)';

  return (
    <div className="max-w-4xl space-y-6 animate-page-enter">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">
          Cài đặt tài khoản và phân quyền
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Quản lý hồ sơ cá nhân, trường học đăng ký, thông tin học sinh và cấu hình cơ sở dữ liệu
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-[var(--radius-card)] text-xs font-medium flex items-center gap-3 border ${
            statusMsg.type === 'success'
              ? 'bg-[var(--success-soft)] border-[var(--success-border)] text-[var(--success)]'
              : 'bg-[var(--danger-soft)] border-[var(--danger-border)] text-[var(--danger)]'
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

      {/* 1. Profile and School Assignment */}
      <div className="p-6 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--border)]">
          <h2 className="font-semibold text-base text-[var(--text-primary)] flex items-center gap-2">
            <User className="w-4 h-4 text-[var(--accent-ink)]" strokeWidth={1.5} />
            <span>Thông tin tài khoản và đơn vị</span>
          </h2>
          <span className="text-xs font-medium text-[var(--accent-ink)]">
            {roleText}
          </span>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Họ và tên
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-sm text-[var(--text-primary)]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Địa chỉ email định danh
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full h-10 px-3 bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius-control)] text-sm text-[var(--text-muted)] font-mono cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Trường học (Kết nối giáo viên chủ nhiệm và học sinh cùng trường)
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="VD: THPT Chuyên Lê Hồng Phong"
                className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-sm text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Lớp học hoặc lớp chủ nhiệm
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="VD: 10A1"
                className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-sm text-[var(--text-primary)]"
              />
            </div>
          </div>

          {user?.role === 'PARENT' && (
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Họ tên học sinh đang theo dõi
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="VD: Nguyễn Minh Khôi"
                className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-sm text-[var(--text-primary)]"
              />
            </div>
          )}

          <div className="pt-4 border-t border-[var(--border)]">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[var(--accent-ink)]" strokeWidth={1.5} />
                <h3 className="text-xs font-semibold text-[var(--text-primary)]">
                  {user?.role === 'ADMIN'
                    ? 'Đổi mật khẩu quản trị viên (Admin)'
                    : 'Đổi mật khẩu (Để trống nếu không thay đổi)'}
                </h3>
                {user?.role === 'ADMIN' && (
                  <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-mono font-medium bg-[var(--accent-soft)] text-[var(--accent-ink)] border border-[var(--accent-border)]">
                    Quyền Admin
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-[var(--accent-ink)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" strokeWidth={1.5} />
                ) : (
                  <Eye className="w-4 h-4" strokeWidth={1.5} />
                )}
                <span>{showPassword ? 'Ẩn ký tự' : 'Hiện ký tự'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  Mật khẩu hiện tại {user?.role === 'ADMIN' && '(Có thể bỏ qua)'}
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs font-mono text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tối thiểu 6 ký tự"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs font-mono text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs font-mono text-[var(--text-primary)]"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="h-10 px-5 bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] disabled:opacity-50 text-[var(--btn-primary-text)] rounded-[var(--radius-control)] text-xs font-medium transition-[background-color,opacity] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer"
            >
              {isLoading ? 'Đang cập nhật' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Neon PostgreSQL Database Management & Render Persistence */}
      <div className="p-6 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-[var(--radius-control)] flex items-center justify-center shrink-0 border ${
                dbStats?.isNeonConnected
                  ? 'bg-[var(--success-soft)] text-[var(--success)] border-[var(--success-border)]'
                  : 'bg-[var(--warning-soft)] text-[var(--warning)] border-[var(--warning-border)]'
              }`}
            >
              <Database className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="font-semibold text-base text-[var(--text-primary)] flex flex-wrap items-center gap-2">
                <span>Cơ sở dữ liệu Neon PostgreSQL</span>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-[11px] font-medium border ${
                    dbStats?.isNeonConnected
                      ? 'bg-[var(--success-soft)] text-[var(--success)] border-[var(--success-border)]'
                      : 'bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger-border)]'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      dbStats?.isNeonConnected ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'
                    }`}
                  />
                  {dbStats?.isNeonConnected
                    ? 'Đã bảo vệ vĩnh viễn'
                    : 'Ổ đĩa tạm (dễ mất khi Render ngủ)'}
                </span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Động cơ hiện tại:{' '}
                <strong className="font-medium text-[var(--accent-ink)]">
                  {dbStats?.databaseEngine || dbInfo?.type || 'Đang kiểm tra'}
                </strong>
              </p>
            </div>
          </div>

          <button
            onClick={loadDbData}
            className="h-9 px-3 rounded-[var(--radius-control)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] text-xs font-medium flex items-center gap-2 transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] self-start sm:self-center cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" strokeWidth={1.5} />
            <span>Kiểm tra trạng thái</span>
          </button>
        </div>

        {/* Giải thích nguyên nhân Reset */}
        <div className="p-4 rounded-[var(--radius-control)] bg-[var(--warning-soft)] border border-[var(--warning-border)] text-xs text-[var(--text-primary)] space-y-2">
          <div className="font-semibold flex items-center gap-2 text-[var(--warning)]">
            <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
            <span>Vì sao dữ liệu có thể đặt lại khi máy chủ Render khởi động lại</span>
          </div>
          <p className="leading-relaxed text-[var(--text-secondary)]">
            Máy chủ Render (gói miễn phí) sử dụng ổ đĩa tạm (Ephemeral Disk) và đưa dịch vụ vào trạng thái ngủ sau 15 phút không hoạt động. Khi có người truy cập trở lại, Render tải lại container mới khiến tệp cục bộ bị xóa.
          </p>
          <p className="leading-relaxed text-[var(--text-primary)]">
            Giải pháp: Cấu hình chuỗi kết nối <code className="px-1.5 py-0.5 rounded bg-[var(--surface)] border border-[var(--border)] font-mono">DATABASE_URL</code> (Neon PostgreSQL hoặc Supabase) vào biến môi trường Render để lưu trữ thiết bị và lịch sử GPS vĩnh viễn.
          </p>
        </div>

        {/* Thống kê dữ liệu hiện có trong Database */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-[var(--radius-control)] bg-[var(--surface-muted)]/60 border border-[var(--border)]">
            <div className="text-xs text-[var(--text-secondary)]">Tổng thiết bị lưu trữ</div>
            <div className="text-xl font-semibold font-mono tabular-nums text-[var(--text-primary)] mt-1">
              {dbStats?.totalDevices ?? 0}
            </div>
          </div>
          <div className="p-4 rounded-[var(--radius-control)] bg-[var(--surface-muted)]/60 border border-[var(--border)]">
            <div className="text-xs text-[var(--text-secondary)]">Tài khoản quản lý</div>
            <div className="text-xl font-semibold font-mono tabular-nums text-[var(--text-primary)] mt-1">
              {dbStats?.totalUsers ?? 0}
            </div>
          </div>
          <div className="p-4 rounded-[var(--radius-control)] bg-[var(--surface-muted)]/60 border border-[var(--border)]">
            <div className="text-xs text-[var(--text-secondary)]">Tọa độ GPS lưu trữ</div>
            <div className="text-xl font-semibold font-mono tabular-nums text-[var(--text-primary)] mt-1">
              {dbStats?.totalLocations ?? 0}
            </div>
          </div>
          <div className="p-4 rounded-[var(--radius-control)] bg-[var(--surface-muted)]/60 border border-[var(--border)]">
            <div className="text-xs text-[var(--text-secondary)]">Trạng thái kết nối</div>
            <div className="text-xs font-medium mt-2">
              {dbStats?.isNeonConnected ? (
                <span className="text-[var(--success)] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                  <span>Neon Cloud</span>
                </span>
              ) : (
                <span className="text-[var(--warning)] flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" strokeWidth={1.5} />
                  <span>Ổ đĩa tạm</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Form nhập DATABASE_URL trực tiếp */}
        <form onSubmit={handleConnectDb} className="space-y-2 pt-2">
          <label className="block text-xs font-medium text-[var(--text-secondary)]">
            Kích hoạt chuỗi kết nối Neon PostgreSQL (DATABASE_URL)
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="postgresql://username:password@ep-xyz.neon.tech/neondb?sslmode=require"
              value={customDbUrl}
              onChange={(e) => setCustomDbUrl(e.target.value)}
              className="flex-1 h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs font-mono text-[var(--text-primary)]"
            />
            <button
              type="submit"
              disabled={isConnectingDb || !customDbUrl.trim()}
              className="h-10 px-5 bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] disabled:opacity-50 text-[var(--btn-primary-text)] rounded-[var(--radius-control)] text-xs font-medium transition-[background-color,opacity] duration-[var(--duration-fast)] ease-[var(--ease-standard)] flex items-center justify-center gap-2 shrink-0 cursor-pointer"
            >
              {isConnectingDb ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                  <span>Đang kết nối</span>
                </>
              ) : (
                <>
                  <Database className="w-4 h-4" strokeWidth={1.5} />
                  <span>Kết nối ngay</span>
                </>
              )}
            </button>
          </div>

          {dbConnectResult && (
            <div
              className={`p-3 rounded-[var(--radius-control)] text-xs flex items-center gap-2 border ${
                dbConnectResult.type === 'success'
                  ? 'bg-[var(--success-soft)] border-[var(--success-border)] text-[var(--success)]'
                  : 'bg-[var(--danger-soft)] border-[var(--danger-border)] text-[var(--danger)]'
              }`}
            >
              {dbConnectResult.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              )}
              <span>{dbConnectResult.message}</span>
            </div>
          )}
        </form>

        {/* Hướng dẫn Render từng bước */}
        <div className="p-4 rounded-[var(--radius-control)] bg-[var(--surface-muted)]/60 border border-[var(--border)] text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-[var(--text-primary)] flex items-center gap-2">
              <Server className="w-4 h-4 text-[var(--accent-ink)]" strokeWidth={1.5} />
              <span>Hướng dẫn cấu hình biến môi trường trên Render</span>
            </span>
            <button
              type="button"
              onClick={() => {
                const guide = `Cách cấu hình DATABASE_URL trên Render:
1. Mở https://dashboard.render.com
2. Chọn Web Service của bạn: qu-n-l-s1k1
3. Vào tab "Environment" ở cột bên trái
4. Nhấn "Add Environment Variable"
5. Key: DATABASE_URL
6. Value: [Dán chuỗi postgresql://... từ Neon/Supabase của bạn]
7. Nhấn "Save Changes"`;
                navigator.clipboard.writeText(guide);
                setCopiedRenderGuide(true);
                setTimeout(() => setCopiedRenderGuide(false), 2500);
              }}
              className="text-xs font-medium text-[var(--accent-ink)] hover:underline flex items-center gap-1 cursor-pointer"
            >
              {copiedRenderGuide ? (
                <Check className="w-4 h-4 text-[var(--success)]" strokeWidth={1.5} />
              ) : (
                <Copy className="w-4 h-4" strokeWidth={1.5} />
              )}
              <span>{copiedRenderGuide ? 'Đã sao chép hướng dẫn' : 'Sao chép hướng dẫn'}</span>
            </button>
          </div>

          <ol className="list-decimal list-inside space-y-1 text-[var(--text-secondary)] leading-relaxed">
            <li>
              Truy cập{' '}
              <a
                href="https://dashboard.render.com"
                target="_blank"
                rel="noreferrer"
                className="text-[var(--accent-ink)] underline font-medium inline-flex items-center gap-1"
              >
                dashboard.render.com <ExternalLink className="w-3 h-3" strokeWidth={1.5} />
              </a>{' '}
              và chọn dịch vụ của bạn (<span className="font-mono font-medium">qu-n-l-s1k1</span>).
            </li>
            <li>Bấm vào mục Environment ở thanh bên trái.</li>
            <li>Nhấn Add Environment Variable.</li>
            <li>
              Nhập Key:{' '}
              <code className="px-1.5 py-0.5 bg-[var(--surface)] border border-[var(--border)] rounded font-medium font-mono">
                DATABASE_URL
              </code>
            </li>
            <li>Dán chuỗi kết nối PostgreSQL từ tài khoản Neon hoặc Supabase.</li>
            <li>Nhấn Save Changes để Render khởi động lại với kết nối cơ sở dữ liệu lâu dài.</li>
          </ol>
        </div>
      </div>

      {/* 3. Role & Privacy Policy */}
      <div className="p-6 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-3">
        <h2 className="font-semibold text-base text-[var(--text-primary)] flex items-center gap-2">
          <Shield className="w-4 h-4 text-[var(--success)]" strokeWidth={1.5} />
          <span>Quy tắc phân quyền 3 vị trí và bảo mật</span>
        </h2>

        <div className="text-xs text-[var(--text-secondary)] space-y-2 leading-relaxed">
          <p>
            <strong className="font-semibold text-[var(--text-primary)]">Admin tối thượng:</strong> Quản lý tất cả tài khoản giáo viên và phụ huynh, xét duyệt đăng ký mới và theo dõi toàn bộ thiết bị trên hệ thống.
          </p>
          <p>
            <strong className="font-semibold text-[var(--text-primary)]">Giáo viên chủ nhiệm:</strong> Theo dõi tất cả học sinh đăng ký cùng trường học với giáo viên đó.
          </p>
          <p>
            <strong className="font-semibold text-[var(--text-primary)]">Phụ huynh học sinh:</strong> Chỉ xem và quản lý thiết bị của con mình, theo dõi ứng dụng đang mở, lịch sử web và định vị GPS.
          </p>
        </div>
      </div>
    </div>
  );
};
