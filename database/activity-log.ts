import { query } from './connection';
import { StaffUser } from '@/lib/auth';

export type StaffActivityLogParams = {
  user: StaffUser | null;
  actionType: string;
  resourceType: string;
  resourceId?: string | number | null;
  details?: unknown;
  ipAddress?: string | null;
};

export async function logStaffActivity(params: StaffActivityLogParams): Promise<void> {
  const { user, actionType, resourceType, resourceId, details, ipAddress } = params;

  try {
    await query(
      `INSERT INTO staff_activity_logs (
        staff_id,
        username,
        action_type,
        resource_type,
        resource_id,
        details,
        ip_address
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        user?.StaffID ?? null,
        user?.Username ?? null,
        actionType,
        resourceType,
        resourceId != null ? String(resourceId) : null,
        details != null ? JSON.stringify(details) : null,
        ipAddress ?? null,
      ]
    );
  } catch (error) {
    // ไม่ควรให้การบันทึก log ทำให้ main flow ล้มเหลว
    console.error('Error logging staff activity:', error);
  }
}

