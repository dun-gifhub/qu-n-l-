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
          message: 'Kết nối Neon PostgreSQL thành công! Đã tự động đồng bộ và tái tạo danh sách thiết bị.',
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
        message: err.message || 'Lỗi kết nối cơ sở dữ liệu.',
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
      setStatusMsg({ type: 'success', text: 'Cập nhật thông tin tài khoản & trường học thành công!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      setStatusMsg({ type: 'error', text: res.message || 'Không thể cập nhật thông tin' });
    }
  };

  const roleText =
    user?.role === 'ADMIN'
      ? 'Admin Tối Thượng (Quản lý tất cả tài khoản & thiết bị)'
      : user?.role === 'TEACHER'
      ? 'Giáo Viên Chủ Nhiệm (Theo dõi học sinh cùng trường)'
      : 'Phụ Huynh Học Sinh (Chỉ xem & quản lý con của mình)';

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Cài Đặt Tài Khoản & Phân Quyền
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Quản lý hồ sơ cá nhân, trường học đăng ký, thông tin học sinh và bảo mật
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl text-xs md:text-sm flex items-center gap-2.5 ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* 1. Profile and School Assignment */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Thông Tin Tài Khoản & Vị Trí</span>
          </h2>
          <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            {roleText}
          </span>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Họ và tên
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Địa chỉ Email (Định danh)
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Trường học (Kết nối Giáo viên chủ nhiệm & Học sinh cùng trường)
              </label>
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="VD: THPT Chuyên Lê Hồng Phong"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lớp học / Lớp chủ nhiệm
              </label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="VD: 10A1"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {user?.role === 'PARENT' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Họ tên con (Học sinh đang theo dõi)
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="VD: Nguyễn Minh Khôi"
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100"
              />
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {user?.role === 'ADMIN'
                    ? 'Đổi Mật Khẩu Quản Trị Viên (Admin)'
                    : 'Đổi Mật Khẩu (Để trống nếu không thay đổi)'}
                </h3>
                {user?.role === 'ADMIN' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                    Quyền Admin
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showPassword ? 'Ẩn ký tự' : 'Hiện ký tự'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Mật khẩu hiện tại {user?.role === 'ADMIN' && '(Có thể bỏ qua)'}
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Tối thiểu 6 ký tự"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
            >
              {isLoading ? 'Đang cập nhật...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Neon PostgreSQL Database Management & Render Persistence */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 ${
              dbStats?.isNeonConnected
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
            }`}>
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <span>Cơ Sở Dữ Liệu Neon PostgreSQL Vĩnh Cửu</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  dbStats?.isNeonConnected
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                }`}>
                  {dbStats?.isNeonConnected ? '🟢 Đã Bảo Vệ Vĩnh Viễn' : '⚠️ Ổ Đĩa Tạm (Dễ Mất Khi Render Ngủ)'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Động cơ hiện tại: <strong className="text-indigo-600 dark:text-indigo-400">{dbStats?.databaseEngine || dbInfo?.type || 'Đang kiểm tra...'}</strong>
              </p>
            </div>
          </div>

          <button
            onClick={loadDbData}
            className="py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-center cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Kiểm tra trạng thái</span>
          </button>
        </div>

        {/* Giải thích nguyên nhân Reset */}
        <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 space-y-2">
          <div className="font-bold flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
            <span>TẠI SAO WEB TỰ ĐỘNG RESET VỀ DỮ LIỆU GỐC TRÊN RENDER?</span>
          </div>
          <p className="leading-relaxed">
            Máy chủ Render (gói miễn phí) sử dụng <strong>ổ đĩa tạm (Ephemeral Disk)</strong> và tự động đưa web vào trạng thái ngủ sau 15 phút không hoạt động. Khi có người truy cập trở lại, Render tải lại container mới từ GitHub khiến file tạm bị xóa sạch và reset về dữ liệu ban đầu.
          </p>
          <p className="leading-relaxed font-semibold text-amber-950 dark:text-amber-100">
            👉 Giải pháp chuẩn: Cấu hình chuỗi kết nối <code>DATABASE_URL</code> của bạn (Neon PostgreSQL hoặc Supabase) vào Render Environment. Khi đó mọi thiết bị và lịch sử GPS được lưu trên cloud PostgreSQL vĩnh cửu, không bao giờ bị mất!
          </p>
        </div>

        {/* Thống kê dữ liệu hiện có trong Database */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">Tổng thiết bị lưu trữ</div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {dbStats?.totalDevices ?? 0}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">Tài khoản quản lý</div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {dbStats?.totalUsers ?? 0}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">Tọa độ GPS di chuyển</div>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {dbStats?.totalLocations ?? 0}
            </div>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <div className="text-[11px] text-slate-500">Trạng thái kết nối</div>
            <div className="text-sm font-bold mt-2">
              {dbStats?.isNeonConnected ? (
                <span className="text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Neon Cloud
                </span>
              ) : (
                <span className="text-amber-500 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Ổ đĩa tạm
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Form nhập DATABASE_URL trực tiếp */}
        <form onSubmit={handleConnectDb} className="space-y-3 pt-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Kích hoạt chuỗi kết nối Neon PostgreSQL (DATABASE_URL):
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="postgresql://username:password@ep-xyz.neon.tech/neondb?sslmode=require"
              value={customDbUrl}
              onChange={(e) => setCustomDbUrl(e.target.value)}
              className="flex-1 px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100"
            />
            <button
              type="submit"
              disabled={isConnectingDb || !customDbUrl.trim()}
              className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              {isConnectingDb ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang kết nối...</span>
                </>
              ) : (
                <>
                  <Database className="w-3.5 h-3.5" />
                  <span>Kết Nối Ngay</span>
                </>
              )}
            </button>
          </div>

          {dbConnectResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                dbConnectResult.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400'
              }`}
            >
              {dbConnectResult.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{dbConnectResult.message}</span>
            </div>
          )}
        </form>

        {/* Hướng dẫn Render từng bước */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Server className="w-4 h-4 text-indigo-500" />
              <span>Hướng dẫn cấu hình biến môi trường trên Render vĩnh viễn:</span>
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
              className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              {copiedRenderGuide ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedRenderGuide ? 'Đã sao chép hướng dẫn' : 'Sao chép hướng dẫn'}</span>
            </button>
          </div>

          <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-300 leading-relaxed">
            <li>Truy cập <a href="https://dashboard.render.com" target="_blank" rel="noreferrer" className="text-indigo-600 dark:text-indigo-400 underline font-medium inline-flex items-center gap-0.5">dashboard.render.com <ExternalLink className="w-2.5 h-2.5" /></a> và chọn dịch vụ của bạn (<strong>qu-n-l-s1k1</strong>).</li>
            <li>Bấm vào menu <strong>Environment</strong> ở thanh bên trái.</li>
            <li>Nhấn <strong>Add Environment Variable</strong>.</li>
            <li>Nhập Key: <code className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-bold font-mono">DATABASE_URL</code></li>
            <li>Dán chuỗi kết nối PostgreSQL (từ tài khoản Neon hoặc Supabase của bạn như trong ảnh).</li>
            <li>Nhấn <strong>Save Changes</strong> để Render khởi động lại với kết nối cơ sở dữ liệu vĩnh cửu!</li>
          </ol>
        </div>
      </div>

      {/* 3. Role & Privacy Policy */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span>Quy Tắc Phân Quyền 3 Vị Trí & Bảo Mật</span>
        </h2>

        <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
          <p>
            • <strong>Admin Tối Thượng</strong>: Quản lý tất cả các tài khoản của Giáo viên và Phụ huynh, xét duyệt tài khoản đăng ký mới và theo dõi toàn bộ thiết bị trên hệ thống.
          </p>
          <p>
            • <strong>Giáo Viên Chủ Nhiệm</strong>: Biết và theo dõi tất cả các học sinh đăng ký cùng trường học với giáo viên đó.
          </p>
          <p>
            • <strong>Phụ Huynh Học Sinh</strong>: Chỉ xem và quản lý được thiết bị của con mình (xem điện thoại sử dụng App gì, truy cập Web gì để quản lý và định vị GPS).
          </p>
        </div>
      </div>
    </div>
  );
};
