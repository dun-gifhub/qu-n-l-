import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthUserPayload } from '../types/index.ts';
import { dbService } from '../db/db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_change_me_in_production_super_safe_and_long_jwt';

export interface AuthenticatedRequest extends Request {
  user?: AuthUserPayload;
}

export function generateToken(payload: AuthUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Bạn cần đăng nhập để thực hiện thao tác này.',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUserPayload;
    const freshUser = await dbService.findUserById(decoded.userId);
    if (!freshUser) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản không còn tồn tại trong hệ thống.',
      });
    }

    req.user = {
      userId: freshUser.id,
      email: freshUser.email,
      name: freshUser.name,
      role: freshUser.role || 'PARENT',
      schoolName: freshUser.schoolName,
      className: freshUser.className,
      approvalStatus: freshUser.approvalStatus || 'APPROVED',
    };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.',
    });
  }
}

export function requireApproved(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Bạn cần đăng nhập để tiếp tục.',
    });
  }

  if (req.user.role !== 'ADMIN' && req.user.approvalStatus !== 'APPROVED') {
    return res.status(403).json({
      success: false,
      message:
        req.user.approvalStatus === 'REJECTED'
          ? 'Tài khoản của bạn đã bị Quản trị viên (Admin) từ chối phê duyệt.'
          : 'Tài khoản Giáo viên / Phụ huynh của bạn đang chờ Admin phê duyệt.',
    });
  }

  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Từ chối truy cập: Chỉ tài khoản Admin tối thượng mới có quyền thực hiện thao tác này.',
    });
  }
  next();
}
