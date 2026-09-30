import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { dbService } from '../db/db.ts';
import { generateToken, requireAuth, AuthenticatedRequest } from '../middleware/auth.ts';
import { UserRecord } from '../types/index.ts';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req, res): Promise<any> => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    const errors: Record<string, string> = {};

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.name = 'Họ và tên không được để trống';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
      errors.email = 'Email không hợp lệ';
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      errors.password = 'Mật khẩu phải chứa ít nhất 6 ký tự';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu đăng ký không hợp lệ',
        errors,
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await dbService.findUserByEmail(normalizedEmail);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email này đã được sử dụng bởi một tài khoản khác',
        errors: { email: 'Email đã tồn tại' },
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userId = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

    const newUser: UserRecord = {
      id: userId,
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await dbService.createUser(newUser);

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công! Vui lòng đăng nhập.',
      data: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra trong quá trình đăng ký. Vui lòng thử lại sau.',
    });
  }
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
    const user = await dbService.findUserByEmail(normalizedEmail);

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

    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Create session record
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
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
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

// POST /api/auth/logout
router.post('/logout', (req: AuthenticatedRequest, res: Response): any => {
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
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
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
    const { name, currentPassword, newPassword } = req.body;
    const user = await dbService.findUserById(req.user!.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Tài khoản không tồn tại' });
    }

    const updates: Partial<UserRecord> = {};

    if (name && typeof name === 'string' && name.trim().length > 0) {
      updates.name = name.trim();
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập mật khẩu hiện tại để đổi mật khẩu',
        });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu hiện tại không chính xác',
        });
      }
      if (newPassword.length < 6) {
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
      data: {
        id: updated!.id,
        name: updated!.name,
        email: updated!.email,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật tài khoản' });
  }
});

export default router;
