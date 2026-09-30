import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { api } from '../services/api.ts';
import {
  User,
  Shield,
  Database,
  CheckCircle2,
  AlertCircle,
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
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [dbInfo, setDbInfo] = useState<{ type: string; status: string } | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setSchoolName(user.schoolName || '');
      setClassName(user.className || '');
      setStudentName(user.studentName || '');
      setPhone(user.phone || '');
    }
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
            <h3 className="text-xs font-bold text-slate-500 mb-3">
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
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
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
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
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
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
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

      {/* 2. Role & Privacy Policy */}
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
