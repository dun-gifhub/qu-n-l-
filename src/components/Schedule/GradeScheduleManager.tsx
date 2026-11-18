import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import {
  GradeScheduleWithStatus,
  GradeScheduleShift,
} from '../../types/index.ts';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Save,
  Copy,
  GraduationCap,
  ShieldOff,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface GradeScheduleManagerProps {
  readOnly?: boolean;
  compactHeader?: boolean;
  onSchedulesChanged?: () => void;
}

const WEEK_DAYS = [
  { value: 1, label: 'T2' },
  { value: 2, label: 'T3' },
  { value: 3, label: 'T4' },
  { value: 4, label: 'T5' },
  { value: 5, label: 'T6' },
  { value: 6, label: 'T7' },
  { value: 0, label: 'CN' },
];

const DAY_NAMES_VN = [
  'Chủ nhật',
  'Thứ hai',
  'Thứ ba',
  'Thứ tư',
  'Thứ năm',
  'Thứ sáu',
  'Thứ bảy',
];

interface DraftScheduleState {
  isDayOff: boolean;
  dayOffReason: string;
  activeDays: number[];
  shifts: GradeScheduleShift[];
}

export const GradeScheduleManager: React.FC<GradeScheduleManagerProps> = ({
  readOnly = false,
  compactHeader = false,
  onSchedulesChanged,
}) => {
  const [schedules, setSchedules] = useState<GradeScheduleWithStatus[]>([]);
  const [drafts, setDrafts] = useState<Record<string, DraftScheduleState>>({});
  const [serverTimeVN, setServerTimeVN] = useState<string>('--:--');
  const [serverDateVN, setServerDateVN] = useState<string>('');
  const [dayOfWeekVN, setDayOfWeekVN] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [savingGrade, setSavingGrade] = useState<string | null>(null);
  const [isGlobalBusy, setIsGlobalBusy] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const syncFromResponse = (data: {
    schedules: GradeScheduleWithStatus[];
    serverTimeVN: string;
    serverDateVN: string;
    dayOfWeekVN: number;
  }) => {
    setSchedules(data.schedules);
    setServerTimeVN(data.serverTimeVN);
    setServerDateVN(data.serverDateVN);
    setDayOfWeekVN(data.dayOfWeekVN);

    const nextDrafts: Record<string, DraftScheduleState> = {};
    for (const s of data.schedules) {
      nextDrafts[s.grade] = {
        isDayOff: s.isDayOff,
        dayOffReason: s.dayOffReason || '',
        activeDays: [...s.activeDays],
        shifts: s.shifts.map((sh) => ({ ...sh })),
      };
    }
    setDrafts(nextDrafts);
  };

  const loadSchedules = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const res = await api.getGradeSchedules();
      if (res.success && res.data) {
        syncFromResponse(res.data);
      } else if (!silent) {
        setFeedback({
          type: 'error',
          text: res.message || 'Không thể tải cấu hình giờ học theo khối',
        });
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules(false);
  }, []);

  const isDirty = (grade: string): boolean => {
    const saved = schedules.find((s) => s.grade === grade);
    const draft = drafts[grade];
    if (!saved || !draft) return false;
    if (saved.isDayOff !== draft.isDayOff) return true;
    if ((saved.dayOffReason || '') !== (draft.dayOffReason || '')) return true;
    if (
      JSON.stringify([...saved.activeDays].sort()) !==
      JSON.stringify([...draft.activeDays].sort())
    ) {
      return true;
    }
    if (JSON.stringify(saved.shifts) !== JSON.stringify(draft.shifts)) return true;
    return false;
  };

  const updateDraft = (
    grade: string,
    updater: (prev: DraftScheduleState) => DraftScheduleState
  ) => {
    setDrafts((prev) => {
      const current = prev[grade];
      if (!current) return prev;
      return {
        ...prev,
        [grade]: updater(current),
      };
    });
  };

  const handleToggleDayOffImmediate = async (
    grade: string,
    nextDayOff: boolean
  ) => {
    if (readOnly) return;
    setSavingGrade(grade);
    setFeedback(null);
    const draft = drafts[grade];
    try {
      const res = await api.updateGradeSchedule(grade, {
        isDayOff: nextDayOff,
        dayOffReason: nextDayOff ? draft?.dayOffReason || '' : '',
        activeDays: draft?.activeDays,
        shifts: draft?.shifts,
      });
      if (res.success && res.data) {
        syncFromResponse(res.data);
        setFeedback({
          type: 'success',
          text: nextDayOff
            ? `Đã bật chế độ nghỉ học cho ${grade}. Thiết bị thuộc khối này sẽ không báo cảnh báo dùng trong giờ.`
            : `Đã mở lại lịch giám sát giờ học cho ${grade}.`,
        });
        onSchedulesChanged?.();
      } else {
        setFeedback({
          type: 'error',
          text: res.message || 'Không thể cập nhật trạng thái nghỉ học',
        });
      }
    } finally {
      setSavingGrade(null);
    }
  };

  const handleSaveGrade = async (grade: string) => {
    if (readOnly) return;
    const draft = drafts[grade];
    if (!draft) return;

    for (const sh of draft.shifts) {
      if (sh.enabled && sh.start >= sh.end) {
        setFeedback({
          type: 'error',
          text: `${grade}: Giờ bắt đầu (${sh.start}) phải sớm hơn giờ kết thúc (${sh.end}).`,
        });
        return;
      }
    }

    setSavingGrade(grade);
    setFeedback(null);
    try {
      const res = await api.updateGradeSchedule(grade, {
        isDayOff: draft.isDayOff,
        dayOffReason: draft.dayOffReason,
        activeDays: draft.activeDays,
        shifts: draft.shifts,
      });
      if (res.success && res.data) {
        syncFromResponse(res.data);
        setFeedback({
          type: 'success',
          text: `Đã lưu giờ học và lịch nghỉ cho ${grade}.`,
        });
        onSchedulesChanged?.();
      } else {
        setFeedback({
          type: 'error',
          text: res.message || `Không thể lưu lịch học cho ${grade}`,
        });
      }
    } finally {
      setSavingGrade(null);
    }
  };

  const handleApplyToAll = async (grade: string) => {
    if (readOnly) return;
    const draft = drafts[grade];
    if (!draft) return;

    for (const sh of draft.shifts) {
      if (sh.enabled && sh.start >= sh.end) {
        setFeedback({
          type: 'error',
          text: `Giờ bắt đầu (${sh.start}) phải sớm hơn giờ kết thúc (${sh.end}).`,
        });
        return;
      }
    }

    setIsGlobalBusy(true);
    setFeedback(null);
    try {
      const res = await api.applyScheduleToAllGrades({
        activeDays: draft.activeDays,
        shifts: draft.shifts,
        isDayOff: draft.isDayOff,
        dayOffReason: draft.dayOffReason,
      });
      if (res.success && res.data) {
        syncFromResponse(res.data);
        setFeedback({
          type: 'success',
          text: `Đã áp dụng khung giờ của ${grade} cho toàn bộ các khối.`,
        });
        onSchedulesChanged?.();
      } else {
        setFeedback({
          type: 'error',
          text: res.message || 'Không thể áp dụng khung giờ chung',
        });
      }
    } finally {
      setIsGlobalBusy(false);
    }
  };

  const handleToggleAllDayOff = async (isDayOff: boolean) => {
    if (readOnly) return;
    setIsGlobalBusy(true);
    setFeedback(null);
    try {
      const res = await api.toggleGradesDayOff({
        grades: 'ALL',
        isDayOff,
        dayOffReason: isDayOff ? 'Nghỉ học toàn trường' : '',
      });
      if (res.success && res.data) {
        syncFromResponse(res.data);
        setFeedback({
          type: 'success',
          text: isDayOff
            ? 'Đã bật nghỉ học cho tất cả các khối. Mọi cảnh báo dùng điện thoại trong giờ học đã được tạm tắt.'
            : 'Đã mở lại giám sát giờ học cho tất cả các khối.',
        });
        onSchedulesChanged?.();
      } else {
        setFeedback({
          type: 'error',
          text: res.message || 'Không thể thay đổi trạng thái toàn trường',
        });
      }
    } finally {
      setIsGlobalBusy(false);
    }
  };

  const handleResetDefaults = async () => {
    if (readOnly) return;
    setIsGlobalBusy(true);
    setFeedback(null);
    try {
      const res = await api.resetGradeSchedules();
      if (res.success && res.data) {
        syncFromResponse(res.data);
        setConfirmReset(false);
        setFeedback({
          type: 'success',
          text: 'Đã khôi phục khung giờ mặc định (07:00 - 11:30 và 13:00 - 17:00, Thứ 2 đến Thứ 7).',
        });
        onSchedulesChanged?.();
      } else {
        setFeedback({
          type: 'error',
          text: res.message || 'Không thể khôi phục mặc định',
        });
      }
    } finally {
      setIsGlobalBusy(false);
    }
  };

  const allOff = schedules.length > 0 && schedules.every((s) => s.isDayOff);
  const offCount = schedules.filter((s) => s.isDayOff).length;
  const activeInClassCount = schedules.filter((s) => s.isCurrentlyInClass).length;

  return (
    <div className="space-y-5">
      {/* Summary & Global Actions Bar */}
      <div className="p-5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            {!compactHeader && (
              <h2 className="font-semibold text-base text-[var(--text-primary)] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--accent-ink)]" strokeWidth={1.5} />
                <span>Cấu hình giờ học và ngày nghỉ theo khối</span>
              </h2>
            )}
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Tùy chỉnh ca học sáng/chiều, ngày học trong tuần hoặc bật chế độ nghỉ học cho từng khối để tránh báo nhầm lỗi dùng điện thoại trong giờ học.
            </p>
            <div className="pt-1 flex flex-wrap items-center gap-3 text-xs">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[var(--surface-muted)] border border-[var(--border)] text-[var(--text-primary)] font-mono tabular-nums">
                <Clock className="w-3.5 h-3.5 text-[var(--accent-ink)]" strokeWidth={1.5} />
                <span>
                  {DAY_NAMES_VN[dayOfWeekVN] || ''}, {serverDateVN} · {serverTimeVN} (UTC+7)
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[var(--accent-ink)] font-medium tabular-nums">
                {activeInClassCount}/{schedules.length} khối đang trong giờ học
              </span>
              {offCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[var(--warning-soft)] border border-[var(--warning-border)] text-[var(--warning)] font-medium tabular-nums">
                  {offCount} khối đang nghỉ học
                </span>
              )}
            </div>
          </div>

          {!readOnly && (
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => loadSchedules(false)}
                disabled={isLoading || isGlobalBusy}
                className="h-9 px-3 rounded-[var(--radius-control)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-medium text-[var(--text-primary)] inline-flex items-center gap-2 cursor-pointer transition-colors duration-[var(--duration-fast)]"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
                <span>Làm mới</span>
              </button>

              {allOff ? (
                <button
                  type="button"
                  onClick={() => handleToggleAllDayOff(false)}
                  disabled={isGlobalBusy}
                  className="h-9 px-3 rounded-[var(--radius-control)] bg-[var(--success-soft)] hover:opacity-90 border border-[var(--success-border)] text-xs font-medium text-[var(--success)] inline-flex items-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
                  <span>Mở lại toàn trường</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleToggleAllDayOff(true)}
                  disabled={isGlobalBusy}
                  className="h-9 px-3 rounded-[var(--radius-control)] bg-[var(--warning-soft)] hover:opacity-90 border border-[var(--warning-border)] text-xs font-medium text-[var(--warning)] inline-flex items-center gap-2 cursor-pointer"
                >
                  <ShieldOff className="w-4 h-4" strokeWidth={1.5} />
                  <span>Cho toàn trường nghỉ</span>
                </button>
              )}

              {confirmReset ? (
                <div className="inline-flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleResetDefaults}
                    disabled={isGlobalBusy}
                    className="h-9 px-3 rounded-[var(--radius-control)] bg-[var(--danger)] text-white text-xs font-medium cursor-pointer"
                  >
                    Xác nhận đặt lại
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmReset(false)}
                    className="h-9 px-3 rounded-[var(--radius-control)] bg-[var(--surface-muted)] border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmReset(true)}
                  disabled={isGlobalBusy}
                  className="h-9 px-3 rounded-[var(--radius-control)] bg-[var(--surface)] hover:bg-[var(--surface-muted)] border border-[var(--border-strong)] text-xs font-medium text-[var(--text-secondary)] inline-flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" strokeWidth={1.5} />
                  <span>Mặc định</span>
                </button>
              )}
            </div>
          )}
        </div>

        {feedback && (
          <div
            className={`p-3 rounded-[var(--radius-control)] text-xs font-medium flex items-center gap-2 border ${
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
      </div>

      {/* Grade Schedule Cards */}
      {isLoading ? (
        <div className="p-12 text-center rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] text-xs text-[var(--text-muted)]">
          Đang tải danh sách lịch học theo khối
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {schedules.map((item) => {
            const draft = drafts[item.grade] || {
              isDayOff: item.isDayOff,
              dayOffReason: item.dayOffReason || '',
              activeDays: item.activeDays,
              shifts: item.shifts,
            };
            const dirty = isDirty(item.grade);
            const isSaving = savingGrade === item.grade;

            return (
              <div
                key={item.grade}
                className={`p-5 rounded-[var(--radius-card)] bg-[var(--surface)] border shadow-[var(--shadow-card)] space-y-4 transition-colors duration-[var(--duration-fast)] ${
                  draft.isDayOff
                    ? 'border-[var(--warning-border)]'
                    : item.isCurrentlyInClass
                    ? 'border-[var(--accent-border)]'
                    : 'border-[var(--border)]'
                }`}
              >
                {/* Card Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border)]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-[var(--radius-control)] flex items-center justify-center border shrink-0 ${
                        draft.isDayOff
                          ? 'bg-[var(--warning-soft)] border-[var(--warning-border)] text-[var(--warning)]'
                          : item.isCurrentlyInClass
                          ? 'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--accent-ink)]'
                          : 'bg-[var(--surface-muted)] border-[var(--border)] text-[var(--text-secondary)]'
                      }`}
                    >
                      <GraduationCap className="w-4 h-4" strokeWidth={1.5} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm text-[var(--text-primary)]">
                          {item.grade}
                        </h3>
                        <span className="text-[11px] font-mono tabular-nums text-[var(--text-muted)]">
                          {item.deviceCount} thiết bị
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                        {item.statusReason}
                      </p>
                    </div>
                  </div>

                  {/* Live Status Badge */}
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-[11px] font-medium border shrink-0 ${
                      item.isDayOff
                        ? 'bg-[var(--warning-soft)] border-[var(--warning-border)] text-[var(--warning)]'
                        : item.isCurrentlyInClass
                        ? 'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--accent-ink)]'
                        : 'bg-[var(--surface-muted)] border-[var(--border)] text-[var(--text-muted)]'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        item.isDayOff
                          ? 'bg-[var(--warning)]'
                          : item.isCurrentlyInClass
                          ? 'bg-[var(--accent)]'
                          : 'bg-[var(--text-muted)]'
                      }`}
                    />
                    <span>
                      {item.isDayOff
                        ? 'Đang nghỉ học'
                        : item.isCurrentlyInClass
                        ? 'Đang trong giờ'
                        : 'Ngoài giờ học'}
                    </span>
                  </span>
                </div>

                {/* Day Off Quick Switch */}
                <div
                  className={`p-3 rounded-[var(--radius-control)] border space-y-2.5 ${
                    draft.isDayOff
                      ? 'bg-[var(--warning-soft)]/70 border-[var(--warning-border)]'
                      : 'bg-[var(--surface-muted)]/60 border-[var(--border)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[var(--text-primary)]">
                        Chế độ nghỉ học (Tắt cảnh báo giờ học)
                      </div>
                      <div className="text-[11px] text-[var(--text-secondary)]">
                        {draft.isDayOff
                          ? 'Học sinh khối này được nghỉ nên không báo lỗi dùng điện thoại trong giờ'
                          : 'Đang bật theo dõi vi phạm sử dụng điện thoại theo khung giờ bên dưới'}
                      </div>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={draft.isDayOff}
                      disabled={readOnly || isSaving}
                      onClick={() =>
                        handleToggleDayOffImmediate(item.grade, !draft.isDayOff)
                      }
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-[var(--duration-fast)] cursor-pointer disabled:opacity-60 ${
                        draft.isDayOff
                          ? 'bg-[var(--warning)] border-[var(--warning)]'
                          : 'bg-[var(--surface)] border-[var(--border-strong)]'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-[var(--duration-fast)] ${
                          draft.isDayOff ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  {draft.isDayOff && !readOnly && (
                    <input
                      type="text"
                      placeholder="Ghi chú lý do nghỉ (VD: Nghỉ lễ, Thi xong sớm, Hoạt động ngoại khóa)"
                      value={draft.dayOffReason}
                      onChange={(e) =>
                        updateDraft(item.grade, (prev) => ({
                          ...prev,
                          dayOffReason: e.target.value,
                        }))
                      }
                      className="w-full h-9 px-3 bg-[var(--surface)] border border-[var(--warning-border)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
                    />
                  )}
                </div>

                {/* Shifts (Morning & Afternoon) */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[var(--text-muted)]" strokeWidth={1.5} />
                    <span>Khung giờ học áp dụng cảnh báo</span>
                  </div>

                  <div className="space-y-2">
                    {draft.shifts.map((shift, idx) => (
                      <div
                        key={idx}
                        className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 p-2.5 rounded-[var(--radius-control)] bg-[var(--surface-muted)]/40 border border-[var(--border)]"
                      >
                        <label className="flex items-center gap-2 text-xs font-medium text-[var(--text-primary)] min-w-[110px] cursor-pointer">
                          <input
                            type="checkbox"
                            disabled={readOnly}
                            checked={shift.enabled}
                            onChange={(e) =>
                              updateDraft(item.grade, (prev) => ({
                                ...prev,
                                shifts: prev.shifts.map((s, sIdx) =>
                                  sIdx === idx ? { ...s, enabled: e.target.checked } : s
                                ),
                              }))
                            }
                            className="w-4 h-4 accent-[var(--accent)] rounded cursor-pointer"
                          />
                          <span>{shift.label || `Ca ${idx + 1}`}</span>
                        </label>

                        <div className="flex items-center gap-2 flex-1 sm:justify-end">
                          <input
                            type="time"
                            disabled={readOnly || !shift.enabled}
                            value={shift.start}
                            onChange={(e) =>
                              updateDraft(item.grade, (prev) => ({
                                ...prev,
                                shifts: prev.shifts.map((s, sIdx) =>
                                  sIdx === idx ? { ...s, start: e.target.value } : s
                                ),
                              }))
                            }
                            className="h-9 px-2.5 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs font-mono tabular-nums text-[var(--text-primary)] disabled:opacity-50"
                          />
                          <span className="text-xs text-[var(--text-muted)]">đến</span>
                          <input
                            type="time"
                            disabled={readOnly || !shift.enabled}
                            value={shift.end}
                            onChange={(e) =>
                              updateDraft(item.grade, (prev) => ({
                                ...prev,
                                shifts: prev.shifts.map((s, sIdx) =>
                                  sIdx === idx ? { ...s, end: e.target.value } : s
                                ),
                              }))
                            }
                            className="h-9 px-2.5 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs font-mono tabular-nums text-[var(--text-primary)] disabled:opacity-50"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Active Weekdays */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-[var(--text-secondary)] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" strokeWidth={1.5} />
                    <span>Ngày học trong tuần</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {WEEK_DAYS.map((day) => {
                      const active = draft.activeDays.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          disabled={readOnly}
                          onClick={() =>
                            updateDraft(item.grade, (prev) => {
                              const exists = prev.activeDays.includes(day.value);
                              const nextDays = exists
                                ? prev.activeDays.filter((d) => d !== day.value)
                                : [...prev.activeDays, day.value];
                              return { ...prev, activeDays: nextDays };
                            })
                          }
                          className={`h-8 rounded-[6px] text-xs font-medium border transition-colors duration-[var(--duration-fast)] cursor-pointer disabled:cursor-default ${
                            active
                              ? 'bg-[var(--accent-soft)] border-[var(--accent-border)] text-[var(--accent-ink)]'
                              : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-muted)]'
                          }`}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-[var(--border)] flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[11px] text-[var(--text-muted)] truncate">
                    {item.updatedBy ? `Cập nhật bởi ${item.updatedBy}` : 'Cấu hình mặc định'}
                  </div>

                  {!readOnly && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApplyToAll(item.grade)}
                        disabled={isGlobalBusy || isSaving}
                        className="h-8 px-2.5 rounded-[var(--radius-control)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)] inline-flex items-center gap-1.5 cursor-pointer"
                        title="Áp dụng khung giờ và ngày học này cho toàn bộ các khối"
                      >
                        <Copy className="w-3.5 h-3.5" strokeWidth={1.5} />
                        <span>Áp dụng tất cả</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveGrade(item.grade)}
                        disabled={isSaving || isGlobalBusy || !dirty}
                        className={`h-8 px-3 rounded-[var(--radius-control)] text-xs font-medium inline-flex items-center gap-1.5 transition-colors duration-[var(--duration-fast)] cursor-pointer ${
                          dirty
                            ? 'bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)]'
                            : 'bg-[var(--surface-muted)] text-[var(--text-muted)] border border-[var(--border)] cursor-not-allowed'
                        }`}
                      >
                        <Save className="w-3.5 h-3.5" strokeWidth={1.5} />
                        <span>{isSaving ? 'Đang lưu' : 'Lưu khối này'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
