import React, { useState } from 'react';
import { Device } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { Smartphone, Send, X, Check, RefreshCw } from 'lucide-react';

interface MobileSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Device[];
  onDataSent: () => void;
  defaultDeviceId?: string;
}

const PRESET_LOCATIONS = [
  { name: 'THPT Chuyên Lê Hồng Phong (Q.5)', lat: 10.7638, lng: 106.6822 },
  { name: 'THCS Nguyễn Du (Q.1)', lat: 10.7732, lng: 106.6945 },
  { name: 'TP.HCM (Landmark 81)', lat: 10.7950, lng: 106.7219 },
  { name: 'Hà Nội (Hồ Hoàn Kiếm)', lat: 21.0285, lng: 105.8542 },
];

const PRESET_APP_WEB = [
  {
    label: 'Lướt TikTok',
    appName: 'TikTok',
    appCategory: 'SOCIAL',
    websiteUrl: 'https://www.tiktok.com/@trending',
    websiteTitle: 'TikTok - Video xu hướng',
    webCategory: 'SOCIAL',
  },
  {
    label: 'Chơi Liên Quân',
    appName: 'Liên Quân Mobile',
    appCategory: 'GAME',
    websiteUrl: 'https://lienquan.garena.vn',
    websiteTitle: 'Garena Liên Quân Mobile',
    webCategory: 'GAME',
  },
  {
    label: 'Học Classroom',
    appName: 'Google Classroom',
    appCategory: 'EDUCATION',
    websiteUrl: 'https://hocmai.vn/khoa-hoc',
    websiteTitle: 'Học Mãi - Khóa học trực tuyến',
    webCategory: 'EDUCATION',
  },
  {
    label: 'Xem YouTube',
    appName: 'YouTube',
    appCategory: 'ENTERTAINMENT',
    websiteUrl: 'https://www.youtube.com/watch?v=study',
    websiteTitle: 'YouTube Video',
    webCategory: 'ENTERTAINMENT',
  },
];

export const MobileSimulatorModal: React.FC<MobileSimulatorModalProps> = ({
  isOpen,
  onClose,
  devices,
  onDataSent,
  defaultDeviceId,
}) => {
  if (!isOpen) return null;

  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(
    defaultDeviceId || (devices.length > 0 ? devices[0].id : '')
  );
  const [lat, setLat] = useState<number>(10.7638);
  const [lng, setLng] = useState<number>(106.6822);
  const [accuracy] = useState<number>(4.5);
  const [battery, setBattery] = useState<number>(82);
  const [charging] = useState<boolean>(false);
  const [networkType, setNetworkType] = useState<string>('WIFI');
  const [status, setStatus] = useState<string>('ONLINE');

  const [appName, setAppName] = useState<string>('TikTok');
  const [appCategory, setAppCategory] = useState<string>('SOCIAL');
  const [websiteUrl, setWebsiteUrl] = useState<string>('https://www.tiktok.com/@study');
  const [websiteTitle, setWebsiteTitle] = useState<string>('TikTok - Xu hướng hôm nay');
  const [durationMinutes, setDurationMinutes] = useState<number>(15);

  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendSuccess, setSendSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const applyPreset = (preset: (typeof PRESET_LOCATIONS)[0]) => {
    const jitterLat = (Math.random() - 0.5) * 0.0015;
    const jitterLng = (Math.random() - 0.5) * 0.0015;
    setLat(Number((preset.lat + jitterLat).toFixed(5)));
    setLng(Number((preset.lng + jitterLng).toFixed(5)));
  };

  const applyAppWebPreset = (p: (typeof PRESET_APP_WEB)[0]) => {
    setAppName(p.appName);
    setAppCategory(p.appCategory);
    setWebsiteUrl(p.websiteUrl);
    setWebsiteTitle(p.websiteTitle);
  };

  const handleSendTelemetry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeviceId) {
      setErrorMsg('Vui lòng chọn thiết bị học sinh');
      return;
    }

    setIsSending(true);
    setErrorMsg(null);
    setSendSuccess(false);

    try {
      const [locRes, statRes, usageRes] = await Promise.all([
        api.sendLocation(selectedDeviceId, {
          latitude: Number(lat),
          longitude: Number(lng),
          accuracy: Number(accuracy),
          timestamp: new Date().toISOString(),
        }),
        api.sendHeartbeat(selectedDeviceId, {
          batteryLevel: Number(battery),
          charging,
          networkType,
          status,
          locationPermission: true,
          locationSharing: true,
        }),
        api.recordDeviceUsage(selectedDeviceId, {
          appName: appName.trim(),
          appCategory,
          durationMinutes: Number(durationMinutes) || 10,
          websiteUrl: websiteUrl.trim(),
          websiteTitle: websiteTitle.trim(),
          webCategory: appCategory,
        }),
      ]);

      if (!locRes.success || !statRes.success || !usageRes.success) {
        throw new Error('Không thể đồng bộ đầy đủ dữ liệu telemetry');
      }

      setSendSuccess(true);
      onDataSent();
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Lỗi gửi dữ liệu');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--surface-overlay)]">
      <div className="relative w-full max-w-lg bg-[var(--surface)] rounded-[var(--radius-panel)] shadow-[var(--shadow-elevated)] border border-[var(--border-strong)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[var(--radius-control)] bg-[var(--accent-soft)] text-[var(--accent-ink)] flex items-center justify-center">
              <Smartphone className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-semibold text-[var(--text-primary)] text-base">
                Mô phỏng điện thoại học sinh
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Gửi dữ liệu ứng dụng, trang web, pin và tọa độ GPS kiểm thử
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-[6px] cursor-pointer"
          >
            <X className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSendTelemetry} className="p-6 space-y-4 max-h-[82vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 text-xs bg-[var(--danger-soft)] border border-[var(--danger-border)] text-[var(--danger)] rounded-[var(--radius-control)]">
              {errorMsg}
            </div>
          )}

          {sendSuccess && (
            <div className="p-3 text-xs bg-[var(--success-soft)] border border-[var(--success-border)] text-[var(--success)] rounded-[var(--radius-control)] flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              <span>Đã cập nhật ứng dụng, website, pin và vị trí GPS</span>
            </div>
          )}

          {/* Device Selector */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Chọn điện thoại học sinh cần mô phỏng
            </label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs font-medium text-[var(--text-primary)]"
              required
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.studentName || d.name} · {d.schoolName} ({d.name})
                </option>
              ))}
            </select>
          </div>

          {/* App & Web Usage Simulation */}
          <div className="p-4 rounded-[var(--radius-control)] bg-[var(--surface-muted)]/60 border border-[var(--border)] space-y-3">
            <span className="text-xs font-semibold text-[var(--text-primary)] block">
              1. Giả lập mở ứng dụng và truy cập website
            </span>

            <div className="flex flex-wrap gap-2">
              {PRESET_APP_WEB.map((p, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => applyAppWebPreset(p)}
                  className="h-8 px-3 text-[11px] font-medium rounded-[var(--radius-control)] border border-[var(--border-strong)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] cursor-pointer"
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
                  Ứng dụng đang mở
                </label>
                <input
                  type="text"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  className="w-full h-9 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
                  Thời gian dùng thêm (phút)
                </label>
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full h-9 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs font-mono text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-[var(--text-secondary)] mb-1">
                Trang web đang truy cập
              </label>
              <input
                type="text"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                className="w-full h-9 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs font-mono text-[var(--text-primary)]"
              />
            </div>
          </div>

          {/* Preset location chips */}
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              2. Vị trí GPS nhanh (Trường học / Địa điểm)
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_LOCATIONS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => applyPreset(preset)}
                  className="h-8 px-3 text-[11px] rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface-muted)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] cursor-pointer"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Latitude & Longitude inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Vĩ độ (Latitude)
              </label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value))}
                className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs font-mono tabular-nums text-[var(--text-primary)]"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Kinh độ (Longitude)
              </label>
              <input
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value))}
                className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs font-mono tabular-nums text-[var(--text-primary)]"
                required
              />
            </div>
          </div>

          {/* Battery & Network */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Mức pin ({battery}%)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={battery}
                onChange={(e) => setBattery(Number(e.target.value))}
                className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs font-mono tabular-nums text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Loại mạng
              </label>
              <select
                value={networkType}
                onChange={(e) => setNetworkType(e.target.value)}
                className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)]"
              >
                <option value="WIFI">WiFi</option>
                <option value="5G">5G</option>
                <option value="4G">4G LTE</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                Trạng thái
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)]"
              >
                <option value="ONLINE">ONLINE</option>
                <option value="IDLE">IDLE</option>
                <option value="OFFLINE">OFFLINE</option>
              </select>
            </div>
          </div>

          <div className="pt-1">
            <button
              type="submit"
              disabled={isSending || devices.length === 0}
              className="w-full h-10 px-4 bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] disabled:opacity-50 text-[var(--btn-primary-text)] rounded-[var(--radius-control)] font-medium text-xs transition-[background-color,opacity] duration-[var(--duration-fast)] ease-[var(--ease-standard)] flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                  <span>Đang đồng bộ dữ liệu</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" strokeWidth={1.5} />
                  <span>Cập nhật ứng dụng, web, pin và GPS</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
