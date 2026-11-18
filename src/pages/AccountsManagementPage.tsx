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
  ShieldCheck,
  X,
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

  // Inline confirmation state replacing window.confirm
  const [confirmAction, setConfirmAction] = useState<{
    type: 'DELETE_USER' | 'CLEAR_NON_ADMIN' | 'CLEAR_SYSTEM';
    targetUser?: User;
  } | null>(null);
  const [isConfirmRunning, setIsConfirmRunning] = useState(false);

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
    const [res] = await Promise.all([
      api.updateUserApproval(userId, approvalStatus),
      new Promise((r) => setTimeout(r, 400)),
    ]);
    setApprovingUserId(null);

    if (res.success) {
      showToast(
        approvalStatus === 'APPROVED'
          ? 'Đã duyệt tài khoản và đồng bộ vào Neon PostgreSQL'
          : 'Đã cập nhật trạng thái phê duyệt trên Neon PostgreSQL'
      );
      loadData();
    } else {
      showToast(res.message || 'Lỗi cập nhật trạng thái');
    }
  };

  const executeConfirmAction = async () => {
    if (!confirmAction) return;
    setIsConfirmRunning(true);
    try {
      if (confirmAction.type === 'DELETE_USER' && confirmAction.targetUser) {
        const res = await api.deleteUserByAdmin(confirmAction.targetUser.id);
        if (res.success) {
          showToast(res.message || `Đã xóa tài khoản ${confirmAction.targetUser.name} khỏi Neon PostgreSQL`);
          await loadData();
        }
      } else if (confirmAction.type === 'CLEAR_NON_ADMIN') {
        const res = await api.clearAllNonAdminUsers();
        if (res.success) {
          showToast(res.message || 'Đã làm trống toàn bộ tài khoản phụ thành công');
          await loadData();
        } else {
          showToast(res.message || 'Lỗi khi làm trống tài khoản');
        }
      } else if (confirmAction.type === 'CLEAR_SYSTEM') {
        const res = await api.clearAllSystemData();
        if (res.success) {
          showToast(res.message || 'Đã làm trống tất cả dữ liệu hệ thống thành công');
          await loadData();
        } else {
          showToast(res.message || 'Lỗi khi làm trống dữ liệu');
        }
      }
    } finally {
      setIsConfirmRunning(false);
      setConfirmAction(null);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim() || !newPassword.trim()) return;

    setIsCreatingAccount(true);
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
      new Promise((r) => setTimeout(r, 400)),
    ]);
    setIsCreatingAccount(false);

    if (res.success) {
      showToast(
        newRole === 'TEACHER'
          ? `Đã cấp tài khoản giáo viên "${newName.trim()}" và lưu vào Neon PostgreSQL`
          : `Đã tạo tài khoản "${newName.trim()}" và lưu vào Neon PostgreSQL`
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
    <div className="space-y-6 animate-page-enter">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">
            {isAdmin
              ? 'Quản trị tài khoản và phê duyệt'
              : `Danh sách giáo viên và phụ huynh trường ${currentUser?.schoolName || ''}`}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {isAdmin
              ? 'Quản lý tài khoản giáo viên, phụ huynh, phê duyệt đăng ký mới và phân bổ thiết bị'
              : 'Giáo viên chủ nhiệm theo dõi các tài khoản phụ huynh và học sinh đăng ký cùng trường'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="h-10 w-10 rounded-[var(--radius-control)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] transition-[color,background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] flex items-center justify-center cursor-pointer"
            title="Làm mới"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
          </button>
          {isAdmin && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="h-10 px-4 rounded-[var(--radius-control)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] font-medium text-xs flex items-center gap-2 transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-4 h-4" strokeWidth={1.5} />
              <span>Cấp tài khoản mới</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin Security Quick Panel */}
      {isAdmin && (
        <div className="p-5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-control)] bg-[var(--accent-soft)] text-[var(--accent-ink)] border border-[var(--accent-border)] flex items-center justify-center shrink-0">
              <KeyRound className="w-4 h-4" strokeWidth={1.5} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-sm text-[var(--text-primary)]">
                  Quản lý mật khẩu và làm sạch dữ liệu
                </span>
                <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-mono font-medium bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success-border)]">
                  Phân quyền Admin
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Đổi mật khẩu quản trị viên, đặt lại mật khẩu giáo viên và phụ huynh hoặc dọn dữ liệu hệ thống.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setConfirmAction({ type: 'CLEAR_SYSTEM' })}
              className="h-9 px-3 rounded-[var(--radius-control)] bg-[var(--danger-soft)] hover:bg-[#A82834] text-[var(--danger)] hover:text-white border border-[var(--danger-border)] font-medium text-xs flex items-center gap-2 transition-[color,background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer whitespace-nowrap"
              title="Làm trống tất cả thiết bị, dữ liệu định vị và tài khoản phụ"
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
              <span>Làm trống tất cả dữ liệu</span>
            </button>
            {users.some((u) => u.role !== 'ADMIN') && (
              <button
                onClick={() => setConfirmAction({ type: 'CLEAR_NON_ADMIN' })}
                className="h-9 px-3 rounded-[var(--radius-control)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border-strong)] text-xs font-medium flex items-center gap-2 transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer whitespace-nowrap"
                title="Xóa toàn bộ tài khoản giáo viên và phụ huynh"
              >
                <Users className="w-4 h-4" strokeWidth={1.5} />
                <span>Làm trống tài khoản phụ</span>
              </button>
            )}
            <button
              onClick={() => {
                if (currentUser) openPasswordModal(currentUser);
              }}
              className="h-9 px-4 rounded-[var(--radius-control)] bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] font-medium text-xs flex items-center gap-2 transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] cursor-pointer whitespace-nowrap"
            >
              <KeyRound className="w-4 h-4" strokeWidth={1.5} />
              <span>Đổi mật khẩu Admin</span>
            </button>
          </div>
        </div>
      )}

      {/* Inline Confirmation Bar for Destructive Actions */}
      {confirmAction && (
        <div className="p-4 rounded-[var(--radius-card)] bg-[var(--danger-soft)] border border-[var(--danger-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <span className="font-medium text-[var(--danger)]">
            {confirmAction.type === 'DELETE_USER' && confirmAction.targetUser
              ? `Xác nhận xóa tài khoản "${confirmAction.targetUser.name}" khỏi hệ thống và Neon PostgreSQL?`
              : confirmAction.type === 'CLEAR_NON_ADMIN'
              ? 'Xác nhận xóa toàn bộ tài khoản giáo viên và phụ huynh khỏi hệ thống?'
              : 'Cảnh báo: Xác nhận xóa toàn bộ thiết bị, lịch sử GPS, báo cáo ứng dụng và tài khoản phụ (chỉ giữ lại Admin)?'}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setConfirmAction(null)}
              disabled={isConfirmRunning}
              className="h-8 px-3 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border-strong)] text-[var(--text-primary)] font-medium cursor-pointer"
            >
              Hủy
            </button>
            <button
              onClick={executeConfirmAction}
              disabled={isConfirmRunning}
              className="h-8 px-3 rounded-[var(--radius-control)] bg-[#A82834] text-white font-medium cursor-pointer disabled:opacity-50"
            >
              {isConfirmRunning ? 'Đang xử lý' : 'Xác nhận thực hiện'}
            </button>
          </div>
        </div>
      )}

      {feedbackMsg && (
        <div className="p-4 rounded-[var(--radius-card)] bg-[var(--success-soft)] border border-[var(--success-border)] text-[var(--success)] text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={1.5} />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)]">
          <div className="text-xs font-medium text-[var(--text-secondary)]">Tổng số tài khoản</div>
          <div className="mt-2 text-2xl font-semibold text-[var(--text-primary)] font-mono tabular-nums">
            {users.length}
          </div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">Toàn hệ thống</div>
        </div>

        <div className="p-5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)]">
          <div className="text-xs font-medium text-[var(--text-secondary)]">Tài khoản giáo viên</div>
          <div className="mt-2 text-2xl font-semibold text-[var(--accent-ink)] font-mono tabular-nums">
            {teacherCount}
          </div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">Theo dõi học sinh cùng trường</div>
        </div>

        <div className="p-5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)]">
          <div className="text-xs font-medium text-[var(--text-secondary)]">Tài khoản phụ huynh</div>
          <div className="mt-2 text-2xl font-semibold text-[var(--success)] font-mono tabular-nums">
            {parentCount}
          </div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">Quản lý thiết bị con em</div>
        </div>

        <div className="p-5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)]">
          <div className="text-xs font-medium text-[var(--text-secondary)]">Đang chờ duyệt</div>
          <div className="mt-2 text-2xl font-semibold text-[var(--warning)] font-mono tabular-nums">
            {pendingUsers.length}
          </div>
          <div className="mt-1 text-xs text-[var(--text-muted)]">Yêu cầu từ giáo viên và phụ huynh</div>
        </div>
      </div>

      {/* Neon PostgreSQL & Storage Engine Live Status Card */}
      <div className="p-5 rounded-[var(--radius-card)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-card)] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[var(--radius-control)] bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success-border)] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-sm text-[var(--text-primary)]">
                Lưu trữ cơ sở dữ liệu Neon PostgreSQL
              </span>
              <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-mono font-medium bg-[var(--success-soft)] text-[var(--success)] border border-[var(--success-border)]">
                {dbStats?.isNeonConnected ? 'Đã kết nối Neon PostgreSQL' : 'Cơ sở dữ liệu cục bộ sẵn sàng'}
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Tài khoản đăng ký, tài khoản cấp mới và toàn bộ thiết bị được đồng bộ lên cơ sở dữ liệu.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono tabular-nums shrink-0">
          <div className="px-3 py-2 rounded-[var(--radius-control)] bg-[var(--surface-muted)] border border-[var(--border)]">
            <span className="text-[var(--text-muted)] block text-[11px] font-sans">Tài khoản</span>
            <strong className="font-semibold text-[var(--text-primary)] text-sm">
              {dbStats?.neonUsersCount ?? users.length}
            </strong>
          </div>
          <div className="px-3 py-2 rounded-[var(--radius-control)] bg-[var(--surface-muted)] border border-[var(--border)]">
            <span className="text-[var(--text-muted)] block text-[11px] font-sans">Thiết bị</span>
            <strong className="font-semibold text-[var(--success)] text-sm">
              {dbStats?.neonDevicesCount ?? devices.length}
            </strong>
          </div>
        </div>
      </div>

      {/* Pending Approval Section for Admin */}
      {isAdmin && pendingUsers.length > 0 && (
        <div className="bg-[var(--warning-soft)] rounded-[var(--radius-card)] border border-[var(--warning-border)] p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-base text-[var(--text-primary)] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--warning)]" strokeWidth={1.5} />
                <span>
                  Tài khoản chờ Admin duyệt (<span className="font-mono tabular-nums">{pendingUsers.length}</span>)
                </span>
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                Tài khoản giáo viên và phụ huynh mới đăng ký cần được duyệt trước khi truy cập dữ liệu học sinh
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingUsers.map((u) => (
              <div
                key={u.id}
                className="p-4 rounded-[var(--radius-control)] bg-[var(--surface)] border border-[var(--border)] flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-sm text-[var(--text-primary)]">
                      {u.name}
                    </span>
                    <span className="text-xs font-medium text-[var(--warning)]">
                      {getRoleName(u.role)}
                    </span>
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">
                    Email: <span className="font-mono">{u.email}</span>
                    {u.phone ? ` · SĐT: ${u.phone}` : ''}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] mt-1">
                    Trường: <strong className="font-medium text-[var(--text-primary)]">{u.schoolName || 'Chưa cập nhật'}</strong>
                    {u.className ? ` · Lớp: ${u.className}` : ''}
                    {u.studentName ? ` · Phụ huynh em: ${u.studentName}` : ''}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-[var(--border)]">
                  <button
                    onClick={() => handleApproval(u.id, 'APPROVED')}
                    disabled={approvingUserId === u.id}
                    className="flex-1 h-9 px-3 rounded-[var(--radius-control)] bg-[var(--success-soft)] hover:bg-[#1B6E47] text-[var(--success)] hover:text-white border border-[var(--success-border)] disabled:opacity-60 text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-[color,background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)]"
                  >
                    {approvingUserId === u.id ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                        <span>Đang duyệt</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                        <span>Duyệt tài khoản</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleApproval(u.id, 'REJECTED')}
                    disabled={approvingUserId === u.id}
                    className="h-9 px-3 rounded-[var(--radius-control)] bg-[var(--danger-soft)] hover:bg-[#A82834] text-[var(--danger)] hover:text-white border border-[var(--danger-border)] disabled:opacity-60 text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-[color,background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)]"
                  >
                    <XCircle className="w-4 h-4" strokeWidth={1.5} />
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
          <Search
            className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
            strokeWidth={1.5}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo họ tên, email, trường học hoặc tên học sinh"
            className="w-full h-10 pl-9 pr-4 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-[var(--surface-muted)] rounded-[var(--radius-control)] border border-[var(--border)]">
            {[
              { key: 'ALL', label: 'Tất cả vị trí' },
              { key: 'TEACHER', label: 'Giáo viên' },
              { key: 'PARENT', label: 'Phụ huynh' },
              { key: 'ADMIN', label: 'Admin' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setRoleFilter(tab.key as any)}
                className={`h-8 px-3 rounded-[6px] text-xs font-medium transition-[color,background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] whitespace-nowrap cursor-pointer ${
                  roleFilter === tab.key
                    ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-card)]'
                    : 'text-[var(--text-secondary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs font-medium text-[var(--text-primary)]"
          >
            <option value="ALL">Mọi trạng thái duyệt</option>
            <option value="APPROVED">Đã được Admin duyệt</option>
            <option value="PENDING">Đang chờ duyệt</option>
            <option value="REJECTED">Đã từ chối</option>
          </select>
        </div>
      </div>

      {/* Main Accounts Table */}
      <div className="bg-[var(--surface)] rounded-[var(--radius-card)] border border-[var(--border)] shadow-[var(--shadow-card)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[var(--surface-muted)]/60 text-[var(--text-secondary)] font-medium border-b border-[var(--border)]">
              <tr>
                <th className="py-3 px-6">Tài khoản và liên hệ</th>
                <th className="py-3 px-6">Vai trò</th>
                <th className="py-3 px-6">Trường học và lớp</th>
                <th className="py-3 px-6">Thiết bị theo dõi</th>
                <th className="py-3 px-6">Trạng thái duyệt</th>
                {isAdmin && <th className="py-3 px-6 text-right">Thao tác Admin</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {filteredUsers.map((u) => {
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
                    className="hover:bg-[var(--surface-muted)]/40 transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)]"
                  >
                    <td className="py-4 px-6">
                      <div className="font-semibold text-sm text-[var(--text-primary)]">
                        {u.name}
                      </div>
                      <div className="text-[var(--text-secondary)] font-mono mt-1">{u.email}</div>
                      {u.phone && (
                        <div className="text-[var(--text-muted)] font-mono mt-1">
                          SĐT: {u.phone}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-medium text-[var(--text-primary)]">
                        {getRoleName(u.role)}
                      </div>
                      <div className="text-[var(--text-muted)] mt-1">
                        {u.role === 'ADMIN'
                          ? 'Toàn quyền hệ thống'
                          : u.role === 'TEACHER'
                          ? 'Theo dõi học sinh cùng trường'
                          : 'Theo dõi con của mình'}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-medium text-[var(--text-primary)]">
                        {u.schoolName || 'Chưa gán trường'}
                      </div>
                      <div className="text-[var(--text-secondary)] mt-1">
                        {u.className ? `Lớp: ${u.className}` : ''}
                        {u.studentName ? ` · Con: ${u.studentName}` : ''}
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <div className="font-mono tabular-nums font-semibold text-[var(--text-primary)]">
                        {linkedDevices.length} thiết bị
                      </div>
                      {linkedDevices.length > 0 && (
                        <div className="mt-1 space-y-1">
                          {linkedDevices.slice(0, 2).map((d) => (
                            <button
                              key={d.id}
                              onClick={() => navigate(`/devices/${d.id}`)}
                              className="block text-[var(--accent-ink)] hover:underline truncate max-w-[180px] cursor-pointer text-left"
                            >
                              {d.studentName || d.name} ({d.currentApp || 'Online'})
                            </button>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`font-medium ${
                          u.approvalStatus === 'APPROVED'
                            ? 'text-[var(--success)]'
                            : u.approvalStatus === 'PENDING'
                            ? 'text-[var(--warning)]'
                            : 'text-[var(--danger)]'
                        }`}
                      >
                        {getApprovalLabel(u.approvalStatus)}
                      </span>
                      {u.approvedBy && (
                        <div className="text-[var(--text-muted)] mt-1">Bởi: {u.approvedBy}</div>
                      )}
                    </td>

                    {isAdmin && (
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {u.role !== 'ADMIN' && u.approvalStatus !== 'APPROVED' && (
                            <button
                              onClick={() => handleApproval(u.id, 'APPROVED')}
                              className="h-8 px-3 rounded-[var(--radius-control)] bg-[var(--success-soft)] hover:bg-[#1B6E47] text-[var(--success)] hover:text-white border border-[var(--success-border)] font-medium cursor-pointer whitespace-nowrap transition-[color,background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)]"
                            >
                              Duyệt
                            </button>
                          )}
                          {u.role !== 'ADMIN' && u.approvalStatus === 'APPROVED' && (
                            <button
                              onClick={() => handleApproval(u.id, 'PENDING')}
                              className="h-8 px-3 rounded-[var(--radius-control)] bg-[var(--surface-muted)] hover:bg-[var(--warning-soft)] text-[var(--text-primary)] hover:text-[var(--warning)] border border-[var(--border)] font-medium cursor-pointer whitespace-nowrap transition-[color,background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)]"
                            >
                              Tạm khóa
                            </button>
                          )}
                          <button
                            onClick={() => openPasswordModal(u)}
                            className="h-8 w-8 rounded-[var(--radius-control)] border border-[var(--accent-border)] text-[var(--accent-ink)] hover:bg-[var(--accent-soft)] flex items-center justify-center cursor-pointer transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)]"
                            title="Đổi / Đặt lại mật khẩu tài khoản"
                          >
                            <KeyRound className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                          <button
                            onClick={() => openEditUser(u)}
                            className="h-8 w-8 rounded-[var(--radius-control)] border border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] flex items-center justify-center cursor-pointer transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)]"
                            title="Chỉnh sửa trường/lớp/vai trò"
                          >
                            <Edit2 className="w-4 h-4" strokeWidth={1.5} />
                          </button>
                          {u.id !== currentUser?.id && (
                            <button
                              onClick={() => setConfirmAction({ type: 'DELETE_USER', targetUser: u })}
                              className="h-8 w-8 rounded-[var(--radius-control)] border border-[var(--danger-border)] text-[var(--danger)] hover:bg-[var(--danger-soft)] flex items-center justify-center cursor-pointer transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)]"
                              title="Xóa tài khoản"
                            >
                              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--surface-overlay)]">
          <div className="w-full max-w-md bg-[var(--surface)] rounded-[var(--radius-panel)] border border-[var(--border-strong)] shadow-[var(--shadow-elevated)] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h3 className="font-semibold text-base text-[var(--text-primary)]">
                Cấp tài khoản giáo viên và phụ huynh
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Chọn vị trí tài khoản
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['TEACHER', 'PARENT', 'ADMIN'] as const).map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setNewRole(r)}
                      className={`h-9 px-3 rounded-[var(--radius-control)] border text-xs font-medium cursor-pointer transition-[color,background-color,border-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${
                        newRole === r
                          ? 'bg-[var(--accent-soft)] text-[var(--accent-ink)] border-[var(--accent-border)]'
                          : 'border-[var(--border-strong)] text-[var(--text-secondary)] hover:bg-[var(--surface-muted)]'
                      }`}
                    >
                      {r === 'TEACHER' ? 'Giáo viên' : r === 'PARENT' ? 'Phụ huynh' : 'Admin'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="VD: Cô Lê Thu Trang"
                  className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Email đăng nhập
                  </label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@school.edu.vn"
                    className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Mật khẩu khởi tạo
                  </label>
                  <input
                    type="text"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs font-mono text-[var(--text-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Trường học đăng ký
                  </label>
                  <input
                    type="text"
                    required
                    value={newSchool}
                    onChange={(e) => setNewSchool(e.target.value)}
                    placeholder="VD: THPT Chuyên Lê Hồng Phong"
                    className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Lớp chủ nhiệm / Lớp học
                  </label>
                  <input
                    type="text"
                    value={newClass}
                    onChange={(e) => setNewClass(e.target.value)}
                    placeholder="VD: 10A1"
                    className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)]"
                  />
                </div>
              </div>

              {newRole === 'PARENT' && (
                <div>
                  <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                    Họ tên học sinh
                  </label>
                  <input
                    type="text"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                    placeholder="VD: Nguyễn Minh Khôi"
                    className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)]"
                  />
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  disabled={isCreatingAccount}
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 h-10 border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs font-medium text-[var(--text-primary)] cursor-pointer disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isCreatingAccount}
                  className="flex-1 h-10 bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] disabled:opacity-70 text-[var(--btn-primary-text)] rounded-[var(--radius-control)] text-xs font-medium cursor-pointer flex items-center justify-center gap-2 transition-[background-color,opacity] duration-[var(--duration-fast)] ease-[var(--ease-standard)]"
                >
                  {isCreatingAccount ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                      <span>Đang lưu</span>
                    </>
                  ) : (
                    <span>Cấp tài khoản và lưu Neon</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal (Admin Only) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--surface-overlay)]">
          <div className="w-full max-w-md bg-[var(--surface)] rounded-[var(--radius-panel)] border border-[var(--border-strong)] shadow-[var(--shadow-elevated)] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
              <h3 className="font-semibold text-base text-[var(--text-primary)]">
                Chỉnh sửa tài khoản: {editingUser.name}
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleSaveEditUser} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Vai trò tài khoản
                </label>
                <select
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value as UserRole)}
                  className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)]"
                >
                  <option value="TEACHER">Giáo viên chủ nhiệm</option>
                  <option value="PARENT">Phụ huynh học sinh</option>
                  <option value="ADMIN">Admin tối thượng</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Trường học (Giáo viên theo dõi học sinh cùng trường)
                </label>
                <input
                  type="text"
                  value={editSchool}
                  onChange={(e) => setEditSchool(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Lớp chủ nhiệm / Lớp học
                </label>
                <input
                  type="text"
                  value={editClass}
                  onChange={(e) => setEditClass(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs text-[var(--text-primary)]"
                />
              </div>

              {editRole === 'PARENT' && (
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
              )}

              <div className="pt-2 border-t border-[var(--border)]">
                <label className="text-xs font-medium text-[var(--text-secondary)] mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-[var(--accent-ink)]" strokeWidth={1.5} />
                    <span>Đổi mật khẩu (để trống nếu giữ nguyên)</span>
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] font-normal">
                    Tối thiểu 6 ký tự
                  </span>
                </label>
                <input
                  type="password"
                  placeholder="Nhập mật khẩu mới nếu muốn đổi"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full h-10 px-3 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs font-mono text-[var(--text-primary)]"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="flex-1 h-10 border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs font-medium text-[var(--text-primary)] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 h-10 bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-[var(--btn-primary-text)] rounded-[var(--radius-control)] text-xs font-medium cursor-pointer transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--surface-overlay)]">
          <div className="w-full max-w-md bg-[var(--surface)] rounded-[var(--radius-panel)] border border-[var(--border-strong)] shadow-[var(--shadow-elevated)] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)] bg-[var(--surface-muted)]/60">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-[var(--radius-control)] bg-[var(--accent-soft)] text-[var(--accent-ink)] flex items-center justify-center">
                  <KeyRound className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-[var(--text-primary)]">
                    Đặt lại mật khẩu tài khoản
                  </h3>
                  <div className="text-[11px] text-[var(--text-muted)] font-mono truncate max-w-[240px]">
                    {passwordModalUser.email}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setPasswordModalUser(null)}
                className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-[6px] cursor-pointer"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4">
              <div className="p-3 rounded-[var(--radius-control)] bg-[var(--accent-soft)] border border-[var(--accent-border)] text-xs text-[var(--text-primary)]">
                <div className="font-medium mb-1">
                  Đang đổi mật khẩu cho{' '}
                  <strong className="font-semibold text-[var(--accent-ink)]">
                    {passwordModalUser.name}
                  </strong>
                </div>
                <div className="text-[11px] text-[var(--text-secondary)]">
                  Vai trò: <span className="font-mono">{getRoleName(passwordModalUser.role)}</span> · Mật khẩu mới có hiệu lực ngay lập tức.
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
                    <Lock className="w-4 h-4" strokeWidth={1.5} />
                  </div>
                  <input
                    type={showPasswordText ? 'text' : 'password'}
                    required
                    placeholder="Nhập ít nhất 6 ký tự"
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="w-full h-10 pl-9 pr-9 bg-[var(--surface)] border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs font-mono text-[var(--text-primary)]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordText(!showPasswordText)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  >
                    {showPasswordText ? (
                      <EyeOff className="w-4 h-4" strokeWidth={1.5} />
                    ) : (
                      <Eye className="w-4 h-4" strokeWidth={1.5} />
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Password Suggestions */}
              <div>
                <div className="text-[11px] font-medium text-[var(--text-secondary)] mb-2">
                  Gợi ý nhanh
                </div>
                <div className="flex flex-wrap gap-2">
                  {['admin123', 'Admin@2026', '12345678', 'School@2026'].map((sample) => (
                    <button
                      key={sample}
                      type="button"
                      onClick={() => setNewPasswordInput(sample)}
                      className="h-8 px-3 rounded-[var(--radius-control)] bg-[var(--surface-muted)] hover:bg-[var(--surface-hover)] border border-[var(--border)] text-[11px] font-mono text-[var(--text-primary)] cursor-pointer transition-[background-color] duration-[var(--duration-fast)] ease-[var(--ease-standard)]"
                    >
                      {sample}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const rand = 'Dm#' + Math.random().toString(36).substring(2, 8).toUpperCase() + '@';
                      setNewPasswordInput(rand);
                    }}
                    className="h-8 px-3 rounded-[var(--radius-control)] bg-[var(--accent-soft)] border border-[var(--accent-border)] text-[11px] font-medium text-[var(--accent-ink)] hover:opacity-90 cursor-pointer"
                  >
                    Tạo ngẫu nhiên
                  </button>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border)] flex gap-2">
                <button
                  type="button"
                  onClick={() => setPasswordModalUser(null)}
                  className="flex-1 h-10 border border-[var(--border-strong)] rounded-[var(--radius-control)] text-xs font-medium text-[var(--text-primary)] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingPassword}
                  className="flex-1 h-10 bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] disabled:opacity-50 text-[var(--btn-primary-text)] rounded-[var(--radius-control)] text-xs font-medium flex items-center justify-center gap-2 cursor-pointer transition-[background-color,opacity] duration-[var(--duration-fast)] ease-[var(--ease-standard)]"
                >
                  <KeyRound className="w-4 h-4" strokeWidth={1.5} />
                  <span>{isUpdatingPassword ? 'Đang cập nhật' : 'Xác nhận đổi mật khẩu'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
