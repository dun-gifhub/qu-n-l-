import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { Device } from '../../types/index.ts';
import { PlusCircle, X, RefreshCw, Key } from 'lucide-react';

interface AddDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceCreated: (newDevice: Device) => void;
}

export const AddDeviceModal: React.FC<AddDeviceModalProps> = ({
  isOpen,
  onClose,
  onDeviceCreated,
}) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [schoolName, setSchoolName] = useState('THPT Chuyên Lê Hồng Phong');
  const [className, setClassName] = useState('10A1');
  const [platform, setPlatform] = useState<'iOS' | 'Android' | 'Tablet'>('iOS');
  const [osVersion, setOsVersion] = useState('');
  const [appVersion, setAppVersion] = useState('2.1.0');
  const [deviceUuid, setDeviceUuid] = useState(
    () =>
      'DEV-' +
      Math.random().toString(36).substring(2, 8).toUpperCase() +
      '-' +
      Date.now().toString(36).toUpperCase()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (user.schoolName && user.role !== 'ADMIN') {
        setSchoolName(user.schoolName);
      }
      if (user.className) {
        setClassName(user.className);
      }
      if (user.studentName && !studentName) {
        setStudentName(user.studentName.split(',')[0].trim());
      }
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const regenerateUuid = () => {
    setDeviceUuid(
      'DEV-' +
        Math.random().toString(36).substring(2, 8).toUpperCase() +
        '-' +
        Date.now().toString(36).toUpperCase()
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập tên thiết bị');
      return;
    }
    if (!studentName.trim()) {
      setErrorMsg('Vui lòng nhập họ tên học sinh sử dụng máy');
      return;
    }
    if (!schoolName.trim()) {
      setErrorMsg('Vui lòng nhập tên trường học để Giáo viên chủ nhiệm cùng trường theo dõi');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const res = await api.createDevice({
      name: name.trim(),
      studentName: studentName.trim(),
      schoolName: schoolName.trim(),
      className: className.trim() || undefined,
      platform,
      osVersion: osVersion.trim() || undefined,
      appVersion: appVersion.trim() || '2.1.0',
      deviceUuid: deviceUuid.trim(),
    });

    setIsLoading(false);

    if (res.success && res.data) {
      onDeviceCreated(res.data);
      onClose();
    } else {
      setErrorMsg(res.message || 'Không thể tạo thiết bị');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Thêm Thiết Bị Học Sinh Mới
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Đồng bộ với Phụ huynh, Giáo viên chủ nhiệm cùng trường & Admin
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Họ và tên học sinh (Con) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Nguyễn Minh Khôi"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Trường học đăng ký <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="VD: THPT Chuyên Lê Hồng Phong"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Lớp học
              </label>
              <input
                type="text"
                placeholder="10A1"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tên thiết bị điện thoại / máy tính bảng <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: iPhone 15 Pro - Minh Khôi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nền tảng (Platform)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['iOS', 'Android', 'Tablet'] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium cursor-pointer transition ${
                    platform === p
                      ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-indigo-500" /> Device UUID
              </label>
              <button
                type="button"
                onClick={regenerateUuid}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" /> Tạo mới
              </button>
            </div>
            <input
              type="text"
              value={deviceUuid}
              onChange={(e) => setDeviceUuid(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200"
              required
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              {isLoading ? 'Đang lưu...' : 'Thêm thiết bị'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
