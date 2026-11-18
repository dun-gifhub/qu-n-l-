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
  const [grade, setGrade] = useState('Khối 10');
  const [className, setClassName] = useState('10A1');
  const [platform, setPlatform] = useState<'iOS' | 'Android' | 'Tablet'>('iOS');
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
      grade: grade.trim() || undefined,
      className: className.trim() || undefined,
      platform,
      appVersion: '2.1.0',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--surface-overlay)]">
      <div className="relative w-full max-w-md bg-[var(--surface)] rounded-[var(--radius-panel)] shadow-[var(--shadow-elevated)] border border-[var(--border-strong)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-muted)]/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[var(--radius-control)] bg-[var(--accent-soft)] text-[var(--accent-ink)] flex items-center justify-center">
              <PlusCircle className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] text-base">
                Thêm thiết bị học sinh
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Đồng bộ với Phụ huynh, Giáo viên cùng trường và Quản trị viên
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-muted)] rounded-[var(--radius-control)] cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 text-xs bg-[var(--danger-soft)] border border-[var(--danger-border)] text-[var(--danger)] rounded-[var(--radius-control)]">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Họ và tên học sinh <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="text"
              placeholder="Ví dụ: Nguyễn Minh Khôi"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Trường học <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="text"
              placeholder="Ví dụ: THPT Chuyên Lê Hồng Phong"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Khối học
              </label>
              <select
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              >
                {['Khối 6', 'Khối 7', 'Khối 8', 'Khối 9', 'Khối 10', 'Khối 11', 'Khối 12', 'Khối Đại Học / Khác'].map(
                  (g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  )
                )}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Lớp học
              </label>
              <input
                type="text"
                placeholder="10A1"
                value={className}
                onChange={(e) => {
                  const val = e.target.value;
                  setClassName(val);
                  const m = val.match(/\d+/);
                  if (m) {
                    const n = parseInt(m[0], 10);
                    if (n >= 6 && n <= 12) setGrade(`Khối ${n}`);
                  }
                }}
                className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Tên thiết bị <span className="text-[var(--danger)]">*</span>
            </label>
            <input
              type="text"
              placeholder="Ví dụ: iPhone 15 - Minh Khôi"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Nền tảng
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['iOS', 'Android', 'Tablet'] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setPlatform(p)}
                  className={`h-9 px-3 rounded-[var(--radius-control)] border text-xs font-medium cursor-pointer transition-colors duration-[var(--duration-fast)] ${
                    platform === p
                      ? 'border-[var(--accent-border)] bg-[var(--accent-soft)] text-[var(--accent-ink)]'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[var(--text-muted)]" strokeWidth={1.5} />
                <span>Mã định danh thiết bị</span>
              </label>
              <button
                type="button"
                onClick={regenerateUuid}
                className="text-xs text-[var(--accent-ink)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span>Tạo mã mới</span>
              </button>
            </div>
            <input
              type="text"
              value={deviceUuid}
              onChange={(e) => setDeviceUuid(e.target.value)}
              className="w-full h-10 px-3 bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius-control)] text-xs font-mono text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
              required
            />
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 px-4 border border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] rounded-[var(--radius-control)] text-xs font-medium cursor-pointer transition-colors duration-[var(--duration-fast)]"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 h-10 px-4 bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] disabled:opacity-50 text-[var(--btn-primary-text)] rounded-[var(--radius-control)] text-xs font-medium cursor-pointer transition-colors duration-[var(--duration-fast)]"
            >
              {isLoading ? 'Đang lưu...' : 'Thêm thiết bị'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
