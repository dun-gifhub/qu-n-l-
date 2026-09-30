import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import {
  User,
  Shield,
  Key,
  Database,
  Lock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Code2,
  Terminal,
  FileText,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [dbInfo, setDbInfo] = useState<{ type: string; status: string } | null>(null);

  useEffect(() => {
    if (user?.name) setName(user.name);
    api.checkHealth().then((res) => {
      if (res.success && res.data?.database) {
        setDbInfo(res.data.database);
      }
    });
  }, [user]);

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
      currentPassword: currentPassword || undefined,
      newPassword: newPassword || undefined,
    });
    setIsLoading(false);

    if (res.success) {
      setStatusMsg({ type: 'success', text: 'Cập nhật thông tin tài khoản thành công!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } else {
      setStatusMsg({ type: 'error', text: res.message || 'Không thể cập nhật thông tin' });
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Cài Đặt & Cấu Hình
        </h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Quản lý tài khoản cá nhân, bảo mật, quyền riêng tư và thông số Neon PostgreSQL
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

      {/* 1. Profile and Password */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Thông Tin Tài Khoản</span>
        </h2>

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
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Đổi Mật Khẩu (Để trống nếu không thay đổi)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Mật khẩu hiện tại
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Mật khẩu mới
                </label>
                <input
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Xác nhận mật khẩu mới
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-md transition cursor-pointer"
            >
              {isLoading ? 'Đang cập nhật...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Privacy Policy Section (Mandatory Section 21) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-500" />
          <span>Chính Sách & Quyền Riêng Tư (Privacy)</span>
        </h2>

        <div className="p-4 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/40 border border-indigo-200/60 dark:border-indigo-800/60 text-xs md:text-sm text-indigo-950 dark:text-indigo-200 leading-relaxed font-medium space-y-2">
          <p>
            Vị trí chỉ được thu thập khi thiết bị đã cấp quyền và người dùng bật tính năng chia sẻ vị trí.
          </p>
          <p>
            Bạn có thể tắt chia sẻ vị trí bất cứ lúc nào trong cài đặt của thiết bị hoặc tài khoản.
          </p>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Hệ thống tuân thủ nguyên tắc minh bạch, bảo mật hai lớp và tuyệt đối không hỗ trợ hoặc xây dựng chức năng theo dõi bí mật. Mọi thay đổi về vị trí đều được ghi log rõ ràng trong phần Nhật ký Hoạt động.
        </p>
      </div>

      {/* 3. Database & Neon PostgreSQL Configuration */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Cơ Sở Dữ Liệu Neon PostgreSQL</span>
          </h2>

          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {dbInfo?.type || 'Neon PostgreSQL'}
          </span>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          Khi deploy lên <strong>Render</strong>, bạn chỉ cần liên kết biến môi trường <code>DATABASE_URL</code> từ tài khoản Neon PostgreSQL (Serverless Postgres).
        </p>

        <div className="p-4 rounded-2xl bg-slate-950 text-slate-200 text-xs font-mono space-y-2 border border-slate-800">
          <div className="text-slate-400">// Cấu hình trong Render Environment Variables:</div>
          <div>DATABASE_URL="postgresql://user:password@ep-xyz-123456.us-east-2.aws.neon.tech/neondb?sslmode=require"</div>
          <div>JWT_SECRET="YOUR_SUPER_SECRET_PRODUCTION_KEY"</div>
          <div>NODE_ENV="production"</div>
        </div>

        <div className="pt-2 text-xs text-slate-500">
          File lược đồ dữ liệu Prisma được đặt tại: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono">prisma/schema.prisma</code>
        </div>
      </div>
    </div>
  );
};
