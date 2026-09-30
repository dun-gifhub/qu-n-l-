import React, { useState } from 'react';
import { Device } from '../../types/index.ts';
import { api } from '../../services/api.ts';
import { Smartphone, Send, MapPin, Battery, Wifi, Zap, X, Check, RefreshCw } from 'lucide-react';

interface MobileSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  devices: Device[];
  onDataSent: () => void;
  defaultDeviceId?: string;
}

const PRESET_LOCATIONS = [
  { name: 'TP. Hồ Chí Minh (Quận 1)', lat: 10.7769, lng: 106.7009 },
  { name: 'TP. Hồ Chí Minh (Landmark 81)', lat: 10.7950, lng: 106.7219 },
  { name: 'Hà Nội (Hồ Hoàn Kiếm)', lat: 21.0285, lng: 105.8542 },
  { name: 'Hà Nội (Cầu Giấy)', lat: 21.0360, lng: 105.7900 },
  { name: 'Đà Nẵng (Cầu Rồng)', lat: 16.0610, lng: 108.2235 },
  { name: 'Cần Thơ (Bến Ninh Kiều)', lat: 10.0337, lng: 105.7876 },
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
  const [lat, setLat] = useState<number>(10.7769);
  const [lng, setLng] = useState<number>(106.7009);
  const [accuracy, setAccuracy] = useState<number>(5.0);
  const [battery, setBattery] = useState<number>(85);
  const [charging, setCharging] = useState<boolean>(false);
  const [networkType, setNetworkType] = useState<string>('WIFI');
  const [status, setStatus] = useState<string>('ONLINE');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendSuccess, setSendSuccess] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const applyPreset = (preset: typeof PRESET_LOCATIONS[0]) => {
    // Add small jitter for realistic movement
    const jitterLat = (Math.random() - 0.5) * 0.002;
    const jitterLng = (Math.random() - 0.5) * 0.002;
    setLat(Number((preset.lat + jitterLat).toFixed(5)));
    setLng(Number((preset.lng + jitterLng).toFixed(5)));
  };

  const handleSendTelemetry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeviceId) {
      setErrorMsg('Vui lòng chọn thiết bị');
      return;
    }

    setIsSending(true);
    setErrorMsg(null);
    setSendSuccess(false);

    try {
      // 1. Send GPS Location
      const locRes = await api.sendLocation(selectedDeviceId, {
        latitude: Number(lat),
        longitude: Number(lng),
        accuracy: Number(accuracy),
        timestamp: new Date().toISOString(),
      });

      if (!locRes.success) {
        throw new Error(locRes.message || 'Không thể gửi tọa độ GPS');
      }

      // 2. Send Heartbeat Telemetry
      const statRes = await api.sendHeartbeat(selectedDeviceId, {
        batteryLevel: Number(battery),
        charging,
        networkType,
        status,
        locationPermission: true,
        locationSharing: true,
      });

      if (!statRes.success) {
        throw new Error(statRes.message || 'Không thể gửi trạng thái heartbeat');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                Mô Phỏng Dữ Liệu Mobile App
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gửi telemetry GPS và Pin qua REST API như ứng dụng thật
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSendTelemetry} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 text-xs bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl">
              {errorMsg}
            </div>
          )}

          {sendSuccess && (
            <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>Dữ liệu đã được ghi nhận thành công! Bản đồ và trạng thái vừa được cập nhật.</span>
            </div>
          )}

          {/* Device Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Chọn thiết bị mô phỏng
            </label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.platform} - {d.deviceUuid.substring(0, 8)}...)
                </option>
              ))}
            </select>
          </div>

          {/* Preset location chips */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tọa độ nhanh (Preset)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_LOCATIONS.map((preset, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => applyPreset(preset)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 transition"
                >
                  📍 {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Latitude & Longitude inputs */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Vĩ độ (Latitude)
              </label>
              <input
                type="number"
                step="0.0001"
                value={lat}
                onChange={(e) => setLat(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Kinh độ (Longitude)
              </label>
              <input
                type="number"
                step="0.0001"
                value={lng}
                onChange={(e) => setLng(parseFloat(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100"
                required
              />
            </div>
          </div>

          {/* Battery & Charging */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Battery className="w-4 h-4 text-emerald-500" /> Mức Pin ({battery}%)
              </span>
              <label className="flex items-center gap-1.5 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-400">
                <input
                  type="checkbox"
                  checked={charging}
                  onChange={(e) => setCharging(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <Zap className="w-3.5 h-3.5 text-amber-500" /> Đang sạc
              </label>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={battery}
              onChange={(e) => setBattery(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Network & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Loại mạng
              </label>
              <select
                value={networkType}
                onChange={(e) => setNetworkType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="WIFI">WiFi</option>
                <option value="5G">5G</option>
                <option value="4G">4G LTE</option>
                <option value="ETHERNET">Ethernet</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Trạng thái thiết bị
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
              >
                <option value="ONLINE">ONLINE (Hoạt động)</option>
                <option value="IDLE">IDLE (Chờ)</option>
                <option value="OFFLINE">OFFLINE (Tắt nguồn)</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSending || devices.length === 0}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Đang gửi REST API...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Gửi Telemetry Tới Server</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
