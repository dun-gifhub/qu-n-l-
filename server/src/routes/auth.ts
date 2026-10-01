import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { dbService } from '../db/db.ts';
import { generateToken, requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';
import { UserRecord, UserRole } from '../types/index.ts';

const router = Router();

function formatSafeUser(user: UserRecord) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role || 'PARENT',
    approvalStatus: user.approvalStatus || 'APPROVED',
    schoolName: user.schoolName,
    className: user.className,
    studentName: user.studentName,
    phone: user.phone,
    approvedBy: user.approvedBy,
    approvedAt: user.approvedAt,
    createdAt: user.createdAt,
  };
}

// POST /api/auth/register
router.post('/register', async (req, res): Promise<any> => {
  try {
    const {
      name,
      email,
      password,
      confirmPassword,
      role,
      schoolName,
      className,
      studentName,
      phone,
    } = req.body;
    const errors: Record<string, string> = {};

    const cleanName = (typeof name === 'string' ? name : '')
      .trim()
      .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '');
    if (!cleanName || cleanName.length === 0) {
      errors.name = 'Họ và tên không được để trống';
    }

    let rawEmail = (typeof email === 'string' ? email : '')
      .trim()
      .toLowerCase()
      .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '');
    let cleanPhone = (typeof phone === 'string' ? phone : '')
      .trim()
      .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '');

    // Support phone number input directly in the email field (frequent on mobile phones in Vietnam)
    const isPhoneNumber = /^(\+?84|0)?[0-9]{8,12}$/.test(rawEmail.replace(/[\s.-]/g, ''));
    if (isPhoneNumber && !rawEmail.includes('@')) {
      const digits = rawEmail.replace(/\D/g, '');
      if (!cleanPhone) {
        cleanPhone = rawEmail;
      }
      rawEmail = `${digits}@phone.devicemonitor.com`;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!rawEmail || !emailRegex.test(rawEmail)) {
      errors.email = 'Vui lòng nhập Email hoặc Số điện thoại hợp lệ (VD: 0901234567)';
    }

    const cleanPassword = (typeof password === 'string' ? password : '').trim();
    if (!cleanPassword || cleanPassword.length < 6) {
      errors.password = 'Mật khẩu phải chứa ít nhất 6 ký tự';
    }

    // On mobile browsers, autofill often only fills the password field, leaving confirmPassword empty
    const cleanConfirm =
      typeof confirmPassword === 'string' && confirmPassword.trim().length > 0
        ? confirmPassword.trim()
        : cleanPassword;

    if (cleanPassword !== cleanConfirm) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp với mật khẩu';
    }

    const selectedRole: UserRole = role === 'TEACHER' ? 'TEACHER' : 'PARENT';

    // Auto-fallback school name if empty on mobile
    let cleanSchool = (typeof schoolName === 'string' ? schoolName : '').trim();
    if (!cleanSchool) {
      cleanSchool = 'THPT Chuyên Lê Hồng Phong';
    }

    // Auto-fallback student name for parent if empty on mobile so registration is never blocked
    let cleanStudent = (typeof studentName === 'string' ? studentName : '').trim();
    if (selectedRole === 'PARENT' && !cleanStudent) {
      cleanStudent = cleanName ? `Con của ${cleanName}` : 'Học sinh';
    }

    if (Object.keys(errors).length > 0) {
      const firstError = Object.values(errors)[0];
      return res.status(400).json({
        success: false,
        message: firstError || 'Dữ liệu đăng ký không hợp lệ',
        errors,
      });
    }

    // Check if email or phone already registered
    const existingUser =
      (await dbService.findUserByEmailOrPhone(rawEmail)) ||
      (cleanPhone ? await dbService.findUserByEmailOrPhone(cleanPhone) : null);

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: isPhoneNumber
          ? 'Số điện thoại này đã được sử dụng bởi một tài khoản khác'
          : 'Email này đã được sử dụng bởi một tài khoản khác',
        errors: { email: 'Tài khoản đã tồn tại' },
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(cleanPassword, salt);
    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    // First registered account in the system becomes Admin Tối Thượng automatically
    const allUsers = await dbService.getAllUsers();
    const isFirstUser = allUsers.length === 0;

    const finalRole: UserRole = isFirstUser ? 'ADMIN' : selectedRole;
    const finalApproval = isFirstUser ? 'APPROVED' : 'PENDING';

    const newUser: UserRecord = {
      id: userId,
      name: cleanName,
      email: rawEmail,
      passwordHash,
      role: finalRole,
      approvalStatus: finalApproval,
      schoolName: cleanSchool,
      className: className ? String(className).trim() : '10A1',
      studentName: cleanStudent || undefined,
      phone: cleanPhone || undefined,
      approvedBy: isFirstUser ? 'Hệ thống (Admin khởi tạo)' : undefined,
      approvedAt: isFirstUser ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dbService.createUser(newUser);

    return res.status(201).json({
      success: true,
      message: isFirstUser
        ? 'Đăng ký thành công! Đây là tài khoản Quản trị viên (Admin tối thượng) đầu tiên của hệ thống.'
        : selectedRole === 'TEACHER'
        ? 'Đăng ký tài khoản Giáo viên thành công! Tài khoản của bạn đang chờ Admin phê duyệt.'
        : 'Đăng ký tài khoản Phụ huynh thành công! Tài khoản của bạn đang chờ Admin phê duyệt.',
      data: formatSafeUser(newUser),
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra trong quá trình đăng ký. Vui lòng thử lại sau.',
    });
  }
});

// GET /api/auth/admin-info - Public info about configured admin email for login UI
router.get('/admin-info', (_req, res) => {
  const adminEmail = process.env.ADMIN_EMAIL ? process.env.ADMIN_EMAIL.trim().toLowerCase() : 'admin@devicemonitor.com';
  const hasEnvPassword = Boolean(process.env.ADMIN_PASSWORD);
  return res.json({
    success: true,
    data: {
      adminEmail,
      isConfiguredViaEnv: Boolean(process.env.ADMIN_EMAIL || process.env.ADMIN_PASSWORD),
      defaultPasswordHint: hasEnvPassword ? 'Được bảo mật bởi biến môi trường ADMIN_PASSWORD' : 'admin123',
    },
  });
});

// POST /api/auth/login
router.post('/login', async (req, res): Promise<any> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp đầy đủ email và mật khẩu',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await dbService.findUserByEmailOrPhone(email);

    // Check if logging in as Admin using Environment Variables credentials
    const envAdminEmail = (process.env.ADMIN_EMAIL || 'admin@devicemonitor.com').trim().toLowerCase();
    const envAdminPassword = (process.env.ADMIN_PASSWORD || 'admin123').trim();

    if (normalizedEmail === envAdminEmail && password === envAdminPassword) {
      if (!user) {
        // Ensure user is created in database
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(envAdminPassword, salt);
        const nowIso = new Date().toISOString();
        const createdAdmin = {
          id: 'usr_admin_' + Date.now().toString(36),
          name: process.env.ADMIN_NAME?.trim() || 'Quản Trị Viên (Admin)',
          email: envAdminEmail,
          passwordHash,
          role: 'ADMIN' as UserRole,
          approvalStatus: 'APPROVED' as const,
          schoolName: process.env.ADMIN_SCHOOL?.trim() || 'THPT Chuyên Lê Hồng Phong',
          phone: process.env.ADMIN_PHONE?.trim() || '0901234567',
          approvedBy: 'Hệ thống Environment',
          approvedAt: nowIso,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        await dbService.createUser(createdAdmin);
        user = createdAdmin;
      } else if (user.role !== 'ADMIN') {
        await dbService.updateUser(user.id, { role: 'ADMIN', approvalStatus: 'APPROVED' });
        user.role = 'ADMIN';
        user.approvalStatus = 'APPROVED';
      }
    } else {
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không chính xác',
        });
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Email hoặc mật khẩu không chính xác',
        });
      }
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'PARENT',
      schoolName: user.schoolName,
      className: user.className,
      approvalStatus: user.approvalStatus || 'APPROVED',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await dbService.createSession({
      id: 'sess_' + Date.now(),
      userId: user.id,
      token,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      createdAt: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        token,
        user: formatSafeUser(user),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi đăng nhập',
    });
  }
});

// POST /api/auth/forgot-password - Reset password for user
router.post('/forgot-password', async (req, res): Promise<any> => {
  try {
    const { email, newPassword, phone } = req.body;
    if (!email || typeof email !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp email tài khoản cần lấy lại mật khẩu.',
      });
    }

    const normEmail = email.trim().toLowerCase();
    const user = await dbService.findUserByEmailOrPhone(normEmail);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tài khoản với email hoặc số điện thoại này trong hệ thống.',
      });
    }

    if (phone && user.phone && user.phone.replace(/\D/g, '') !== String(phone).replace(/\D/g, '')) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại xác minh không khớp với số đăng ký của tài khoản.',
      });
    }

    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Mật khẩu mới phải có ít nhất 6 ký tự.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(String(newPassword).trim(), salt);
    await dbService.updateUser(user.id, { passwordHash });

    return res.json({
      success: true,
      message: `Đã đặt lại mật khẩu thành công cho tài khoản ${user.name}! Bạn có thể đăng nhập ngay với mật khẩu mới.`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi xử lý yêu cầu quên mật khẩu.',
    });
  }
});

// POST /api/auth/logout
router.post('/logout', (_req: AuthenticatedRequest, res: Response): any => {
  res.clearCookie('token');
  return res.json({
    success: true,
    message: 'Đăng xuất thành công',
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const user = await dbService.findUserById(req.user!.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thông tin tài khoản',
      });
    }

    return res.json({
      success: true,
      data: formatSafeUser(user),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi tải thông tin tài khoản',
    });
  }
});

// PATCH /api/auth/me
router.patch('/me', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { name, schoolName, className, studentName, phone, currentPassword, newPassword } = req.body;
    const user = await dbService.findUserById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Tài khoản không tồn tại' });
    }

    const updates: Partial<UserRecord> = {};

    if (name && typeof name === 'string' && name.trim().length > 0) {
      updates.name = name.trim();
    }
    if (schoolName !== undefined && typeof schoolName === 'string') {
      updates.schoolName = schoolName.trim();
    }
    if (className !== undefined && typeof className === 'string') {
      updates.className = className.trim();
    }
    if (studentName !== undefined && typeof studentName === 'string') {
      updates.studentName = studentName.trim();
    }
    if (phone !== undefined && typeof phone === 'string') {
      updates.phone = phone.trim();
    }

    if (newPassword) {
      if (user.role !== 'ADMIN' && !currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu',
        });
      }
      if (currentPassword) {
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
          return res.status(400).json({
            success: false,
            message: 'Mật khẩu hiện tại không chính xác',
          });
        }
      }
      if (String(newPassword).length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu mới phải có ít nhất 6 ký tự',
        });
      }
      const salt = await bcrypt.genSalt(10);
      updates.passwordHash = await bcrypt.hash(newPassword, salt);
    }

    const updated = await dbService.updateUser(user.id, updates);

    return res.json({
      success: true,
      message: 'Cập nhật tài khoản thành công',
      data: formatSafeUser(updated!),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật tài khoản' });
  }
});

export default router;
