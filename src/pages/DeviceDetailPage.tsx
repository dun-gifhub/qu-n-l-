import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import {
  Device,
  DeviceLocation,
  ActivityEvent,
  AppUsageItem,
  WebVisitItem,
  PhoneContact,
} from '../types/index.ts';
import { DeviceMap } from '../components/Map/DeviceMap.tsx';
import {
  Smartphone,
  Battery,
  Zap,
  Wifi,
  MapPin,
  ArrowLeft,
  Trash2,
  Edit2,
  RefreshCw,
  Layers,
  Code2,
  Play,
  Check,
  Copy,
  Globe,
  Lock,
  Unlock,
  Phone,
  PhoneCall,
  PhoneOff,
  Plus,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  UserPlus,
  Navigation,
  ExternalLink,
} from 'lucide-react';

interface DeviceDetailPageProps {
  deviceId: string;
  navigate: (path: string) => void;
  onOpenSimulator?: (deviceId: string) => void;
  initialTab?: string;
}

export const DeviceDetailPage: React.FC<DeviceDetailPageProps> = ({
  deviceId,
  navigate,
  onOpenSimulator,
  initialTab = 'history',
}) => {
  const [device, setDevice] = useState<Device | null>(null);
  const [history, setHistory] = useState<DeviceLocation[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [appUsages, setAppUsages] = useState<AppUsageItem[]>([]);
  const [webHistory, setWebHistory] = useState<WebVisitItem[]>([]);
  const [contacts, setContacts] = useState<PhoneContact[]>([]);
  const [isContactsLoading, setIsContactsLoading] = useState(false);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRel, setNewContactRel] = useState('Phụ huynh');
  const [newContactAlert, setNewContactAlert] = useState(true);
  const [contactFeedback, setContactFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isDeletingAllContacts, setIsDeletingAllContacts] = useState(false);
  const [confirmClearContactsOpen, setConfirmClearContactsOpen] = useState(false);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<
    'history' | 'location' | 'usage' | 'status' | 'contacts' | 'activity' | 'api'
  >((initialTab as any) || 'history');
  const [historyRange, setHistoryRange] = useState<'all' | 'today' | '7days' | '30days'>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editStudentName, setEditStudentName] = useState('');
  const [editSchoolName, setEditSchoolName] = useState('');
  const [editClassName, setEditClassName] = useState('');
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedGps, setCopiedGps] = useState(false);

  const copyGpsHistory = () => {
    if (history.length === 0) return;
    const text = history
      .map(
        (h, i) =>
          `#${i + 1} | ${new Date(h.timestamp).toLocaleString('vi-VN')} | GPS: ${h.latitude},${h.longitude} | Sai số: ±${Math.round(h.accuracy || 10)}m`
      )
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedGps(true);
    setTimeout(() => setCopiedGps(false), 2500);
  };

  const loadDeviceData = async () => {
    setIsLoading(true);
    try {
      const [devRes, histRes, actRes, usageRes] = await Promise.all([
        api.getDeviceById(deviceId),
        api.getLocationHistory(deviceId, historyRange),
        api.getDeviceActivity(deviceId),
        api.getDeviceUsage(deviceId),
      ]);

      if (devRes.success && devRes.data) {
        setDevice(devRes.data);
        setEditName(devRes.data.name);
        setEditStudentName(devRes.data.studentName || '');
        setEditSchoolName(devRes.data.schoolName || '');
        setEditClassName(devRes.data.className || '');
      }
      if (histRes.success && histRes.data) {
        setHistory(histRes.data);
      }
      if (actRes.success && actRes.data) {
        setActivities(actRes.data);
      }
      if (usageRes.success && usageRes.data) {
        setAppUsages(usageRes.data.appUsages);
        setWebHistory(usageRes.data.webHistory);
      }
      try {
        const cRes = await api.getDeviceContacts(deviceId);
        if (cRes.success && cRes.data) {
          setContacts(cRes.data);
        }
      } catch {}
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    setIsAddingContact(true);
    setContactFeedback(null);
    const res = await api.addDeviceContact(deviceId, {
      name: newContactName.trim(),
      phone: newContactPhone.trim(),
      relationship: newContactRel.trim(),
      isEmergencyAlert: newContactAlert,
    });
    setIsAddingContact(false);
    if (res.success && res.data) {
      setContacts(res.data);
      setNewContactName('');
      setNewContactPhone('');
      setContactFeedback({ type: 'success', text: 'Thêm số điện thoại mới thành công!' });
      setTimeout(() => setContactFeedback(null), 3000);
    } else {
      setContactFeedback({ type: 'error', text: res.message || 'Lỗi thêm số điện thoại' });
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    setDeletingContactId(contactId);
    const res = await api.deleteDeviceContact(deviceId, contactId);
    setDeletingContactId(null);
    if (res.success && res.data) {
      setContacts(res.data);
    }
  };

  const handleClearAllContacts = async () => {
    setIsDeletingAllContacts(true);
    const res = await api.clearAllDeviceContacts(deviceId);
    setIsDeletingAllContacts(false);
    setConfirmClearContactsOpen(false);
    if (res.success) {
      setContacts([]);
    }
  };

  useEffect(() => {
    loadDeviceData();
  }, [deviceId, historyRange]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab as any);
    }
  }, [initialTab]);

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    const res = await api.updateDevice(deviceId, {
      name: editName.trim(),
      studentName: editStudentName.trim(),
      schoolName: editSchoolName.trim(),
      className: editClassName.trim(),
    });
    if (res.success && res.data) {
      setDevice(res.data);
      setIsEditing(false);
    }
  };

  const handleToggleBlock = async (targetType: 'APP' | 'WEB', targetName: string) => {
    const res = await api.toggleBlockItem(deviceId, { targetType, targetName });
    if (res.success && res.data) {
      setDevice(res.data.device);
      setAppUsages(res.data.appUsages);
      setWebHistory(res.data.webHistory);
    }
  };

  const handleDeleteDevice = async () => {
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
        <span>Đang tải thông tin thiết bị học sinh...</span>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">
          Không tìm thấy thiết bị này hoặc bạn không có quyền truy cập
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

  const curlLocationExample = `curl -X POST https://your-server.onrender.com/api/devices/${device.id}/usage \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \\
  -d '{
    "appName": "TikTok",
    "appCategory": "SOCIAL",
    "durationMinutes": 15,
    "websiteUrl": "https://www.tiktok.com"
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
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition cursor-pointer"
            title="Quay lại danh sách thiết bị"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {device.studentName || device.name}
              </h1>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                title="Chỉnh sửa thông tin học sinh & trường"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Trường: <strong>{device.schoolName}</strong> · Lớp: <strong>{device.className || 'Chưa rõ'}</strong> · Thiết bị: {device.name} ({device.platform})
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/report')}
            className="py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 font-semibold text-xs flex items-center gap-1.5 hover:bg-emerald-100 transition cursor-pointer whitespace-nowrap"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mở Báo Cáo Trên ĐT</span>
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

      {/* Inline Edit Form */}
      {isEditing && (
        <form
          onSubmit={handleUpdateInfo}
          className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
        >
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Họ tên học sinh
            </label>
            <input
              type="text"
              value={editStudentName}
              onChange={(e) => setEditStudentName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Trường học (Đồng bộ GVCN)
            </label>
            <input
              type="text"
              value={editSchoolName}
              onChange={(e) => setEditSchoolName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Lớp / Tên máy
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={editClassName}
                onChange={(e) => setEditClassName(e.target.value)}
                placeholder="Lớp"
                className="w-20 px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Tên máy"
                className="flex-1 px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2 px-3 bg-indigo-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Lưu
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="py-2 px-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 overflow-x-auto gap-2">
        {[
          { key: 'history', label: `🗺️ Lịch sử di chuyển (${history.length} điểm)` },
          { key: 'location', label: '📍 Vị trí hiện tại' },
          { key: 'usage', label: `📱 Sử dụng App & Web (${appUsages.length + webHistory.length})` },
          { key: 'status', label: '⚙️ Trạng thái & Học sinh' },
          { key: 'contacts', label: `📞 Danh bạ & SĐT (${contacts.length})` },
          { key: 'activity', label: `📋 Nhật ký hoạt động (${activities.length})` },
          { key: 'api', label: '🔌 API Mobile App' },
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

      {/* Tab: Lịch Sử Di Chuyển (Movement History & GPS Route Tracking) */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Reassurance Banner: CHỈ THÊM KHÔNG BỚT */}
          <div className="p-3.5 px-4 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
                <Navigation className="w-4 h-4" />
              </div>
              <div>
                <div className="font-extrabold text-indigo-950 dark:text-indigo-200">
                  Cơ chế lưu trữ: CHỈ THÊM KHÔNG BỚT · ĐỒNG BỘ NEON POSTGRESQL
                </div>
                <div className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-0.5">
                  Tất cả các điểm tọa độ di chuyển được bảo toàn vĩnh viễn, không bao giờ bị cắt giảm hay xoá bớt.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={copyGpsHistory}
                disabled={history.length === 0}
                className="py-1.5 px-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 text-indigo-700 dark:text-indigo-300 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                title="Sao chép toàn bộ danh sách tọa độ GPS"
              >
                {copiedGps ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedGps ? 'Đã chép GPS' : 'Chép tọa độ'}</span>
              </button>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                Khoảng thời gian:
              </span>
              {[
                { key: 'all', label: 'Toàn bộ (Chỉ thêm không bớt)' },
                { key: 'today', label: 'Hôm nay' },
                { key: '7days', label: '7 ngày qua' },
                { key: '30days', label: '30 ngày qua' },
              ].map((r) => (
                <button
                  key={r.key}
                  onClick={() => setHistoryRange(r.key as any)}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold transition cursor-pointer ${
                    historyRange === r.key
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <span className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 font-bold">
                📍 {history.length} tọa độ đã lưu trữ
              </span>
              <button
                onClick={loadDeviceData}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                title="Làm mới lịch sử"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Interactive Route Map */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="px-5 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-extrabold text-slate-900 dark:text-white">
                  Lộ Trình Di Chuyển Trên Nền Google Maps Vệ Tinh (Đường Nối Tuyến Đường)
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                Tự động nối lộ trình theo thời gian thực
              </span>
            </div>
            <DeviceMap historyLocations={history} height="460px" />
          </div>

          {/* Detailed Points Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Bảng Lịch Sử Tọa Độ GPS & Điểm Dừng
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Đồng bộ và lưu trữ kiên cố trên Neon PostgreSQL
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                {history.length} điểm ghi nhận
              </span>
            </div>

            {history.length === 0 ? (
              <div className="py-12 px-4 text-center text-xs text-slate-400 space-y-2">
                <p>Chưa có dữ liệu lịch sử di chuyển nào được ghi nhận trong khoảng thời gian này.</p>
                <p className="text-[11px] text-slate-500">Mở link báo cáo trên điện thoại để bắt đầu truyền tọa độ GPS định kỳ.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-5">STT</th>
                      <th className="py-3 px-5">Thời gian</th>
                      <th className="py-3 px-5">Vĩ độ (Latitude)</th>
                      <th className="py-3 px-5">Kinh độ (Longitude)</th>
                      <th className="py-3 px-5">Độ chính xác</th>
                      <th className="py-3 px-5">Trạng thái điểm</th>
                      <th className="py-3 px-5 text-right">Xem bản đồ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono tabular-nums">
                    {history.map((loc, idx) => (
                      <tr key={loc.id || idx} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3 px-5 text-slate-400">#{idx + 1}</td>
                        <td className="py-3 px-5 text-slate-800 dark:text-slate-200 font-sans">
                          {new Date(loc.timestamp).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3 px-5 font-bold text-slate-900 dark:text-white">
                          {loc.latitude.toFixed(6)}
                        </td>
                        <td className="py-3 px-5 font-bold text-slate-900 dark:text-white">
                          {loc.longitude.toFixed(6)}
                        </td>
                        <td className="py-3 px-5 text-slate-500">
                          {loc.accuracy ? `±${Math.round(loc.accuracy)} m` : '±10 m'}
                        </td>
                        <td className="py-3 px-5 font-sans">
                          {idx === 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                              Vị trí mới nhất
                            </span>
                          ) : idx === history.length - 1 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                              Điểm xuất phát
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              Điểm di chuyển
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-5 text-right font-sans">
                          <a
                            href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline inline-flex items-center gap-1"
                          >
                            <span>Google Maps</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
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

      {/* Tab: Vị Trí Trực Tuyến Hiện Tại */}
      {activeTab === 'location' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-6">
              <div>
                <span className="text-slate-400 block">Vĩ độ (Latitude)</span>
                <span className="font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">
                  {typeof device.latitude === 'number' ? device.latitude.toFixed(6) : 'Chưa có'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Kinh độ (Longitude)</span>
                <span className="font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">
                  {typeof device.longitude === 'number' ? device.longitude.toFixed(6) : 'Chưa có'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Độ chính xác (Accuracy)</span>
                <span className="font-mono tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                  {device.accuracy ? `±${device.accuracy}m` : 'Tiêu chuẩn'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {device.latitude && device.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${device.latitude},${device.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition cursor-pointer text-xs flex items-center gap-1"
                >
                  <span>Mở Google Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
              <button
                onClick={() => navigate('/report')}
                className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition cursor-pointer text-xs flex items-center gap-1"
              >
                <span>📱 Mở Báo Cáo Trên ĐT</span>
              </button>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs">
            <DeviceMap selectedDevice={device} height="480px" />
          </div>
        </div>
      )}

      {/* Tab: Danh bạ & SĐT Phụ Huynh / Khẩn Cấp */}
      {activeTab === 'contacts' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Phone className="w-4 h-4 text-indigo-500" />
                  <span>Danh Bạ & Số Điện Thoại Khẩn Cấp ({contacts.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Số điện thoại người thân để liên hệ ngay khi học sinh gặp sự cố hoặc cảnh báo giờ học
                </p>
              </div>

              {contacts.length > 0 && (
                <button
                  onClick={handleClearAllContacts}
                  disabled={isDeletingAllContacts}
                  className="py-1.5 px-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-semibold transition cursor-pointer self-start"
                >
                  Xoá toàn bộ danh bạ
                </button>
              )}
            </div>

            {/* Add Contact Form */}
            <form onSubmit={handleAddContact} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">
                + Thêm Số Điện Thoại Mới:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Tên người liên hệ (VD: Mẹ Lan)"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                  required
                />
                <input
                  type="text"
                  placeholder="Số điện thoại (VD: 0901234567)"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                  required
                />
                <select
                  value={newContactRel}
                  onChange={(e) => setNewContactRel(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100"
                >
                  <option value="Phụ huynh">Phụ huynh (Bố/Mẹ)</option>
                  <option value="Giáo viên">Giáo viên chủ nhiệm</option>
                  <option value="Người giám hộ">Người giám hộ</option>
                  <option value="Khẩn cấp">Số cứu nạn khẩn cấp</option>
                </select>
              </div>

              {contactFeedback && (
                <p className={`text-xs ${contactFeedback.type === 'success' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {contactFeedback.text}
                </p>
              )}

              <button
                type="submit"
                disabled={isAddingContact}
                className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs transition cursor-pointer"
              >
                {isAddingContact ? 'Đang lưu...' : 'Lưu Số Điện Thoại'}
              </button>
            </form>

            {/* Contacts List */}
            {contacts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                Chưa có số điện thoại nào trong danh bạ khẩn cấp của thiết bị này.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {contacts.map((c) => (
                  <div key={c.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {c.name}
                      </div>
                      <div className="text-xs text-indigo-600 dark:text-indigo-400 font-mono font-bold mt-0.5">
                        {c.phone}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Quan hệ: {c.relationship || 'Phụ huynh'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={`tel:${c.phone}`}
                        className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition cursor-pointer"
                        title="Gọi điện"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => handleDeleteContact(c.id)}
                        disabled={deletingContactId === c.id}
                        className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                        title="Xoá số"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 1: Status & Student Info */}
      {activeTab === 'status' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box 1: Student & Hardware Info */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Thông Tin Học Sinh & Thiết Bị
              </h3>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Họ và tên học sinh</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {device.studentName || device.name}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Trường đăng ký</span>
                  <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {device.schoolName || 'Chưa cập nhật'}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Lớp học</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {device.className || 'Chưa cập nhật'}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Phụ huynh quản lý</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {device.ownerName} ({device.ownerEmail})
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Tên thiết bị & Nền tảng</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {device.name} · {device.platform} {device.osVersion || ''}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-400">Mã định danh UUID</span>
                  <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 font-bold">
                    {device.deviceUuid}
                  </span>
                </div>
              </div>
            </div>

            {/* Box 2: Live Telemetry & App/Web Status */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  Trạng Thái Điện Thoại Thời Gian Thực
                </h3>
                <span
                  className={`text-xs font-bold ${
                    isOnline
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : isIdle
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-500'
                  }`}
                >
                  {device.status || 'OFFLINE'}
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-400">Ứng dụng đang mở hiện tại</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {device.currentApp || 'Màn hình chính'}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-400">Website vừa truy cập</span>
                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {device.currentWebsite || 'google.com'}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-400">Thời gian sáng màn hình hôm nay</span>
                  <span className="font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">
                    {device.screenTimeMinutes ?? 0} phút
                  </span>
                </div>
                <div className="py-2.5 flex justify-between items-center">
                  <span className="text-slate-400">Mức Pin & Nguồn sạc</span>
                  <span className="font-mono tabular-nums font-bold text-slate-800 dark:text-slate-200">
                    {device.batteryLevel ?? 100}% {device.charging ? '· Đang cắm sạc' : ''}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Kết nối mạng</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {device.networkType || 'WIFI'}
                  </span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <span className="text-slate-400">Cập nhật lần cuối</span>
                  <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                    {device.lastSeen ? new Date(device.lastSeen).toLocaleString('vi-VN') : 'Chưa có'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* App & Web Summary Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-500" />
              <span>Giám Sát Trực Tiếp App & Web</span>
            </h3>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Ứng dụng mở gần nhất:</span>
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300">
                  {device.currentApp || 'Màn hình chính'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Website vừa truy cập:</span>
                <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                  {device.currentWebsite || 'google.com'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Mức pin hiện tại:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {device.batteryLevel ?? 100}% {device.charging ? '⚡ Đang sạc' : ''}
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('usage')}
              className="w-full py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition cursor-pointer"
            >
              Xem Chi Tiết Lịch Sử App & Web ↗
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: App & Web Usage Management */}
      {activeTab === 'usage' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* App Usage List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Ứng Dụng Đã Sử Dụng Trên Điện Thoại ({appUsages.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Phụ huynh & Giáo viên có thể chặn ứng dụng giải trí/game trong giờ học
              </p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {appUsages.map((app) => (
                <div
                  key={app.id}
                  className="px-6 py-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-slate-900 dark:text-white">
                      {app.appName}
                      {app.isRunning && !app.isBlocked && (
                        <span className="ml-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          · Đang mở
                        </span>
                      )}
                      {app.isBlocked && (
                        <span className="ml-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
                          · Đã bị chặn
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                      Thời lượng: {app.durationMinutes} phút · Gói: {app.packageName}
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleBlock('APP', app.appName)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      app.isBlocked
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60'
                    }`}
                  >
                    {app.isBlocked ? (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Mở khóa</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Chặn App</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Web History List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Lịch Sử Truy Cập Website ({webHistory.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Danh sách tên miền và trang web học sinh đã mở trên trình duyệt
              </p>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {webHistory.map((web) => (
                <div
                  key={web.id}
                  className="px-6 py-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-indigo-600 dark:text-indigo-400 font-mono">
                      {web.domain}
                      {web.isBlocked && (
                        <span className="ml-2 text-xs font-sans font-semibold text-rose-600 dark:text-rose-400">
                          · Đã chặn
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-800 dark:text-slate-200 truncate mt-0.5">
                      {web.pageTitle}
                    </div>
                    <div className="text-xs text-slate-500 font-mono tabular-nums mt-0.5">
                      {web.visitCount} lần truy cập · {web.durationMinutes} phút
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleBlock('WEB', web.domain)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                      web.isBlocked
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60'
                    }`}
                  >
                    {web.isBlocked ? (
                      <>
                        <Unlock className="w-3.5 h-3.5" />
                        <span>Bỏ chặn</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Chặn Web</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}



      {/* Tab 5: Activity Log */}
      {activeTab === 'activity' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white">
            Nhật Ký Hoạt Động Của Thiết Bị Học Sinh
          </h3>

          {activities.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Chưa có sự kiện hoạt động nào cho thiết bị này.
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {act.type}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">
                      {act.description}
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono tabular-nums shrink-0">
                    {new Date(act.timestamp).toLocaleString('vi-VN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Mobile App REST API Documentation */}
      {activeTab === 'api' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                REST API Gửi Telemetry App, Web & GPS
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Mã cURL tích hợp ứng dụng trên điện thoại học sinh gửi thông tin App đang mở và Website truy cập
              </p>
            </div>

            <button
              onClick={() => copyToClipboard(curlLocationExample)}
              className="py-1.5 px-3 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCurl ? 'Đã sao chép' : 'Sao chép cURL'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 text-slate-200 text-xs overflow-x-auto font-mono leading-relaxed border border-slate-800">
            {curlLocationExample}
          </pre>
        </div>
      )}
    </div>
  );
};
