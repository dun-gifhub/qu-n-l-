import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { Device, DeviceLocation, ActivityEvent } from '../types/index.ts';
import { DeviceMap } from '../components/Map/DeviceMap.tsx';
import {
  Smartphone,
  Battery,
  Zap,
  Wifi,
  MapPin,
  Calendar,
  Clock,
  ArrowLeft,
  Trash2,
  Edit2,
  RefreshCw,
  Share2,
  Shield,
  Layers,
  Code2,
  Play,
  Check,
  Copy,
} from 'lucide-react';

interface DeviceDetailPageProps {
  deviceId: string;
  navigate: (path: string) => void;
  onOpenSimulator: (deviceId: string) => void;
  initialTab?: string;
}

export const DeviceDetailPage: React.FC<DeviceDetailPageProps> = ({
  deviceId,
  navigate,
  onOpenSimulator,
  initialTab = 'status',
}) => {
  const [device, setDevice] = useState<Device | null>(null);
  const [history, setHistory] = useState<DeviceLocation[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [activeTab, setActiveTab] = useState<'status' | 'location' | 'history' | 'activity' | 'api'>(
    initialTab as any || 'status'
  );
  const [historyRange, setHistoryRange] = useState<'today' | '7days' | '30days'>('today');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [copiedCurl, setCopiedCurl] = useState(false);

  const loadDeviceData = async () => {
    setIsLoading(true);
    try {
      const [devRes, histRes, actRes] = await Promise.all([
        api.getDeviceById(deviceId),
        api.getLocationHistory(deviceId, historyRange),
        api.getDeviceActivity(deviceId),
      ]);

      if (devRes.success && devRes.data) {
        setDevice(devRes.data);
        setEditName(devRes.data.name);
      }
      if (histRes.success && histRes.data) {
        setHistory(histRes.data);
      }
      if (actRes.success && actRes.data) {
        setActivities(actRes.data);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDeviceData();
  }, [deviceId, historyRange]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    const res = await api.updateDevice(deviceId, { name: editName.trim() });
    if (res.success && res.data) {
      setDevice(res.data);
      setIsEditing(false);
    }
  };

  const handleDeleteDevice = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thiết bị này khỏi tài khoản?')) {
      return;
    }
    setIsDeleting(true);
    const res = await api.deleteDevice(deviceId);
    setIsDeleting(false);
    if (res.success) {
      navigate('/devices');
    }
  };

  if (isLoading && !device) {
    return (
      <div className="py-24 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
        <span>Đang tải thông tin thiết bị...</span>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
          Không tìm thấy thiết bị này
        </h2>
        <button
          onClick={() => navigate('/devices')}
          className="py-2 px-4 bg-indigo-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const isOnline = device.status === 'ONLINE';
  const isIdle = device.status === 'IDLE';

  const curlLocationExample = `curl -X POST https://your-server.onrender.com/api/devices/${device.id}/location \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \\
  -d '{
    "latitude": 10.7769,
    "longitude": 106.7009,
    "accuracy": 5.0,
    "timestamp": "${new Date().toISOString()}"
  }'`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/devices')}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Quay lại danh sách thiết bị"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {device.platform === 'iOS' ? '🍎' : device.platform === 'Android' ? '🤖' : '📱'}
              </span>
              {isEditing ? (
                <form onSubmit={handleUpdateName} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
                  >
                    Lưu
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-2 py-1 text-xs text-slate-400 hover:text-slate-200"
                  >
                    Hủy
                  </button>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {device.name}
                  </h1>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Đổi tên thiết bị"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              UUID: {device.deviceUuid}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenSimulator(device.id)}
            className="py-2 px-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 font-semibold text-xs flex items-center gap-1.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Mô phỏng Telemetry</span>
          </button>
          <button
            onClick={loadDeviceData}
            disabled={isLoading}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleDeleteDevice}
            disabled={isDeleting}
            className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 transition cursor-pointer"
            title="Xóa thiết bị"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2">
        {[
          { key: 'status', label: 'Trạng thái & Thông tin' },
          { key: 'location', label: 'Vị trí hiện tại' },
          { key: 'history', label: 'Lịch sử vị trí' },
          { key: 'activity', label: 'Nhật ký hoạt động' },
          { key: 'api', label: 'API Mobile App' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`py-3 px-4 text-xs md:text-sm font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === tab.key
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Status & Specs */}
      {activeTab === 'status' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box 1: Hardware & System Info */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Thông Tin Phần Cứng</span>
              </h3>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Tên thiết bị</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{device.name}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Nền tảng (Platform)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{device.platform}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Phiên bản OS</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{device.osVersion || 'Chưa cung cấp'}</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Phiên bản App</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{device.appVersion || '1.0.0'}</span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-400">Device ID / UUID</span>
                  <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 font-bold">{device.deviceUuid}</span>
                </div>
              </div>
            </div>

            {/* Box 2: Live Telemetry Status */}
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Trạng Thái Hoạt Động</span>
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                    isOnline
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                      : isIdle
                      ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                  {device.status || 'OFFLINE'}
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-400">Mức Pin</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Battery className="w-4 h-4 text-emerald-500" />
                    {device.batteryLevel ?? 100}%
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Đang sạc</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {device.charging ? '⚡ Có (Đang nạp năng lượng)' : 'Không'}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Kiểu kết nối mạng</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <Wifi className="w-3.5 h-3.5 text-indigo-500" />
                    {device.networkType || 'WIFI'}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Quyền truy cập vị trí</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {device.locationPermission ? '✓ Đã cấp quyền' : 'Chưa cấp'}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Chia sẻ vị trí</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {device.locationSharing ? 'Đang bật' : 'Đang tắt'}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Last Seen</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {device.lastSeen ? new Date(device.lastSeen).toLocaleString('vi-VN') : 'Chưa có'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Map Preview */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-500" />
              <span>Vị Trí Mới Nhất</span>
            </h3>
            <DeviceMap selectedDevice={device} height="320px" />
          </div>
        </div>
      )}

      {/* Tab 2: Location Map */}
      {activeTab === 'location' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-slate-400 block">Vĩ độ (Latitude)</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {typeof device.latitude === 'number' ? device.latitude.toFixed(5) : 'Chưa có'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Kinh độ (Longitude)</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {typeof device.longitude === 'number' ? device.longitude.toFixed(5) : 'Chưa có'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Độ chính xác (Accuracy)</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {device.accuracy ? `±${device.accuracy}m` : 'Tiêu chuẩn'}
                </span>
              </div>
            </div>

            <button
              onClick={() => onOpenSimulator(device.id)}
              className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition cursor-pointer"
            >
              + Gửi tọa độ mới
            </button>
          </div>

          <DeviceMap selectedDevice={device} height="480px" />
        </div>
      )}

      {/* Tab 3: Location History */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">Lọc khoảng thời gian:</span>
              {(['today', '7days', '30days'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setHistoryRange(r)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    historyRange === r
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  {r === 'today' && 'Hôm nay'}
                  {r === '7days' && '7 ngày qua'}
                  {r === '30days' && '30 ngày qua'}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-400">
              Tổng số điểm ghi nhận: <strong>{history.length}</strong>
            </span>
          </div>

          {/* History Map with trajectory Polyline */}
          <DeviceMap historyLocations={history} height="360px" />

          {/* History Data Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Bảng Lịch Sử Tọa Độ GPS
              </h3>
            </div>

            {history.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Chưa có dữ liệu lịch sử vị trí trong khoảng thời gian này.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-6">Thời gian</th>
                      <th className="py-3 px-6">Vĩ độ (Latitude)</th>
                      <th className="py-3 px-6">Kinh độ (Longitude)</th>
                      <th className="py-3 px-6">Độ chính xác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                    {history.map((h, i) => (
                      <tr key={h.id || i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-6 font-sans text-slate-700 dark:text-slate-300">
                          {new Date(h.timestamp).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3 px-6 text-slate-900 dark:text-slate-100">
                          {h.latitude.toFixed(6)}
                        </td>
                        <td className="py-3 px-6 text-slate-900 dark:text-slate-100">
                          {h.longitude.toFixed(6)}
                        </td>
                        <td className="py-3 px-6 text-slate-500">
                          {h.accuracy ? `±${h.accuracy} m` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Activity Log */}
      {activeTab === 'activity' && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Nhật Ký Hoạt Động Của Thiết Bị</span>
          </h3>

          {activities.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Chưa có sự kiện hoạt động nào cho thiết bị này.
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start gap-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 text-xs"
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs shrink-0">
                    ⚡
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {act.type}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {new Date(act.timestamp).toLocaleString('vi-VN')}
                      </span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">
                      {act.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Mobile App REST API Documentation */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>REST API Cho Mobile Developer</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Mã cURL mẫu để tích hợp ứng dụng iOS (Swift) hoặc Android (Kotlin) gửi tọa độ lên máy chủ
                </p>
              </div>

              <button
                onClick={() => copyToClipboard(curlLocationExample)}
                className="py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCurl ? 'Đã sao chép' : 'Sao chép cURL'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-slate-950 text-slate-200 text-xs overflow-x-auto font-mono leading-relaxed border border-slate-800">
              {curlLocationExample}
            </pre>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-2">
                <span className="font-bold text-slate-900 dark:text-white block">
                  1. Gửi Heartbeat & Pin
                </span>
                <p className="text-slate-500 dark:text-slate-400">
                  <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">POST /api/devices/{device.id}/heartbeat</code>
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Payload: <code className="font-mono text-indigo-500">{`{ "batteryLevel": 85, "charging": false, "networkType": "WIFI", "status": "ONLINE" }`}</code>
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-2">
                <span className="font-bold text-slate-900 dark:text-white block">
                  2. Xác thực Token (Bearer)
                </span>
                <p className="text-slate-500 dark:text-slate-400">
                  Header: <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded font-mono">Authorization: Bearer &lt;JWT&gt;</code>
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Hoặc sử dụng Device UUID độc nhất để đăng ký thiết bị mới.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
