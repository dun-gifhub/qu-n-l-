import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { Device } from '../../types/index.ts';
import {
  Search,
  UserCheck,
  ShieldCheck,
  ShieldOff,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Clock,
  ChevronDown,
} from 'lucide-react';

interface StudentExcuseManagerProps {
  readOnly?: boolean;
  onChanged?: () => void;
}

const PRESET_REASONS = [
  'Nghỉ ốm có phép',
  'Ôn / Thi HSG',
  'Việc gia đình có phép',
  'Hoạt động ngoại khóa / Đoàn đội',
];

function getTodayVietnamIso(): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export const StudentExcuseManager: React.FC<StudentExcuseManagerProps> = ({
  readOnly = false,
  onChanged,
}) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<string>('ALL');
  const [filterMode, setFilterMode] = useState<'ALL' | 'EXCUSED'>('ALL');

  const [editingDeviceId, setEditingDeviceId] = useState<string | null>(null);
  const [reasonDraft, setReasonDraft] = useState<string>('Nghỉ ốm có phép');
  const [durationMode, setDurationMode] = useState<'TODAY' | 'UNTIL' | 'INDEFINITE'>('TODAY');
  const [untilDateDraft, setUntilDateDraft] = useState<string>(getTodayVietnamIso());
  const [savingId, setSavingId] = useState<string | null>(null);

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const loadDevices = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await api.getDevices();
      if (res.success && res.data) {
        setDevices(res.data);
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDevices(false);
  }, []);

  const availableGrades = Array.from(
    new Set(devices.map((d) => d.grade).filter(Boolean) as string[])
  ).sort();

  const excusedCount = devices.filter((d) => Boolean(d.isExcused)).length;

  const filteredDevices = devices.filter((d) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      (d.studentName || '').toLowerCase().includes(q) ||
      d.name.toLowerCase().includes(q) ||
      (d.className || '').toLowerCase().includes(q) ||
      (d.schoolName || '').toLowerCase().includes(q) ||
      (d.grade || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (selectedGrade !== 'ALL' && d.grade !== selectedGrade) return false;
    if (filterMode === 'EXCUSED' && !d.isExcused) return false;
    return true;
  });

  const openEditorForDevice = (d: Device) => {
    const todayVN = getTodayVietnamIso();
    setEditingDeviceId(d.id);
    setReasonDraft(d.excuseReason?.trim() || 'Nghỉ ốm có phép');
    if (d.excuseUntil) {
      if (d.excuseUntil === todayVN) {
        setDurationMode('TODAY');
      } else {
        setDurationMode('UNTIL');
      }
      setUntilDateDraft(d.excuseUntil);
    } else if (d.isExcused) {
      setDurationMode('INDEFINITE');
      setUntilDateDraft(todayVN);
    } else {
      setDurationMode('TODAY');
      setUntilDateDraft(todayVN);
    }
  };

  const handleSaveExcuse = async (device: Device) => {
    const cleanReason = reasonDraft.trim();
    if (!cleanReason) {
      setFeedback({ type: 'error', text: 'Vui lòng nhập hoặc chọn lý do nghỉ học hợp lệ.' });
      return;
    }

    const excuseUntil =
      durationMode === 'TODAY'
        ? getTodayVietnamIso()
        : durationMode === 'UNTIL'
        ? untilDateDraft || getTodayVietnamIso()
        : undefined;

    setSavingId(device.id);
    setFeedback(null);
    const res = await api.setDeviceExcuse(device.id, {
      isExcused: true,
      excuseReason: cleanReason,
      excuseUntil,
    });
    setSavingId(null);

    if (res.success && res.data) {
      setDevices((prev) => prev.map((item) => (item.id === device.id ? res.data! : item)));
      setEditingDeviceId(null);
      setFeedback({
        type: 'success',
        text: `Đã duyệt đặc cách nghỉ cho ${device.studentName || device.name} (${cleanReason}).`,
      });
      if (onChanged) onChanged();
    } else {
      setFeedback({
        type: 'error',
        text: res.message || 'Không thể lưu đặc cách nghỉ học.',
      });
    }
  };

  const handleRevokeExcuse = async (device: Device) => {
    setSavingId(device.id);
    setFeedback(null);
    const res = await api.setDeviceExcuse(device.id, {
      isExcused: false,
      excuseReason: '',
    });
    setSavingId(null);

    if (res.success && res.data) {
      setDevices((prev) => prev.map((item) => (item.id === device.id ? res.data! : item)));
      if (editingDeviceId === device.id) setEditingDeviceId(null);
      setFeedback({
        type: 'success',
        text: `Đã mở lại giám sát giờ học bình thường cho ${device.studentName || device.name}.`,
      });
      if (onChanged) onChanged();
    } else {
      setFeedback({
        type: 'error',
        text: res.message || 'Không thể hủy trạng thái đặc cách nghỉ.',
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Info Banner */}
      <div className="p-4 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-[var(--radius-control)] bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--accent-ink)] flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Đặc cách cho từng học sinh nghỉ có lý do
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
              Học sinh được đặc cách sẽ không bị báo cảnh báo dùng điện thoại trong giờ học trong thời gian nghỉ đã chọn.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2.5 py-1 rounded-[6px] bg-[var(--surface-muted)] border border-[var(--border)] text-xs font-mono tabular-nums text-[var(--text-primary)]">
            Đang nghỉ có phép: {excusedCount}/{devices.length}
          </span>
          <button
            type="button"
            onClick={() => loadDevices(false)}
            className="h-9 w-9 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-muted)] text-[var(--text-secondary)] flex items-center justify-center cursor-pointer"
            title="Làm mới danh sách"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-[var(--radius-control)] border text-xs flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-[var(--success-soft)] border-[var(--success-border)] text-[var(--success)]'
              : 'bg-[var(--danger-soft)] border-[var(--danger-border)] text-[var(--danger)]'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="p-4 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] flex flex-col md:flex-row items-stretch md:items-center gap-3">
        <div className="relative flex-1">
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            strokeWidth={1.5}
          />
          <input
            type="text"
            placeholder="Tìm theo tên học sinh, lớp, khối hoặc trường"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="appearance-none h-10 pl-3 pr-8 bg-[var(--surface-muted)] border border-[var(--border)] rounded-[var(--radius-control)] text-xs font-medium text-[var(--text-primary)] focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả các khối</option>
              {availableGrades.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
            <ChevronDown
              className="w-4 h-4 text-[var(--text-muted)] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
              strokeWidth={1.5}
            />
          </div>

          <button
            type="button"
            onClick={() => setFilterMode('ALL')}
            className={`h-10 px-3 rounded-[var(--radius-control)] text-xs font-medium border cursor-pointer transition-colors ${
              filterMode === 'ALL'
                ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] border-[var(--accent-border)]'
                : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border)]'
            }`}
          >
            Tất cả ({devices.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterMode('EXCUSED')}
            className={`h-10 px-3 rounded-[var(--radius-control)] text-xs font-medium border cursor-pointer transition-colors ${
              filterMode === 'EXCUSED'
                ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] border-[var(--accent-border)]'
                : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border)]'
            }`}
          >
            Đang nghỉ có phép ({excusedCount})
          </button>
        </div>
      </div>

      {/* Student List */}
      {isLoading ? (
        <div className="py-12 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-[var(--accent-ink)]" strokeWidth={1.5} />
          <span>Đang tải danh sách học sinh</span>
        </div>
      ) : filteredDevices.length === 0 ? (
        <div className="p-10 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] text-center text-xs text-[var(--text-secondary)]">
          Không có học sinh nào phù hợp với bộ lọc hiện tại.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDevices.map((d) => {
            const isEditing = editingDeviceId === d.id;
            const isBusy = savingId === d.id;

            return (
              <div
                key={d.id}
                className={`p-4 rounded-[var(--radius-card)] bg-[var(--surface)] border shadow-[var(--shadow-card)] space-y-4 ${
                  d.isExcused
                    ? 'border-[var(--accent-border)]'
                    : 'border-[var(--border)]'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--text-primary)]">
                        {d.studentName || d.name}
                      </span>
                      {d.isExcused ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-[11px] font-medium bg-[var(--accent-soft)] text-[var(--accent-ink)] border border-[var(--accent-border)]">
                          <ShieldOff className="w-3.5 h-3.5" strokeWidth={1.5} />
                          <span>Nghỉ có phép</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-[11px] font-medium bg-[var(--surface-muted)] text-[var(--text-secondary)] border border-[var(--border)]">
                          <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
                          <span>Giám sát giờ học bình thường</span>
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-[var(--text-secondary)]">
                      {d.schoolName || 'Chưa rõ trường'}
                      {d.className ? ` · Lớp ${d.className}` : ''}
                      {d.grade ? ` · ${d.grade}` : ''}
                      {` · ${d.name}`}
                    </div>

                    {d.isExcused && (
                      <div className="text-xs text-[var(--accent-ink)] flex flex-wrap items-center gap-2 pt-0.5">
                        <span>Lý do: {d.excuseReason || 'Nghỉ có phép'}</span>
                        <span className="text-[var(--text-muted)]">·</span>
                        <span className="font-mono tabular-nums">
                          {d.excuseUntil
                            ? `Hết ngày ${d.excuseUntil}`
                            : 'Cho đến khi mở lại'}
                        </span>
                        {d.excusedBy && (
                          <>
                            <span className="text-[var(--text-muted)]">·</span>
                            <span className="text-[var(--text-secondary)]">
                              Duyệt bởi {d.excusedBy}
                            </span>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {!readOnly && (
                    <div className="flex items-center gap-2 shrink-0">
                      {d.isExcused && (
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleRevokeExcuse(d)}
                          className="h-9 px-3 rounded-[var(--radius-control)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] border border-[var(--border-strong)] text-xs font-medium text-[var(--text-primary)] cursor-pointer disabled:opacity-50"
                        >
                          {isBusy ? 'Đang xử lý...' : 'Mở lại giám sát'}
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          isEditing ? setEditingDeviceId(null) : openEditorForDevice(d)
                        }
                        className={`h-9 px-3 rounded-[var(--radius-control)] text-xs font-medium cursor-pointer border transition-colors ${
                          isEditing
                            ? 'bg-[var(--surface-muted)] border-[var(--border-strong)] text-[var(--text-primary)]'
                            : d.isExcused
                            ? 'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--accent-ink)]'
                            : 'bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] border-transparent text-[var(--btn-primary-text)]'
                        }`}
                      >
                        {isEditing
                          ? 'Đóng'
                          : d.isExcused
                          ? 'Sửa lý do / thời hạn'
                          : 'Đặc cách cho nghỉ'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Inline Editor Drawer */}
                {isEditing && !readOnly && (
                  <div className="pt-4 border-t border-[var(--border)] space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-[var(--text-secondary)]">
                        Chọn nhanh hoặc nhập lý do nghỉ học
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {PRESET_REASONS.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setReasonDraft(preset)}
                            className={`h-8 px-3 rounded-[var(--radius-control)] text-xs font-medium border cursor-pointer transition-colors ${
                              reasonDraft === preset
                                ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] border-[var(--accent-border)]'
                                : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={reasonDraft}
                        onChange={(e) => setReasonDraft(e.target.value)}
                        placeholder="Ví dụ: Nghỉ ốm có giấy phép phụ huynh, đi thi HSG cấp tỉnh..."
                        className="w-full h-10 px-3 bg-[var(--surface-muted)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-[var(--text-secondary)]">
                        Thời hạn đặc cách
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setDurationMode('TODAY')}
                          className={`h-9 px-3 rounded-[var(--radius-control)] text-xs font-medium border inline-flex items-center gap-1.5 cursor-pointer ${
                            durationMode === 'TODAY'
                              ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] border-[var(--accent-border)]'
                              : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border)]'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                          <span>Chỉ hôm nay</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDurationMode('UNTIL')}
                          className={`h-9 px-3 rounded-[var(--radius-control)] text-xs font-medium border inline-flex items-center gap-1.5 cursor-pointer ${
                            durationMode === 'UNTIL'
                              ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] border-[var(--accent-border)]'
                              : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border)]'
                          }`}
                        >
                          <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
                          <span>Đến hết ngày</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setDurationMode('INDEFINITE')}
                          className={`h-9 px-3 rounded-[var(--radius-control)] text-xs font-medium border inline-flex items-center gap-1.5 cursor-pointer ${
                            durationMode === 'INDEFINITE'
                              ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] border-[var(--accent-border)]'
                              : 'bg-[var(--surface-muted)] text-[var(--text-secondary)] border-[var(--border)]'
                          }`}
                        >
                          <ShieldOff className="w-3.5 h-3.5" strokeWidth={1.5} />
                          <span>Cho đến khi mở lại</span>
                        </button>

                        {durationMode === 'UNTIL' && (
                          <input
                            type="date"
                            value={untilDateDraft}
                            min={getTodayVietnamIso()}
                            onChange={(e) => setUntilDateDraft(e.target.value)}
                            className="h-9 px-3 rounded-[var(--radius-control)] bg-[var(--surface-muted)] border border-[var(--border-strong)] text-xs font-mono tabular-nums text-[var(--text-primary)]"
                          />
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingDeviceId(null)}
                        className="h-9 px-3 rounded-[var(--radius-control)] border border-[var(--border-strong)] text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] cursor-pointer"
                      >
                        Hủy
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => handleSaveExcuse(d)}
                        className="h-9 px-4 rounded-[var(--radius-control)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] text-xs font-medium cursor-pointer disabled:opacity-50"
                      >
                        {isBusy ? 'Đang lưu...' : 'Lưu đặc cách nghỉ'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
