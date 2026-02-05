import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/database/connection';
import { hashPassword } from '@/lib/auth';
import { getCurrentUser } from '@/lib/auth';

type DbUser = {
  staff_id: number;
  username: string;
  email: string;
  staff_role: string;
  staff_status: string;
  created_date: string;
  last_login: string | null;
};

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Block staff from accessing user data
    if (currentUser.StaffRole === 'staff') {
      return NextResponse.json(
        { ok: false, error: 'Forbidden: Staff cannot access this page' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const searchTerm = searchParams.get('search') || '';
    const roleFilter = searchParams.get('role') || 'all';

    let sql = `
      SELECT 
        staffid as staff_id,
        username,
        email,
        staffrole as staff_role,
        staffstatus as staff_status,
        createddate as created_date,
        lastlogin as last_login
      FROM staffusers
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    // Search filter
    if (searchTerm) {
      sql += ` AND (username ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
      params.push(`%${searchTerm}%`);
      paramIndex++;
    }

    // Role filter
    if (roleFilter !== 'all') {
      sql += ` AND staffrole = $${paramIndex}`;
      params.push(roleFilter);
      paramIndex++;
    }

    sql += ` ORDER BY createddate DESC`;

    const result = await query(sql, params);
    const users = result.rows as unknown as DbUser[];

    // Format date for display
    const formatDate = (dateString: string | null) => {
      if (!dateString) return 'ยังไม่เคยเข้าใช้งาน';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('th-TH', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
      } catch {
        return 'ยังไม่เคยเข้าใช้งาน';
      }
    };

    // Count users by role
    const roleCounts = await query(`
      SELECT 
        staffrole,
        COUNT(*) as count
      FROM staffusers
      GROUP BY staffrole
    `);

    const roleStats: Record<string, number> = {
      admin: 0,
      manager: 0,
      staff: 0,
    };

    roleCounts.rows.forEach((row: any) => {
      const role = row.staffrole.toLowerCase();
      if (role === 'admin' || role === 'manager' || role === 'staff') {
        roleStats[role] = Number(row.count);
      }
    });

    return NextResponse.json({
      ok: true,
      items: users.map((u) => ({
        id: u.staff_id,
        name: u.username,
        email: u.email,
        role: u.staff_role.toUpperCase(),
        status: u.staff_status === 'active' ? 'active' : 'inactive',
        lastAccess: formatDate(u.last_login),
      })),
      roleStats,
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    const message = error?.message || 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admin can create users
    if (currentUser.StaffRole !== 'admin') {
      return NextResponse.json(
        { ok: false, error: 'Forbidden: Only admin can create users' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, role, password } = body;

    if (!name || !email || !role || !password) {
      return NextResponse.json(
        { ok: false, error: 'ชื่อ-นามสกุล, อีเมล, บทบาท และรหัสผ่านจำเป็นต้องกรอก' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['admin', 'manager', 'staff'].includes(role.toLowerCase())) {
      return NextResponse.json(
        { ok: false, error: 'บทบาทไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await query(
      'SELECT staffid FROM staffusers WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { ok: false, error: 'อีเมลนี้ถูกใช้งานแล้ว' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert user
    const insertRes = await query(
      `INSERT INTO staffusers (username, email, passwordhash, staffrole, staffstatus)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING staffid as staff_id`,
      [name, email, passwordHash, role.toLowerCase(), 'active']
    );

    const newId = insertRes.rows[0]?.staff_id;
    return NextResponse.json({ ok: true, id: newId });
  } catch (error: any) {
    console.error('Error creating user:', error);
    const message = error?.message || 'Unknown error';
    return NextResponse.json(
      { ok: false, error: message || 'เกิดข้อผิดพลาดในการสร้างผู้ใช้งาน' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, name, email, role, status, password } = body;

    if (!id) {
      return NextResponse.json(
        { ok: false, error: 'ID ผู้ใช้งานจำเป็นต้องกรอก' },
        { status: 400 }
      );
    }

    // Only admin can edit users
    if (currentUser.StaffRole !== 'admin') {
      return NextResponse.json(
        { ok: false, error: 'Forbidden: Only admin can edit users' },
        { status: 403 }
      );
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (name !== undefined) {
      fields.push(`username = $${idx++}`);
      values.push(name);
    }

    if (email !== undefined) {
      // Check if email already exists (excluding current user)
      const existingUser = await query(
        'SELECT staffid FROM staffusers WHERE email = $1 AND staffid != $2',
        [email, id]
      );

      if (existingUser.rows.length > 0) {
        return NextResponse.json(
          { ok: false, error: 'อีเมลนี้ถูกใช้งานแล้ว' },
          { status: 409 }
        );
      }

      fields.push(`email = $${idx++}`);
      values.push(email);
    }

    if (role !== undefined) {
      // Only admin can change roles
      if (currentUser.StaffRole !== 'admin') {
        return NextResponse.json(
          { ok: false, error: 'Forbidden: Only admin can change roles' },
          { status: 403 }
        );
      }

      // Prevent admin from changing their own role
      if (currentUser.StaffID === id) {
        return NextResponse.json(
          { ok: false, error: 'ไม่สามารถแก้ไขบทบาทของตัวเองได้' },
          { status: 400 }
        );
      }

      if (!['admin', 'manager', 'staff'].includes(role.toLowerCase())) {
        return NextResponse.json(
          { ok: false, error: 'บทบาทไม่ถูกต้อง' },
          { status: 400 }
        );
      }

      fields.push(`staffrole = $${idx++}`);
      values.push(role.toLowerCase());
    }

    if (status !== undefined) {
      // Only admin can change status
      if (currentUser.StaffRole !== 'admin') {
        return NextResponse.json(
          { ok: false, error: 'Forbidden: Only admin can change status' },
          { status: 403 }
        );
      }

      if (!['active', 'inactive'].includes(status)) {
        return NextResponse.json(
          { ok: false, error: 'สถานะไม่ถูกต้อง' },
          { status: 400 }
        );
      }

      fields.push(`staffstatus = $${idx++}`);
      values.push(status);
    }

    if (password !== undefined && password !== '') {
      // Only admin can change passwords
      if (currentUser.StaffRole !== 'admin') {
        return NextResponse.json(
          { ok: false, error: 'Forbidden: Only admin can change passwords' },
          { status: 403 }
        );
      }

      const passwordHash = await hashPassword(password);
      fields.push(`passwordhash = $${idx++}`);
      values.push(passwordHash);
    }

    if (fields.length === 0) {
      return NextResponse.json(
        { ok: false, error: 'ไม่มีข้อมูลที่จะอัปเดต' },
        { status: 400 }
      );
    }

    values.push(id);
    const sql = `UPDATE staffusers SET ${fields.join(', ')} WHERE staffid = $${idx}`;
    await query(sql, values);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Error updating user:', error);
    const message = error?.message || 'Unknown error';
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    // Check authentication
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return NextResponse.json(
        { ok: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only admin can delete users
    if (currentUser.StaffRole !== 'admin') {
      return NextResponse.json(
        { ok: false, error: 'Forbidden: Only admin can delete users' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const idParam = searchParams.get('id');
    let userId: number | null = idParam ? Number(idParam) : null;

    if (!userId || Number.isNaN(userId)) {
      try {
        const body = await req.json();
        userId = Number(body?.id);
      } catch {}
    }

    if (!userId || Number.isNaN(userId)) {
      return NextResponse.json(
        { ok: false, error: 'ID ผู้ใช้งานจำเป็นต้องกรอก' },
        { status: 400 }
      );
    }

    // Prevent deleting yourself
    if (currentUser.StaffID === userId) {
      return NextResponse.json(
        { ok: false, error: 'ไม่สามารถลบบัญชีของตัวเองได้' },
        { status: 400 }
      );
    }

    await query(`DELETE FROM staffusers WHERE staffid = $1`, [userId]);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Error deleting user:', error);
    const message = error?.message || 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

