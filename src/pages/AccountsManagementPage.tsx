import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { User, Device, ApprovalStatus, UserRole } from '../types/index.ts';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Plus,
  Trash2,
  Edit2,
  Smartphone,
  ShieldCheck,
  GraduationCap,
  UserCheck,
  X,
  ArrowRight,
  KeyRound,
  Eye,
  EyeOff,
  Lock,
} from 'lucide-react';

interface AccountsManagementPageProps {
  navigate: (path: string) => void;
}

export const AccountsManagementPage: React.FC<AccountsManagementPageProps> = ({ navigate }) => {
  const { user: currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [users, setUsers] = useState<User[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | UserRole>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | ApprovalStatus>('ALL');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [approvingUserId, setApprovingUserId] = useState<string | null>(null);
  const [dbStats, setDbStats] = useState<{
    isNeonConnected: boolean;
    totalUsers: number;
    totalDevices: number;
    neonUsersCount?: number;
    neonDevicesCount?: number;
    databaseEngine: string;
  } | null>(null);

  // Create new account modal state (Admin)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('123456');
  const [newRole, setNewRole] = useState<UserRole>('TEACHER');
  const [newSchool, setNewSchool] = useState('THPT Chuyên Lê Hồng Phong');
  const [newClass, setNewClass] = useState('10A1');
  const [newStudentName, setNewStudentName] = useState('');

  // Edit account modal state (Admin)
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('TEACHER');
  const [editSchool, setEditSchool] = useState('');
  const [editClass, setEditClass] = useState('');
  const [editStudentName, setEditStudentName] = useState('');
  const [editPassword, setEditPassword] = useState('');

  // Password Reset Modal (Admin)
  const [passwordModalUser, setPasswordModalUser] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const openPasswordModal = (u: User) => {
    setPasswordModalUser(u);
    setNewPasswordInput('');
    setShowPasswordText(false);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordModalUser) return;
    if (!newPasswordInput.trim() || newPasswordInput.trim().length < 6) {
      showToast('Mật khẩu mới phải có tối thiểu 6 ký tự');
      return;
    }

    setIsUpdatingPassword(true);
    const res = await api.resetUserPassword(passwordModalUser.id, newPasswordInput.trim());
    setIsUpdatingPassword(false);

    if (res.success) {
      showToast(res.message || `Đã đổi mật khẩu thành công cho ${passwordModalUser.name}`);
      setPasswordModalUser(null);
      setNewPasswordInput('');
      loadData();
    } else {
      showToast(res.message || 'Lỗi cập nhật mật khẩu');
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    const [usersRes, devRes, statsRes] = await Promise.all([
      api.getUsers(),
      api.getDevices(),
      api.getDatabaseStats().catch(() => ({ success: false, data: undefined })),
    ]);
    if (usersRes.success && usersRes.data) {
      setUsers(usersRes.data);
    }
    if (devRes.success && devRes.data) {
      setDevices(devRes.data);
    }
    if (statsRes.success && statsRes.data) {
      setDbStats(statsRes.data);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 4500);
  };

  const handleApproval = async (userId: string, approvalStatus: ApprovalStatus) => {
    setApprovingUserId(userId);
    // Smooth delay so the admin sees the action taking effect cleanly
    const [res] = await Promise.all([
      api.updateUserApproval(userId, approvalStatus),
      new Promise((r) => setTimeout(r, 650)),
    ]);
    setApprovingUserId(null);

    if (res.success) {
      showToast(
        approvalStatus === 'APPROVED'
          ? '✅ Đã duyệt tài khoản thành công & đã đồng bộ vào Neon PostgreSQL!'
          : 'Đã cập nhật trạng thái phê duyệt trên Neon PostgreSQL'
      );
      loadData();
    } else {
      showToast(res.message || 'Lỗi cập nhật trạng thái');
    }
  };

  const handleDeleteUser = async (target: User) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${target.name}"? Dữ liệu sẽ được gỡ khỏi hệ thống và Neon PostgreSQL.`)) {
      return;
    }
    const res = await api.deleteUserByAdmin(target.id);
    if (res.success) {
      showToast(res.message || `Đã xóa tài khoản ${target.name} khỏi Neon PostgreSQL`);
      loadData();
    }
  };

  const handleClearAllNonAdminUsers = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn LÀM TRỐNG TẤT CẢ tài khoản phụ (Giáo viên và Phụ huynh) không? Các tài khoản này sẽ bị xoá khỏi hệ thống.')) {
      return;
    }
    const res = await api.clearAllNonAdminUsers();
    if (res.success) {
      showToast(res.message || 'Đã làm trống toàn bộ tài khoản phụ thành công');
      loadData();
    } else {
      showToast(res.message || 'Lỗi khi làm trống tài khoản');
    }
  };

  const handleClearAllSystemData = async () => {
    if (!window.confirm('⚠️ CẢNH BÁO NGUY HIỂM: Bạn có chắc chắn muốn LÀM TRỐNG TẤT CẢ dữ liệu trên toàn hệ thống (toàn bộ thiết bị, lịch sử định vị, báo cáo ứng dụng và tài khoản phụ)?\n\nChỉ tài khoản Admin sẽ được giữ lại.')) {
      return;
    }
    const res = await api.clearAllSystemData();
    if (res.success) {
      showToast(res.message || 'Đã làm trống tất cả dữ liệu hệ thống thành công');
      loadData();
    } else {
      showToast(res.message || 'Lỗi khi làm trống dữ liệu');
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) return;

    setIsCreatingAccount(true);
    // Smooth responsive creation experience: "nhấn cái đợi một lúc là được"
    const [res] = await Promise.all([
      api.createUserByAdmin({
        name: newName.trim(),
        email: newEmail.trim(),
        password: newPassword.trim(),
        role: newRole,
        schoolName: newSchool.trim() || undefined,
        className: newClass.trim() || undefined,
        studentName: newRole === 'PARENT' ? newStudentName.trim() || undefined : undefined,
        approvalStatus: 'APPROVED',
      }),
      new Promise((r) => setTimeout(r, 750)),
    ]);
    setIsCreatingAccount(false);

    if (res.success) {
      showToast(
        newRole === 'TEACHER'
          ? `✅ Đã cấp tài khoản Giáo viên "${newName.trim()}" thành công & lưu vào Neon PostgreSQL!`
          : `✅ Đã tạo tài khoản "${newName.trim()}" thành công & lưu vào Neon PostgreSQL!`
      );
      setIsCreateModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewStudentName('');
      loadData();
    } else {
      showToast(res.message || 'Có lỗi xảy ra khi cấp tài khoản');
    }
  };

  const openEditUser = (u: User) => {
    setEditingUser(u);
    setEditRole(u.role);
    setEditSchool(u.schoolName || '');
    setEditClass(u.className || '');
    setEditStudentName(u.studentName || '');
    setEditPassword('');
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    const res = await api.updateUserByAdmin(editingUser.id, {
      role: editRole,
      schoolName: editSchool.trim(),
      className: editClass.trim(),
      studentName: editStudentName.trim(),
      password: editPassword.trim() || undefined,
    });
    if (res.success) {
      showToast('Đã cập nhật thông tin tài khoản và mật khẩu thành công');
      setEditingUser(null);
      setEditPassword('');
      loadData();
    }
  };

  const pendingUsers = users.filter((u) => u.approvalStatus === 'PENDING');
  const teacherCount = users.filter((u) => u.role === 'TEACHER').length;
  const parentCount = users.filter((u) => u.role === 'PARENT').length;

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.schoolName || '').toLowerCase().includes(q) ||
      (u.studentName || '').toLowerCase().includes(q);
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchStatus = statusFilter === 'ALL' || u.approvalStatus === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  const getRoleName = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'Admin tối thượng';
      case 'TEACHER':
        return 'Giáo viên chủ nhiệm';
      case 'PARENT':
        return 'Phụ huynh học sinh';
    }
  };

  const getApprovalLabel = (status: ApprovalStatus) => {
    switch (status) {
      case 'APPROVED':
        return 'Đã được Admin duyệt';
      case 'PENDING':
        return 'Chờ Admin duyệt';
      case 'REJECTED':
        return 'Đã từ chối / Khóa';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isAdmin
              ? 'Quản Trị Tài Khoản & Phê Duyệt (Admin Tối Thượng)'
              : `Danh Sách Giáo Viên & Phụ Huynh Trường ${currentUser?.schoolName || ''}`}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isAdmin
              ? 'Admin tối thượng quản lý tất cả tài khoản Giáo viên, Phụ huynh, phê duyệt đăng ký mới và theo dõi toàn bộ thiết bị'
              : 'Giáo viên chủ nhiệm theo dõi các tài khoản phụ huynh và học sinh đăng ký cùng trường'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {isAdmin && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Cấp tài khoản GV / Phụ huynh</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Password & Security Quick Card */}
      {isAdmin && (
        <div className="p-4.5 rounded-2xl bg-gradient-to-r from-indigo-900/90 via-indigo-950 to-slate-900 border border-indigo-700/50 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
              <KeyRound className="w-5 h-5 text-indigo-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white">Quản Lý Mật Khẩu (MK) Admin & Toàn Hệ Thống</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Phân Quyền Admin
                </span>
              </div>
              <p className="text-xs text-indigo-200 mt-0.5">
                Admin có quyền đổi mật khẩu cho chính mình hoặc đặt lại mật khẩu cho bất kỳ tài khoản Giáo viên / Phụ huynh nào.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleClearAllSystemData}
              className="py-2.5 px-3.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs whitespace-nowrap"
              title="Làm trống tất cả thiết bị, dữ liệu định vị và tài khoản phụ"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Làm trống tất cả dữ liệu</span>
            </button>
            {users.some((u) => u.role !== 'ADMIN') && (
              <button
                onClick={handleClearAllNonAdminUsers}
                className="py-2.5 px-3.5 rounded-xl bg-rose-950/60 hover:bg-rose-900/80 text-rose-200 border border-rose-700/60 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-xs whitespace-nowrap"
                title="Xóa toàn bộ tài khoản Giáo viên và Phụ huynh"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Làm trống tài khoản phụ</span>
              </button>
            )}
            <button
              onClick={() => {
                if (currentUser) openPasswordModal(currentUser);
              }}
              className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs whitespace-nowrap"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Đổi mật khẩu Admin của tôi</span>
            </button>
          </div>
        </div>
      )}

      {feedbackMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500">Tổng số tài khoản</div>
          <div className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white font-mono tabular-nums">
            {users.length}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Admin giám sát 100% tài khoản
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500">Tài khoản Giáo viên</div>
          <div className="mt-2 text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 font-mono tabular-nums">
            {teacherCount}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Theo dõi học sinh cùng trường
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500">Tài khoản Phụ huynh</div>
          <div className="mt-2 text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
            {parentCount}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Chỉ xem & quản lý con của mình
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500">Đang chờ Admin duyệt</div>
          <div className="mt-2 text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono tabular-nums">
            {pendingUsers.length}
          </div>
          <div className="mt-1 text-xs text-slate-400">
            Yêu cầu phê duyệt từ GV & PH
          </div>
        </div>
      </div>

      {/* Neon PostgreSQL & Storage Engine Live Status Card */}
      <div className="p-4.5 rounded-2xl bg-slate-900 border border-slate-800 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white">Lưu Trữ Cơ Sở Dữ Liệu Neon PostgreSQL</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {dbStats?.isNeonConnected ? 'Neon PostgreSQL Đã Kết Nối' : 'Neon Postgres Engine Sẵn Sàng'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              100% tài khoản đăng ký mới, tài khoản giáo viên do Admin cấp và tổng toàn bộ thiết bị đều được lưu trữ kiên cố trên Neon PostgreSQL.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono shrink-0">
          <div className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-slate-400 block text-[10px]">Tài khoản Neon:</span>
            <strong className="text-white text-sm">{dbStats?.neonUsersCount ?? users.length}</strong>
          </div>
          <div className="px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="text-slate-400 block text-[10px]">Thiết bị Neon:</span>
            <strong className="text-emerald-400 text-sm">{dbStats?.neonDevicesCount ?? devices.length}</strong>
          </div>
        </div>
      </div>

      {/* Pending Approval Section for Admin */}
      {isAdmin && pendingUsers.length > 0 && (
        <div className="bg-amber-50/70 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-900/60 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>
                  Danh Sách Tài Khoản Giáo Viên & Phụ Huynh Chờ Admin Duyệt ({pendingUsers.length})
                </span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Tài khoản của Giáo viên và Phụ huynh khi đăng ký mới cần được Admin duyệt trước khi truy cập dữ liệu học sinh
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingUsers.map((u) => (
              <div
                key={u.id}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-800/50 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {u.name}
                    </span>
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                      {getRoleName(u.role)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Email: <span className="font-mono">{u.email}</span>
                    {u.phone ? ` · SĐT: ${u.phone}` : ''}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    Trường: <strong>{u.schoolName || 'Chưa cập nhật'}</strong>
                    {u.className ? ` · Lớp: ${u.className}` : ''}
                    {u.studentName ? ` · Phụ huynh em: ${u.studentName}` : ''}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => handleApproval(u.id, 'APPROVED')}
                    disabled={approvingUserId === u.id}
                    className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-70 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    {approvingUserId === u.id ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang duyệt...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Duyệt tài khoản</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleApproval(u.id, 'REJECTED')}
                    disabled={approvingUserId === u.id}
                    className="py-2 px-3 rounded-lg bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white disabled:opacity-70 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Từ chối</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Filter Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo họ tên, email, trường học hoặc tên học sinh..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
            {[
              { key: 'ALL', label: 'Tất cả vị trí' },
              { key: 'TEACHER', label: 'Giáo viên' },
              { key: 'PARENT', label: 'Phụ huynh' },
              { key: 'ADMIN', label: 'Admin' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setRoleFilter(tab.key as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap cursor-pointer ${
                  roleFilter === tab.key
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            <option value="ALL">Mọi trạng thái duyệt</option>
            <option value="APPROVED">Đã được Admin duyệt</option>
            <option value="PENDING">Đang chờ duyệt</option>
            <option value="REJECTED">Đã từ chối</option>
          </select>
        </div>
      </div>

      {/* Main Accounts Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-6">Tài khoản & Liên hệ</th>
                <th className="py-3.5 px-6">Vị trí (Vai trò)</th>
                <th className="py-3.5 px-6">Trường học & Lớp / Con</th>
                <th className="py-3.5 px-6">Thiết bị theo dõi</th>
                <th className="py-3.5 px-6">Trạng thái duyệt</th>
                {isAdmin && <th className="py-3.5 px-6 text-right">Thao tác Admin</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.map((u) => {
                // Find devices linked to this user (or in their school if teacher)
                const linkedDevices =
                  u.role === 'TEACHER'
                    ? devices.filter(
                        (d) =>
                          (d.schoolName || '').toLowerCase().trim() ===
                          (u.schoolName || '').toLowerCase().trim()
                      )
                    : u.role === 'ADMIN'
                    ? devices
                    : devices.filter((d) => d.userId === u.id);

                return (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition"
                  >
                    <td className="py-4 px-6">
                      <div className="font-bold text-sm text-slate-900 dark:text-white">
                        {u.name}
                      </div>
                      <div className="text-slate-500 font-mono mt-0.5">{u.email}</div>
                      {u.phone && <div className="text-slate-400 mt-0.5">SĐT: {u.phone}</div>}
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {getRoleName(u.role)}
                      </div>
                      <div className="text-slate-400 mt-0.5">
                        {u.role === 'ADMIN'
                          ? 'Toàn quyền hệ thống'
                          : u.role === 'TEACHER'
                          ? 'Theo dõi HS cùng trường'
                          : 'Theo dõi con của mình'}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {u.schoolName || 'Chưa gán trường'}
                      </div>
                      <div className="text-slate-500 mt-0.5">
                        {u.className ? `Lớp: ${u.className}` : ''}
                        {u.studentName ? ` · Con: ${u.studentName}` : ''}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                        {linkedDevices.length} thiết bị
                      </div>
                      {linkedDevices.length > 0 && (
                        <div className="mt-1 space-y-1">
                          {linkedDevices.slice(0, 2).map((d) => (
                            <button
                              key={d.id}
                              onClick={() => navigate(`/devices/${d.id}`)}
                              className="block text-indigo-600 dark:text-indigo-400 hover:underline truncate max-w-[180px] cursor-pointer text-left"
                            >
                              {d.studentName || d.name} ({d.currentApp || 'Online'})
                            </button>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`font-semibold ${
                          u.approvalStatus === 'APPROVED'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : u.approvalStatus === 'PENDING'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {getApprovalLabel(u.approvalStatus)}
                      </span>
                      {u.approvedBy && (
                        <div className="text-slate-400 mt-0.5">Bởi: {u.approvedBy}</div>
                      )}
                    </td>

                    {isAdmin && (
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {u.role !== 'ADMIN' && u.approvalStatus !== 'APPROVED' && (
                            <button
                              onClick={() => handleApproval(u.id, 'APPROVED')}
                              className="py-1.5 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer whitespace-nowrap"
                            >
                              Duyệt
                            </button>
                          )}
                          {u.role !== 'ADMIN' && u.approvalStatus === 'APPROVED' && (
                            <button
                              onClick={() => handleApproval(u.id, 'PENDING')}
                              className="py-1.5 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-500 hover:text-white font-semibold cursor-pointer whitespace-nowrap"
                            >
                              Tạm khóa
                            </button>
                          )}
                          <button
                            onClick={() => openPasswordModal(u)}
                            className="p-1.5 rounded-lg border border-indigo-200 dark:border-indigo-800/80 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 cursor-pointer"
                            title="Đổi / Đặt lại mật khẩu tài khoản"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => openEditUser(u)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Chỉnh sửa trường/lớp/vai trò"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {u.id !== currentUser?.id && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 cursor-pointer"
                              title="Xóa tài khoản"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal (Admin Only) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Cấp Tài Khoản Giáo Viên / Phụ Huynh Mới
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Chọn vị trí tài khoản
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['TEACHER', 'PARENT', 'ADMIN'] as const).map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setNewRole(r)}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold cursor-pointer ${
                        newRole === r
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {r === 'TEACHER' ? 'Giáo viên' : r === 'PARENT' ? 'Phụ huynh' : 'Admin'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="VD: Cô Lê Thu Trang / PH Nguyễn Văn An"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email đăng nhập
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@school.edu.vn"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Mật khẩu khởi tạo
                  </label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Trường học đăng ký
                  </label>
                  <input
                    type="text"
                    required
                    value={newSchool}
                    onChange={(e) => setNewSchool(e.target.value)}
                    placeholder="VD: THPT Chuyên Lê Hồng Phong"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Lớp chủ nhiệm / Lớp học
                  </label>
                  <input
                    type="text"
                    value={newClass}
                    onChange={(e) => setNewClass(e.target.value)}
                    placeholder="VD: 10A1"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              {newRole === 'PARENT' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Họ tên con (Học sinh)
                  </label>
                  <input
                    type="text"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="VD: Nguyễn Minh Khôi"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  disabled={isCreatingAccount}
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreatingAccount}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-70 text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center justify-center gap-2 transition"
                >
                  {isCreatingAccount ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang cấp & lưu Neon...</span>
                    </>
                  ) : (
                    <span>Cấp Tài Khoản & Lưu Neon</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal (Admin Only) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Chỉnh Sửa Tài Khoản: {editingUser.name}
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Vị trí (Vai trò)
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                >
                  <option value="TEACHER">Giáo viên chủ nhiệm</option>
                  <option value="PARENT">Phụ huynh học sinh</option>
                  <option value="ADMIN">Admin tối thượng</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Trường học (Giáo viên sẽ thấy tất cả học sinh cùng trường này)
                </label>
                <input
                  type="text"
                  value={editSchool}
                  onChange={(e) => setEditSchool(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Lớp chủ nhiệm / Lớp học
                </label>
                <input
                  type="text"
                  value={editClass}
                  onChange={(e) => setEditClass(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                />
              </div>

              {editRole === 'PARENT' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Họ tên con (Học sinh)
                  </label>
                  <input
                    type="text"
                    value={editStudentName}
                    onChange={(e) => setEditStudentName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Đổi Mật Khẩu (Để trống nếu giữ nguyên)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Tối thiểu 6 ký tự</span>
                </label>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu mới nếu muốn đổi..."
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Reset / Change Password Modal (Admin) */}
      {passwordModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                    Đặt Lại Mật Khẩu (MK)
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono truncate max-w-[240px]">
                    {passwordModalUser.email}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPasswordModalUser(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4">
              <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs text-indigo-950 dark:text-indigo-200">
                <div className="font-semibold mb-1">
                  Đang đổi mật khẩu cho: <strong className="text-indigo-600 dark:text-indigo-400">{passwordModalUser.name}</strong>
                </div>
                <div className="text-[11px] text-indigo-700/80 dark:text-indigo-300/80">
                  Vai trò: <span className="font-mono">{getRoleName(passwordModalUser.role)}</span> · Tài khoản sẽ sử dụng mật khẩu mới này để đăng nhập ngay lập tức.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    required
                    placeholder="Nhập ít nhất 6 ký tự..."
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPasswordText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Quick Password Suggestions */}
              <div>
                <div className="text-[11px] font-semibold text-slate-500 mb-1.5">
                  Mật khẩu gợi ý (Bấm để điền nhanh):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {['admin123', 'Admin@2026', '12345678', 'School@2026'].map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => setNewPasswordInput(sample)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950/60 border border-slate-200 dark:border-slate-700 text-[11px] font-mono font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition cursor-pointer"
                    >
                      {sample}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const rand = 'Dm#' + Math.random().toString(36).substring(2, 8).toUpperCase() + '!';
                      setNewPasswordInput(rand);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition cursor-pointer"
                  >
                    🎲 Tạo ngẫu nhiên
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{isUpdatingPassword ? 'Đang cập nhật...' : 'Xác nhận đổi MK'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
