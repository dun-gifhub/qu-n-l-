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
  MapPin,
  ArrowLeft,
  Trash2,
  Edit2,
  RefreshCw,
  Code2,
  Check,
  Copy,
  Globe,
  Lock,
  Unlock,
  Phone,
  PhoneCall,
  AlertTriangle,
  CheckCircle2,
  Navigation,
  ExternalLink,
  Route,
  SlidersHorizontal,
  ListChecks,
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
  initialTab = 'history',
}) => {
  const [device, setDevice] = useState<Device | null>(null);
  const [history, setHistory] = useState<DeviceLocation[]>([]);
  const [activities, setActivities] = useState<ActivityEvent[]>([]);
  const [appUsages, setAppUsages] = useState<AppUsageItem[]>([]);
  const [webHistory, setWebHistory] = useState<WebVisitItem[]>([]);
  const [contacts, setContacts] = useState<PhoneContact[]>([]);
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRel, setNewContactRel] = useState('Phụ huynh');
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
      isEmergencyAlert: true,
    });
    setIsAddingContact(false);
    if (res.success && res.data) {
      setContacts(res.data);
      setNewContactName('');
      setNewContactPhone('');
      setContactFeedback({ type: 'success', text: 'Đã thêm số điện thoại mới' });
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
      <div className="py-24 text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-2">
        <RefreshCw className="w-4 h-4 animate-spin text-[var(--accent-ink)]" strokeWidth={1.5} />
        <span>Đang tải thông tin thiết bị học sinh</span>
      </div>
    );
  }

  if (!device) {
    return (
      <div className="py-20 text-center space-y-4">
        <h2 className="text-lg font-semibold text-[var(--text-primary)]">
          Không tìm thấy thiết bị này hoặc bạn không có quyền truy cập
        </h2>
        <button
          onClick={() => navigate('/devices')}
          className="h-10 px-4 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] rounded-[var(--radius-control)] text-xs font-medium cursor-pointer"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const isOnline = device.status === 'ONLINE';
  const isIdle = device.status === 'IDLE';
  const totalAppMinutes = appUsages.reduce((sum, a) => sum + a.durationMinutes, 0);

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

  const tabs: Array<{
    key: 'history' | 'location' | 'usage' | 'status' | 'contacts' | 'activity' | 'api';
    label: string;
    icon: React.ReactNode;
  }> = [
    { key: 'history', label: `Lịch sử di chuyển (${history.length})`, icon: <Route className="w-4 h-4" strokeWidth={1.5} /> },
    { key: 'location', label: 'Vị trí hiện tại', icon: <MapPin className="w-4 h-4" strokeWidth={1.5} /> },
    { key: 'usage', label: `Ứng dụng & Web (${appUsages.length + webHistory.length})`, icon: <Smartphone className="w-4 h-4" strokeWidth={1.5} /> },
    { key: 'status', label: 'Trạng thái thiết bị', icon: <SlidersHorizontal className="w-4 h-4" strokeWidth={1.5} /> },
    { key: 'contacts', label: `Danh bạ khẩn cấp (${contacts.length})`, icon: <Phone className="w-4 h-4" strokeWidth={1.5} /> },
    { key: 'activity', label: `Nhật ký (${activities.length})`, icon: <ListChecks className="w-4 h-4" strokeWidth={1.5} /> },
    { key: 'api', label: 'API tích hợp', icon: <Code2 className="w-4 h-4" strokeWidth={1.5} /> },
  ];

  return (
    <div className="space-y-6 animate-page-enter">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/devices')}
            className="h-10 w-10 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] transition-[color,background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] flex items-center justify-center cursor-pointer"
            title="Quay lại danh sách thiết bị"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">
                {device.studentName || device.name}
              </h1>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                title="Chỉnh sửa thông tin học sinh và trường"
              >
                <Edit2 className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Trường: <strong className="font-medium text-[var(--text-primary)]">{device.schoolName}</strong> · Lớp: <strong className="font-medium text-[var(--text-primary)]">{device.className || 'Chưa rõ'}</strong> · Thiết bị: {device.name} ({device.platform})
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/report')}
            className="h-10 px-4 rounded-[var(--radius-control)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] border border-[var(--border-strong)] text-[var(--text-primary)] font-medium text-xs flex items-center gap-2 transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer whitespace-nowrap"
          >
            <Smartphone className="w-4 h-4" strokeWidth={1.5} />
            <span>Mở báo cáo trên điện thoại</span>
          </button>
          <button
            onClick={loadDeviceData}
            disabled={isLoading}
            className="h-10 w-10 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] transition-[color,background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] flex items-center justify-center cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          </button>
          <button
            onClick={handleDeleteDevice}
            disabled={isDeleting}
            className="h-10 w-10 rounded-[var(--radius-control)] bg-[var(--danger-soft)] border border-[var(--danger-border)] text-[var(--danger)] hover:bg-[#A82834] hover:text-white transition-[color,background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] flex items-center justify-center cursor-pointer"
            title="Xóa thiết bị"
          >
            <Trash2 className="w-4 h-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Inline Edit Form */}
      {isEditing && (
        <form
          onSubmit={handleUpdateInfo}
          className="p-5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
        >
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Họ tên học sinh
            </label>
            <input
              type="text"
              value={editStudentName}
              onChange={(e) => setEditStudentName(e.target.value)}
              className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Trường học (Đồng bộ GVCN)
            </label>
            <input
              type="text"
              value={editSchoolName}
              onChange={(e) => setEditSchoolName(e.target.value)}
              className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
              Lớp và tên máy
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={editClassName}
                onChange={(e) => setEditClassName(e.target.value)}
                placeholder="Lớp"
                className="w-20 h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)]"
              />
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Tên máy"
                className="flex-1 h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)]"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 h-10 px-3 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] rounded-[var(--radius-control)] text-xs font-medium cursor-pointer"
            >
              Lưu
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="h-10 px-3 border border-[var(--border-strong)] text-[var(--text-primary)] rounded-[var(--radius-control)] text-xs cursor-pointer"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {/* Alert Banner nếu thiết bị mất kết nối / nghi vấn gỡ cài đặt */}
      {(device.isUninstalled || device.heartbeatTimeout) && (
        <div className="p-4 rounded-[var(--radius-card)] bg-[var(--danger-soft)] border border-[var(--danger-border)] text-[var(--text-primary)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--danger-border)] text-[var(--danger)] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <div className="font-semibold text-sm text-[var(--danger)] flex flex-wrap items-center gap-2">
                <span>{device.disconnectReason || 'Mất kết nối / Có thể đã gỡ cài đặt'}</span>
                <span className="px-2 py-0.5 rounded-[6px] text-[11px] bg-[var(--surface)] border border-[var(--danger-border)] text-[var(--danger)] font-mono font-medium">
                  Cảnh báo thiết bị
                </span>
              </div>
              <div className="text-xs text-[var(--text-secondary)] mt-1">
                {device.heartbeatTimeout
                  ? 'Thiết bị không gửi tín hiệu nhịp tim định kỳ quá 3 phút.'
                  : 'Học sinh đã gửi tín hiệu gỡ cài đặt hoặc ngừng chia sẻ vị trí trên điện thoại.'}
                {device.lastSeen && ` (Hoạt động gần nhất: ${new Date(device.lastSeen).toLocaleString('vi-VN')})`}
              </div>
            </div>
          </div>

          <button
            onClick={async () => {
              const res = await api.restoreDeviceStatus(deviceId);
              if (res.success && res.data) {
                setDevice(res.data);
              }
            }}
            className="h-9 px-3 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--danger-border)] text-[var(--danger)] hover:bg-[#A82834] hover:text-white font-medium text-xs flex items-center gap-2 transition-[color,background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] shrink-0 cursor-pointer self-start sm:self-center"
          >
            <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
            <span>Khôi phục trạng thái</span>
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-[var(--border)] overflow-x-auto gap-1">
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`h-11 px-4 text-xs font-medium border-b-2 transition-[color,border-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                active
                  ? 'border-[var(--accent)] text-[var(--accent-ink)]'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: Lịch Sử Di Chuyển */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <div className="p-4 rounded-[var(--radius-card)] bg-[var(--accent-soft)] border border-[var(--accent-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--accent-border)] text-[var(--accent-ink)] flex items-center justify-center shrink-0">
                <Navigation className="w-4 h-4" strokeWidth={1.5} />
              </div>
              <div>
                <div className="font-semibold text-[var(--text-primary)]">
                  Nhật ký lộ trình lưu trữ liên tục trên Neon PostgreSQL
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">
                  Toàn bộ các điểm tọa độ di chuyển được ghi nhận theo thứ tự thời gian thực.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                onClick={copyGpsHistory}
                disabled={history.length === 0}
                className="h-9 px-3 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border-strong)] hover:bg-[var(--surface-muted)] text-[var(--text-primary)] font-medium text-xs flex items-center gap-2 transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer disabled:opacity-50"
                title="Sao chép toàn bộ danh sách tọa độ GPS"
              >
                {copiedGps ? (
                  <Check className="w-4 h-4 text-[var(--success)]" strokeWidth={1.5} />
                ) : (
                  <Copy className="w-4 h-4" strokeWidth={1.5} />
                )}
                <span>{copiedGps ? 'Đã chép GPS' : 'Chép tọa độ'}</span>
              </button>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="p-4 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-[var(--text-secondary)]">
                Khoảng thời gian
              </span>
              {[
                { key: 'all', label: 'Toàn bộ' },
                { key: 'today', label: 'Hôm nay' },
                { key: '7days', label: '7 ngày qua' },
                { key: '30days', label: '30 ngày qua' },
              ].map((r) => (
                <button
                  key={r.key}
                  onClick={() => setHistoryRange(r.key as any)}
                  className={`h-8 px-3 rounded-[var(--radius-control)] text-xs font-medium transition-[color,background-color,border-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer border ${
                    historyRange === r.key
                      ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] border-[var(--accent-border)]'
                      : 'bg-[var(--surface-muted)] border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs font-mono tabular-nums">
              <span className="h-8 px-3 rounded-[var(--radius-control)] bg-[var(--surface-muted)] text-[var(--text-primary)] border border-[var(--border)] font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--accent-ink)]" strokeWidth={1.5} />
                <span>{history.length} tọa độ</span>
              </span>
              <button
                onClick={loadDeviceData}
                className="h-8 w-8 rounded-[var(--radius-control)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-[var(--border)] flex items-center justify-center transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer"
                title="Làm mới lịch sử"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
              </button>
            </div>
          </div>

          {/* Interactive Route Map */}
          <div className="rounded-[var(--radius-card)] overflow-hidden border border-[var(--border)] shadow-[var(--shadow-card)]">
            <div className="px-5 py-3 bg-[var(--surface)] border-b border-[var(--border)] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--accent-ink)]" strokeWidth={1.5} />
                <span className="text-xs font-semibold text-[var(--text-primary)]">
                  Lộ trình di chuyển trên bản đồ vệ tinh
                </span>
              </div>
              <span className="text-xs text-[var(--text-muted)] font-mono">
                Tuyến tọa độ nối tiếp
              </span>
            </div>
            <DeviceMap historyLocations={history} height="460px" />
          </div>

          {/* Detailed Points Table */}
          <div className="bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] overflow-hidden shadow-[var(--shadow-card)]">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-sm text-[var(--text-primary)]">
                  Bảng lịch sử tọa độ GPS và điểm dừng
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Lưu trữ theo dấu thời gian trên Neon PostgreSQL
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums font-medium text-[var(--accent-ink)]">
                {history.length} điểm ghi nhận
              </span>
            </div>

            {history.length === 0 ? (
              <div className="py-12 px-4 text-center text-xs text-[var(--text-muted)] space-y-2">
                <p>Chưa có dữ liệu lịch sử di chuyển nào được ghi nhận trong khoảng thời gian này.</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Mở trang báo cáo trên điện thoại để bắt đầu truyền tọa độ GPS định kỳ
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-[var(--surface-muted)]/60 text-[var(--text-secondary)] font-medium border-b border-[var(--border)]">
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
                  <tbody className="divide-y divide-[var(--border)] font-mono tabular-nums">
                    {history.map((loc, idx) => (
                      <tr
                        key={loc.id || idx}
                        className="hover:bg-[var(--surface-muted)]/40 transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)]"
                      >
                        <td className="py-3 px-5 text-[var(--text-muted)]">#{idx + 1}</td>
                        <td className="py-3 px-5 text-[var(--text-primary)] font-sans">
                          {new Date(loc.timestamp).toLocaleString('vi-VN')}
                        </td>
                        <td className="py-3 px-5 font-medium text-[var(--text-primary)]">
                          {loc.latitude.toFixed(6)}
                        </td>
                        <td className="py-3 px-5 font-medium text-[var(--text-primary)]">
                          {loc.longitude.toFixed(6)}
                        </td>
                        <td className="py-3 px-5 text-[var(--text-secondary)]">
                          {loc.accuracy ? `±${Math.round(loc.accuracy)} m` : '±10 m'}
                        </td>
                        <td className="py-3 px-5 font-sans">
                          {idx === 0 ? (
                            <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-medium bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success-border)]">
                              Vị trí mới nhất
                            </span>
                          ) : idx === history.length - 1 ? (
                            <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-medium bg-[var(--accent-soft)] text-[var(--accent-ink)] border border-[var(--accent-border)]">
                              Điểm xuất phát
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-medium bg-[var(--surface-muted)] text-[var(--text-secondary)] border border-[var(--border)]">
                              Điểm di chuyển
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-5 text-right font-sans">
                          <a
                            href={`https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[var(--accent-ink)] font-medium hover:underline inline-flex items-center gap-1"
                          >
                            <span>Google Maps</span>
                            <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
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
          <div className="p-4 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <span className="text-[var(--text-secondary)] block">Vĩ độ (Latitude)</span>
                <span className="font-mono tabular-nums font-semibold text-[var(--text-primary)]">
                  {typeof device.latitude === 'number' ? device.latitude.toFixed(6) : 'Chưa có'}
                </span>
              </div>
              <div>
                <span className="text-[var(--text-secondary)] block">Kinh độ (Longitude)</span>
                <span className="font-mono tabular-nums font-semibold text-[var(--text-primary)]">
                  {typeof device.longitude === 'number' ? device.longitude.toFixed(6) : 'Chưa có'}
                </span>
              </div>
              <div>
                <span className="text-[var(--text-secondary)] block">Độ chính xác</span>
                <span className="font-mono tabular-nums font-semibold text-[var(--text-primary)]">
                  {device.accuracy ? `±${device.accuracy} m` : 'Tiêu chuẩn'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {device.latitude && device.longitude && (
                <a
                  href={`https://www.google.com/maps?q=${device.latitude},${device.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                  className="h-9 px-3 rounded-[var(--radius-control)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] font-medium transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer text-xs flex items-center gap-2"
                >
                  <span>Mở Google Maps</span>
                  <ExternalLink className="w-4 h-4" strokeWidth={1.5} />
                </a>
              )}
              <button
                onClick={() => navigate('/report')}
                className="h-9 px-3 rounded-[var(--radius-control)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] border border-[var(--border-strong)] text-[var(--text-primary)] font-medium transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer text-xs flex items-center gap-2"
              >
                <Smartphone className="w-4 h-4" strokeWidth={1.5} />
                <span>Mở báo cáo trên điện thoại</span>
              </button>
            </div>
          </div>

          <div className="rounded-[var(--radius-card)] overflow-hidden border border-[var(--border)] shadow-[var(--shadow-card)]">
            <DeviceMap selectedDevice={device} height="480px" />
          </div>
        </div>
      )}

      {/* Tab: Danh bạ & SĐT Phụ Huynh / Khẩn Cấp */}
      {activeTab === 'contacts' && (
        <div className="space-y-6">
          <div className="p-6 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-semibold text-base text-[var(--text-primary)] flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[var(--accent-ink)]" strokeWidth={1.5} />
                  <span>Danh bạ và số điện thoại khẩn cấp (<span className="font-mono tabular-nums">{contacts.length}</span>)</span>
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Số điện thoại người thân để liên hệ ngay khi học sinh gặp sự cố hoặc cảnh báo giờ học
                </p>
              </div>

              {contacts.length > 0 && (
                !confirmClearContactsOpen ? (
                  <button
                    onClick={() => setConfirmClearContactsOpen(true)}
                    className="h-8 px-3 rounded-[var(--radius-control)] bg-[var(--danger-soft)] border border-[var(--danger-border)] text-[var(--danger)] hover:bg-[#A82834] hover:text-white text-xs font-medium transition-[color,background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer self-start"
                  >
                    Xóa toàn bộ danh bạ
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setConfirmClearContactsOpen(false)}
                      className="h-8 px-3 rounded-[var(--radius-control)] border border-[var(--border-strong)] text-xs font-medium text-[var(--text-primary)] cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleClearAllContacts}
                      disabled={isDeletingAllContacts}
                      className="h-8 px-3 rounded-[var(--radius-control)] bg-[#A82834] text-white text-xs font-medium cursor-pointer disabled:opacity-50"
                    >
                      {isDeletingAllContacts ? 'Đang xóa' : 'Xác nhận xóa hết'}
                    </button>
                  </div>
                )
              )}
            </div>

            {/* Add Contact Form */}
            <form
              onSubmit={handleAddContact}
              className="p-4 rounded-[var(--radius-control)] bg-[var(--surface-muted)]/60 border border-[var(--border)] space-y-3"
            >
              <span className="font-semibold text-xs text-[var(--text-primary)] block">
                Thêm số điện thoại mới
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Tên người liên hệ (VD: Mẹ Lan)"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)]"
                  required
                />
                <input
                  type="text"
                  placeholder="Số điện thoại (VD: 0901234567)"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                  className="h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs font-mono text-[var(--text-primary)]"
                  required
                />
                <select
                  value={newContactRel}
                  onChange={(e) => setNewContactRel(e.target.value)}
                  className="h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)]"
                >
                  <option value="Phụ huynh">Phụ huynh (Bố/Mẹ)</option>
                  <option value="Giáo viên">Giáo viên chủ nhiệm</option>
                  <option value="Người giám hộ">Người giám hộ</option>
                  <option value="Khẩn cấp">Số cứu nạn khẩn cấp</option>
                </select>
              </div>

              {contactFeedback && (
                <p
                  className={`text-xs font-medium ${
                    contactFeedback.type === 'success' ? 'text-[var(--success)]' : 'text-[var(--danger)]'
                  }`}
                >
                  {contactFeedback.text}
                </p>
              )}

              <button
                type="submit"
                disabled={isAddingContact}
                className="h-9 px-4 rounded-[var(--radius-control)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] disabled:opacity-50 text-[var(--btn-primary-text)] font-medium text-xs transition-[background-color,opacity] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer"
              >
                {isAddingContact ? 'Đang lưu' : 'Lưu số điện thoại'}
              </button>
            </form>

            {/* Contacts List */}
            {contacts.length === 0 ? (
              <div className="py-8 text-center text-xs text-[var(--text-muted)]">
                Chưa có số điện thoại nào trong danh bạ khẩn cấp của thiết bị này
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {contacts.map((c) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-[var(--radius-control)] bg-[var(--surface-muted)]/60 border border-[var(--border)] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-xs text-[var(--text-primary)] truncate">
                        {c.name}
                      </div>
                      <div className="text-xs text-[var(--accent-ink)] font-mono font-medium mt-1">
                        {c.phone}
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)] mt-1">
                        Quan hệ: {c.relationship || 'Phụ huynh'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`tel:${c.phone}`}
                        className="h-8 w-8 rounded-[var(--radius-control)] bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success-border)] flex items-center justify-center cursor-pointer"
                        title="Gọi điện"
                      >
                        <PhoneCall className="w-4 h-4" strokeWidth={1.5} />
                      </a>
                      <button
                        onClick={() => handleDeleteContact(c.id)}
                        disabled={deletingContactId === c.id}
                        className="h-8 w-8 rounded-[var(--radius-control)] bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger-border)] flex items-center justify-center cursor-pointer"
                        title="Xóa số"
                      >
                        <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Status & Student Info */}
      {activeTab === 'status' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Box 1: Student & Hardware Info */}
            <div className="p-6 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-4">
              <h3 className="font-semibold text-base text-[var(--text-primary)]">
                Thông tin học sinh và thiết bị
              </h3>

              <div className="divide-y divide-[var(--border)] text-xs">
                <div className="py-3 flex justify-between gap-4">
                  <span className="text-[var(--text-secondary)]">Họ và tên học sinh</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {device.studentName || device.name}
                  </span>
                </div>
                <div className="py-3 flex justify-between gap-4">
                  <span className="text-[var(--text-secondary)]">Trường đăng ký</span>
                  <span className="font-medium text-[var(--accent-ink)]">
                    {device.schoolName || 'Chưa cập nhật'}
                  </span>
                </div>
                <div className="py-3 flex justify-between gap-4">
                  <span className="text-[var(--text-secondary)]">Lớp học</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {device.className || 'Chưa cập nhật'}
                  </span>
                </div>
                <div className="py-3 flex justify-between gap-4">
                  <span className="text-[var(--text-secondary)]">Phụ huynh quản lý</span>
                  <span className="font-medium text-[var(--text-primary)] text-right">
                    {device.ownerName} ({device.ownerEmail})
                  </span>
                </div>
                <div className="py-3 flex justify-between gap-4">
                  <span className="text-[var(--text-secondary)]">Tên thiết bị và nền tảng</span>
                  <span className="font-medium text-[var(--text-primary)]">
                    {device.name} · {device.platform} {device.osVersion || ''}
                  </span>
                </div>
                <div className="py-3 flex justify-between items-center gap-4">
                  <span className="text-[var(--text-secondary)]">Mã định danh UUID</span>
                  <span className="font-mono text-[11px] text-[var(--text-primary)] font-medium truncate">
                    {device.deviceUuid}
                  </span>
                </div>
              </div>
            </div>

            {/* Box 2: Live Telemetry & App/Web Status */}
            <div className="p-6 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base text-[var(--text-primary)]">
                  Trạng thái điện thoại thời gian thực
                </h3>
                <span
                  className={`text-xs font-medium ${
                    isOnline
                      ? 'text-[var(--success)]'
                      : isIdle
                      ? 'text-[var(--warning)]'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {isOnline ? 'Trực tuyến' : isIdle ? 'Chờ' : 'Ngoại tuyến'}
                </span>
              </div>

              <div className="divide-y divide-[var(--border)] text-xs">
                <div className="py-3 flex justify-between items-center gap-4">
                  <span className="text-[var(--text-secondary)]">Ứng dụng đang mở</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {device.currentApp || 'Màn hình chính'}
                  </span>
                </div>
                <div className="py-3 flex justify-between items-center gap-4">
                  <span className="text-[var(--text-secondary)]">Website vừa truy cập</span>
                  <span className="font-mono font-medium text-[var(--accent-ink)]">
                    {device.currentWebsite || 'google.com'}
                  </span>
                </div>
                <div className="py-3 flex justify-between items-center gap-4">
                  <span className="text-[var(--text-secondary)]">Thời gian sáng màn hình hôm nay</span>
                  <span className="font-mono tabular-nums font-medium text-[var(--text-primary)]">
                    {device.screenTimeMinutes ?? 0} phút
                  </span>
                </div>
                <div className="py-3 flex justify-between items-center gap-4">
                  <span className="text-[var(--text-secondary)]">Mức pin và nguồn sạc</span>
                  <span className="font-mono tabular-nums font-medium text-[var(--text-primary)]">
                    {device.batteryLevel ?? 100}% {device.charging ? '· Đang cắm sạc' : ''}
                  </span>
                </div>
                <div className="py-3 flex justify-between gap-4">
                  <span className="text-[var(--text-secondary)]">Kết nối mạng</span>
                  <span className="font-mono font-medium text-[var(--text-primary)]">
                    {device.networkType || 'WIFI'}
                  </span>
                </div>
                <div className="py-3 flex justify-between gap-4">
                  <span className="text-[var(--text-secondary)]">Cập nhật lần cuối</span>
                  <span className="font-mono tabular-nums text-[var(--text-secondary)]">
                    {device.lastSeen ? new Date(device.lastSeen).toLocaleString('vi-VN') : 'Chưa có'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* App & Web Summary Card */}
          <div className="p-6 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-4">
            <h3 className="font-semibold text-base text-[var(--text-primary)] flex items-center gap-2">
              <Globe className="w-4 h-4 text-[var(--accent-ink)]" strokeWidth={1.5} />
              <span>Giám sát trực tiếp ứng dụng và website</span>
            </h3>
            <div className="p-4 rounded-[var(--radius-control)] bg-[var(--surface-muted)]/60 border border-[var(--border)] space-y-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-[var(--text-secondary)]">Ứng dụng mở gần nhất</span>
                <span className="px-2 py-1 rounded-[6px] text-xs font-medium bg-[var(--accent-soft)] text-[var(--accent-ink)] border border-[var(--accent-border)]">
                  {device.currentApp || 'Màn hình chính'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-[var(--text-secondary)]">Website vừa truy cập</span>
                <span className="font-mono text-xs font-medium text-[var(--accent-ink)]">
                  {device.currentWebsite || 'google.com'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-[var(--text-secondary)]">Mức pin hiện tại</span>
                <span className="font-mono tabular-nums text-xs font-medium text-[var(--text-primary)]">
                  {device.batteryLevel ?? 100}% {device.charging ? '· Đang sạc' : ''}
                </span>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('usage')}
              className="w-full h-10 px-4 rounded-[var(--radius-control)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] text-xs font-medium transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer"
            >
              Xem chi tiết lịch sử ứng dụng và website
            </button>
          </div>
        </div>
      )}

      {/* Tab: App & Web Usage Management */}
      {activeTab === 'usage' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* App Usage List */}
          <div className="bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] shadow-[var(--shadow-card)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h3 className="font-semibold text-base text-[var(--text-primary)]">
                Ứng dụng đã sử dụng (<span className="font-mono tabular-nums">{appUsages.length}</span>)
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Phụ huynh và giáo viên có thể chặn ứng dụng giải trí trong giờ học
              </p>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {appUsages.map((app) => {
                const pct =
                  totalAppMinutes > 0
                    ? Math.min(100, Math.max(3, Math.round((app.durationMinutes / totalAppMinutes) * 100)))
                    : 0;
                return (
                  <div
                    key={app.id}
                    className="px-6 py-4 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="font-semibold text-sm text-[var(--text-primary)]">
                        {app.appName}
                        {app.isRunning && !app.isBlocked && (
                          <span className="ml-2 text-xs font-medium text-[var(--success)]">
                            · Đang mở
                          </span>
                        )}
                        {app.isBlocked && (
                          <span className="ml-2 text-xs font-medium text-[var(--danger)]">
                            · Đã bị chặn
                          </span>
                        )}
                      </div>
                      <div className="w-full h-1 rounded-full bg-[var(--surface-muted)] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            app.isBlocked
                              ? 'bg-[var(--danger)]'
                              : app.category === 'EDUCATION'
                              ? 'bg-[var(--accent)]'
                              : 'bg-[var(--warning)]'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-xs text-[var(--text-secondary)] font-mono tabular-nums">
                        {app.durationMinutes} phút · {app.packageName}
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleBlock('APP', app.appName)}
                      className={`h-8 px-3 rounded-[var(--radius-control)] text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap border transition-[color,background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${
                        app.isBlocked
                          ? 'bg-[var(--surface-muted)] border-[var(--border)] text-[var(--text-primary)]'
                          : 'bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger-border)] hover:bg-[#A82834] hover:text-white'
                      }`}
                    >
                      {app.isBlocked ? (
                        <>
                          <Unlock className="w-4 h-4" strokeWidth={1.5} />
                          <span>Mở khóa</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" strokeWidth={1.5} />
                          <span>Chặn app</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Web History List */}
          <div className="bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] shadow-[var(--shadow-card)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)]">
              <h3 className="font-semibold text-base text-[var(--text-primary)]">
                Lịch sử truy cập website (<span className="font-mono tabular-nums">{webHistory.length}</span>)
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Danh sách tên miền học sinh đã mở trên trình duyệt
              </p>
            </div>

            <div className="divide-y divide-[var(--border)]">
              {webHistory.map((web) => (
                <div
                  key={web.id}
                  className="px-6 py-4 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-[var(--accent-ink)] font-mono">
                      {web.domain}
                      {web.isBlocked && (
                        <span className="ml-2 text-xs font-sans font-medium text-[var(--danger)]">
                          · Đã chặn
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--text-primary)] truncate mt-1">
                      {web.pageTitle}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)] font-mono tabular-nums mt-1">
                      {web.visitCount} lần truy cập · {web.durationMinutes} phút
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleBlock('WEB', web.domain)}
                    className={`h-8 px-3 rounded-[var(--radius-control)] text-xs font-medium flex items-center gap-1.5 cursor-pointer whitespace-nowrap border transition-[color,background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${
                      web.isBlocked
                        ? 'bg-[var(--surface-muted)] border-[var(--border)] text-[var(--text-primary)]'
                        : 'bg-[var(--danger-soft)] text-[var(--danger)] border-[var(--danger-border)] hover:bg-[#A82834] hover:text-white'
                    }`}
                  >
                    {web.isBlocked ? (
                      <>
                        <Unlock className="w-4 h-4" strokeWidth={1.5} />
                        <span>Bỏ chặn</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" strokeWidth={1.5} />
                        <span>Chặn web</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab: Activity Log */}
      {activeTab === 'activity' && (
        <div className="p-6 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-4">
          <h3 className="font-semibold text-base text-[var(--text-primary)]">
            Nhật ký hoạt động của thiết bị
          </h3>

          {activities.length === 0 ? (
            <div className="py-12 text-center text-xs text-[var(--text-muted)]">
              Chưa có sự kiện hoạt động nào cho thiết bị này
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((act) => (
                <div
                  key={act.id}
                  className="p-4 rounded-[var(--radius-control)] bg-[var(--surface-muted)]/60 border border-[var(--border)] text-xs flex items-start justify-between gap-4"
                >
                  <div>
                    <div className="font-semibold text-[var(--text-primary)] font-mono">
                      {act.type}
                    </div>
                    <p className="text-[var(--text-secondary)] mt-1">
                      {act.description}
                    </p>
                  </div>
                  <span className="text-xs text-[var(--text-muted)] font-mono tabular-nums shrink-0">
                    {new Date(act.timestamp).toLocaleString('vi-VN')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Mobile App REST API Documentation */}
      {activeTab === 'api' && (
        <div className="p-6 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-base text-[var(--text-primary)]">
                REST API gửi telemetry ứng dụng, web và GPS
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Mẫu lệnh cURL tích hợp vào ứng dụng di động gửi trạng thái đang mở và website truy cập
              </p>
            </div>

            <button
              onClick={() => copyToClipboard(curlLocationExample)}
              className="h-9 px-3 rounded-[var(--radius-control)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-xs font-medium text-[var(--text-primary)] flex items-center gap-2 transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer self-start sm:self-center"
            >
              {copiedCurl ? (
                <Check className="w-4 h-4 text-[var(--success)]" strokeWidth={1.5} />
              ) : (
                <Copy className="w-4 h-4" strokeWidth={1.5} />
              )}
              <span>{copiedCurl ? 'Đã sao chép' : 'Sao chép cURL'}</span>
            </button>
          </div>

          <pre className="p-4 rounded-[var(--radius-control)] bg-[#121417] text-[#F0F2F5] text-xs overflow-x-auto font-mono leading-relaxed border border-[var(--border)]">
            {curlLocationExample}
          </pre>
        </div>
      )}
    </div>
  );
};
