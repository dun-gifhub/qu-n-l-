import { Router, Response } from 'express';
import { dbService } from '../db/db.ts';
import { requireAuth, requireApproved, AuthenticatedRequest } from '../middleware/auth.ts';
import { GradeScheduleShift } from '../types/index.ts';

const router = Router();

router.use(requireAuth);
router.use(requireApproved);

function isValidHHMM(val: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test((val || '').trim());
}

function validateShifts(shifts: GradeScheduleShift[]): string | null {
  if (!Array.isArray(shifts) || shifts.length === 0) {
    return 'Cần có ít nhất 1 ca học trong cấu hình';
  }
  for (const s of shifts) {
    if (!isValidHHMM(s.start) || !isValidHHMM(s.end)) {
      return `Định dạng giờ không hợp lệ (${s.start} - ${s.end}). Vui lòng dùng HH:mm`;
    }
    if (s.enabled && s.start >= s.end) {
      return `Giờ bắt đầu (${s.start}) phải sớm hơn giờ kết thúc (${s.end})`;
    }
  }
  return null;
}

// GET /api/schedules - Lấy danh sách lịch học theo khối
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const data = await dbService.getGradeSchedules(req.user!.userId);
    return res.json({
      success: true,
      data,
    });
  } catch (err: any) {
    console.error('Get grade schedules error:', err);
    return res.status(500).json({
      success: false,
      message: 'Không thể tải cấu hình giờ học theo khối',
    });
  }
});

// PUT /api/schedules/:grade - Cập nhật giờ học & trạng thái nghỉ của một khối
router.put('/:grade', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    if (req.user!.role !== 'ADMIN' && req.user!.role !== 'TEACHER') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ Quản trị viên hoặc Giáo viên mới có quyền thay đổi giờ học theo khối',
      });
    }

    const gradeParam = decodeURIComponent(req.params.grade);
    const { isDayOff, dayOffReason, activeDays, shifts } = req.body || {};

    if (shifts !== undefined) {
      const errMsg = validateShifts(shifts);
      if (errMsg) {
        return res.status(400).json({ success: false, message: errMsg });
      }
    }

    if (activeDays !== undefined && !Array.isArray(activeDays)) {
      return res.status(400).json({
        success: false,
        message: 'Danh sách ngày học trong tuần không hợp lệ',
      });
    }

    const updated = await dbService.updateGradeSchedule(
      gradeParam,
      { isDayOff, dayOffReason, activeDays, shifts },
      req.user!.name
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy cấu hình của khối này',
      });
    }

    const full = await dbService.getGradeSchedules(req.user!.userId);
    return res.json({
      success: true,
      message: `Đã cập nhật lịch học cho ${updated.grade}`,
      data: {
        updated,
        ...full,
      },
    });
  } catch (err: any) {
    console.error('Update grade schedule error:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật giờ học theo khối',
    });
  }
});

// POST /api/schedules/toggle-day-off - Bật/tắt nghỉ học nhanh cho 1 hoặc tất cả khối
router.post('/toggle-day-off', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    if (req.user!.role !== 'ADMIN' && req.user!.role !== 'TEACHER') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ Quản trị viên hoặc Giáo viên mới có quyền bật/tắt lịch nghỉ',
      });
    }

    const { grades, isDayOff, dayOffReason } = req.body || {};
    const target: string[] | 'ALL' =
      grades === 'ALL' ? 'ALL' : Array.isArray(grades) ? grades : [];

    if (target !== 'ALL' && target.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ít nhất một khối để cập nhật',
      });
    }

    await dbService.toggleGradesDayOff(target, Boolean(isDayOff), dayOffReason, req.user!.name);
    const full = await dbService.getGradeSchedules(req.user!.userId);

    return res.json({
      success: true,
      message: Boolean(isDayOff)
        ? 'Đã bật chế độ nghỉ học và tắt cảnh báo giờ học cho khối đã chọn'
        : 'Đã mở lại giám sát giờ học cho khối đã chọn',
      data: full,
    });
  } catch (err: any) {
    console.error('Toggle grade day-off error:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật trạng thái nghỉ học',
    });
  }
});

// POST /api/schedules/apply-all - Áp dụng cùng khung giờ học cho tất cả các khối
router.post('/apply-all', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    if (req.user!.role !== 'ADMIN' && req.user!.role !== 'TEACHER') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ Quản trị viên hoặc Giáo viên mới có quyền áp dụng khung giờ chung',
      });
    }

    const { activeDays, shifts, isDayOff, dayOffReason } = req.body || {};
    const errMsg = validateShifts(shifts);
    if (errMsg) {
      return res.status(400).json({ success: false, message: errMsg });
    }

    await dbService.applyScheduleToAllGrades(
      {
        activeDays: Array.isArray(activeDays) ? activeDays : [1, 2, 3, 4, 5, 6],
        shifts,
        isDayOff,
        dayOffReason,
      },
      req.user!.name
    );

    const full = await dbService.getGradeSchedules(req.user!.userId);
    return res.json({
      success: true,
      message: 'Đã áp dụng khung giờ học chung cho tất cả các khối',
      data: full,
    });
  } catch (err: any) {
    console.error('Apply all grade schedules error:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi áp dụng khung giờ chung',
    });
  }
});

// POST /api/schedules/reset - Khôi phục khung giờ mặc định (07:00-11:30, 13:00-17:00)
router.post('/reset', async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    if (req.user!.role !== 'ADMIN' && req.user!.role !== 'TEACHER') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ Quản trị viên hoặc Giáo viên mới có quyền khôi phục lịch mặc định',
      });
    }

    await dbService.resetGradeSchedules(req.user!.name);
    const full = await dbService.getGradeSchedules(req.user!.userId);
    return res.json({
      success: true,
      message: 'Đã khôi phục khung giờ học mặc định cho tất cả các khối',
      data: full,
    });
  } catch (err: any) {
    console.error('Reset grade schedules error:', err);
    return res.status(500).json({
      success: false,
      message: 'Lỗi khôi phục lịch mặc định',
    });
  }
});

export default router;
