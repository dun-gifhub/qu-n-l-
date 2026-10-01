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
  initialTab = 'usage',
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
    'usage' | 'status' | 'activity' | 'api'
  >((initialTab === 'location' || initialTab === 'history' ? 'usage' : (initialTab as any)) || 'usage');
  const [historyRange, setHistoryRange] = useState<'today' | '7days' | '30days'>('today');
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editStudentName, setEditStudentName] = useState('');
  const [editSchoolName, setEditSchoolName] = useState('');
  const [editClassName, setEditClassName] = useState('');
  const [copiedCurl, setCopiedCurl] = useState(false);

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
    } finally {
      setIsLoading(false);
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
          { key: 'usage', label: `📱 Sử dụng App & Web (${appUsages.length + webHistory.length})` },
          { key: 'status', label: '⚙️ Trạng thái & Học sinh' },
          { key: 'activity', label: '📋 Nhật ký hoạt động' },
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
