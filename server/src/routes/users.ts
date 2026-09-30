import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { dbService } from '../db/db.ts';
import {
  requireAuth,
  requireApproved,
  requireAdmin,
  AuthenticatedRequest,
} from '../middleware/auth.ts';
import { ApprovalStatus, UserRecord, UserRole } from '../types/index.ts';

const router = Router();

router.use(requireAuth);
router.use(requireApproved);

// GET /api/users - Admin sees all accounts; Teacher sees accounts in their school
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const caller = req.user!;
    if (caller.role === 'ADMIN') {
      const users = await dbService.getAllUsers();
      return res.json({
        success: true,
        data: users,
      });
    }

    if (caller.role === 'TEACHER') {
      const users = await dbService.getUsersBySchool(caller.schoolName || '');
      return res.json({
        success: true,
        data: users,
      });
    }

    // Parent only sees themselves
    const me = await dbService.findUserById(caller.userId);
    if (!me) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
    }
    const { passwordHash, ...safeMe } = me;
    return res.json({
      success: true,
      data: [{ ...safeMe, deviceCount: 0 }],
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể tải danh sách tài khoản',
    });
  }
});

// POST /api/users - Admin creates a new account directly (Teacher, Parent, or Admin)
router.post('/', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { name, email, password, role, schoolName, className, studentName, phone, approvalStatus } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập đầy đủ Họ tên, Email và Mật khẩu',
      });
    }

    const normEmail = String(email).trim().toLowerCase();
    const existing = await dbService.findUserByEmail(normEmail);
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã tồn tại trong hệ thống',
      });
    }

    const validRoles: UserRole[] = ['ADMIN', 'TEACHER', 'PARENT'];
    const finalRole: UserRole = validRoles.includes(role) ? role : 'TEACHER';
    const finalApproval: ApprovalStatus =
      approvalStatus && ['APPROVED', 'PENDING', 'REJECTED'].includes(approvalStatus)
        ? approvalStatus
        : 'APPROVED';

    const passwordHash = await bcrypt.hash(String(password), 10);
    const nowIso = new Date().toISOString();

    const newUser: UserRecord = {
      id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      name: String(name).trim(),
      email: normEmail,
      passwordHash,
      role: finalRole,
      approvalStatus: finalApproval,
      schoolName: schoolName ? String(schoolName).trim() : undefined,
      className: className ? String(className).trim() : undefined,
      studentName: studentName ? String(studentName).trim() : undefined,
      phone: phone ? String(phone).trim() : undefined,
      approvedBy: req.user!.name,
      approvedAt: nowIso,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    await dbService.createUser(newUser);
    const { passwordHash: _, ...safeUser } = newUser;

    return res.status(201).json({
      success: true,
      message: `Đã tạo tài khoản ${finalRole === 'TEACHER' ? 'Giáo viên' : finalRole === 'PARENT' ? 'Phụ huynh' : 'Admin'} thành công`,
      data: { ...safeUser, deviceCount: 0 },
    });
  } catch (error) {
    console.error('Admin create user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi tạo tài khoản mới',
    });
  }
});

// PATCH /api/users/:id/approval - Admin approves or rejects a Teacher / Parent account
router.patch('/:id/approval', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { approvalStatus } = req.body;
    const validStatuses: ApprovalStatus[] = ['APPROVED', 'PENDING', 'REJECTED'];
    if (!validStatuses.includes(approvalStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái phê duyệt không hợp lệ',
      });
    }

    const updated = await dbService.updateUserApproval(req.params.id, approvalStatus, req.user!.name);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản cần duyệt',
      });
    }

    const { passwordHash, ...safeUser } = updated;
    return res.json({
      success: true,
      message:
        approvalStatus === 'APPROVED'
          ? `Đã phê duyệt tài khoản ${updated.name} thành công!`
          : approvalStatus === 'REJECTED'
          ? `Đã từ chối/khóa tài khoản ${updated.name}.`
          : `Đã chuyển tài khoản ${updated.name} về trạng thái chờ duyệt.`,
      data: safeUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật trạng thái duyệt tài khoản',
    });
  }
});

// PATCH /api/users/:id - Admin updates user details (role, schoolName, className, studentName, etc.)
router.patch('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { name, role, schoolName, className, studentName, phone, approvalStatus } = req.body;
    const updates: Partial<UserRecord> = {};

    if (name && typeof name === 'string') updates.name = name.trim();
    if (role && ['ADMIN', 'TEACHER', 'PARENT'].includes(role)) updates.role = role as UserRole;
    if (schoolName !== undefined) updates.schoolName = String(schoolName).trim();
    if (className !== undefined) updates.className = String(className).trim();
    if (studentName !== undefined) updates.studentName = String(studentName).trim();
    if (phone !== undefined) updates.phone = String(phone).trim();
    if (approvalStatus && ['APPROVED', 'PENDING', 'REJECTED'].includes(approvalStatus)) {
      updates.approvalStatus = approvalStatus as ApprovalStatus;
      updates.approvedBy = req.user!.name;
      updates.approvedAt = new Date().toISOString();
    }

    const updated = await dbService.updateUser(req.params.id, updates);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản',
      });
    }

    const { passwordHash, ...safeUser } = updated;
    return res.json({
      success: true,
      message: 'Cập nhật thông tin tài khoản thành công',
      data: safeUser,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật tài khoản',
    });
  }
});

// DELETE /api/users/:id - Admin deletes an account
router.delete('/:id', requireAdmin, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    if (req.params.id === req.user!.userId) {
      return res.status(400).json({
        success: false,
        message: 'Bạn không thể tự xóa tài khoản Admin đang đăng nhập',
      });
    }

    const deleted = await dbService.deleteUser(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản để xóa',
      });
    }

    return res.json({
      success: true,
      message: 'Đã xóa tài khoản và dữ liệu liên quan khỏi hệ thống',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi xóa tài khoản',
    });
  }
});

export default router;
