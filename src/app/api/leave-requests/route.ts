import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import { createErrorResponse, AppError, AuthenticationError, AuthorizationError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError('Authorization token required');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    
    if (!payload) {
      throw new AuthenticationError('Invalid or expired token');
    }    const db = getDatabase();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');    const userRole = payload.role;
    const userId = payload.id; // Fixed: use 'id' instead of 'userId'
    
    let query = `
      SELECT 
        lr.*,
        (u.first_name || ' ' || u.last_name) as user_name,
        u.role as user_role,
        s.class_id
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      LEFT JOIN students s ON lr.user_id = s.user_id
      WHERE 1=1
    `;
    
    const params: any[] = [];

    // Role-based filtering
    if (userRole === 'teacher') {
      // Teachers can only see leave requests from students in their classes
      query += ` AND u.role = 'student' AND s.class_id IN (
        SELECT DISTINCT class_id FROM teacher_subjects WHERE teacher_id = ?
      )`;
      params.push(userId);
    } else if (userRole === 'principal') {
      // Principals can see all leave requests
    } else {
      // Students can only see their own requests
      query += ` AND lr.user_id = ?`;
      params.push(userId);
    }

    // Status filtering
    if (status && status !== 'all') {
      query += ` AND lr.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY lr.created_at DESC`;

    const stmt = db.prepare(query);
    const leaveRequests = stmt.all(...params);

    return NextResponse.json({ leaveRequests });
  } catch (error) {
    console.error('Leave requests fetch error:', error);
    return createErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError('Authorization token required');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    
    if (!payload) {
      throw new AuthenticationError('Invalid or expired token');
    }

    const body = await request.json();
    const { reason, start_date, end_date } = body;

    if (!reason || !start_date || !end_date) {
      throw new AppError('Reason, start date, and end date are required', 400);
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      throw new AppError('Start date cannot be in the past', 400);
    }

    if (endDate < startDate) {
      throw new AppError('End date cannot be before start date', 400);
    }

    const db = getDatabase();
    
    const stmt = db.prepare(`
      INSERT INTO leave_requests (user_id, reason, start_date, end_date, status, created_at)
      VALUES (?, ?, ?, ?, 'pending', datetime('now'))
    `);

    const result = stmt.run(payload.id, reason, start_date, end_date);

    return NextResponse.json({ 
      message: 'Leave request submitted successfully',
      id: result.lastInsertRowid 
    }, { status: 201 });
  } catch (error) {
    console.error('Leave request creation error:', error);
    return createErrorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError('Authorization token required');
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    
    if (!payload) {
      throw new AuthenticationError('Invalid or expired token');
    }

    const body = await request.json();
    const { id, status, approver_notes } = body;

    if (!id || !status) {
      throw new AppError('Leave request ID and status are required', 400);
    }

    if (!['approved', 'rejected'].includes(status)) {
      throw new AppError('Status must be either approved or rejected', 400);
    }

    const db = getDatabase();
      // Get the leave request details
    const leaveRequest = db.prepare(`
      SELECT 
        lr.*,
        u.role as user_role,
        s.class_id
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      LEFT JOIN students s ON lr.user_id = s.user_id
      WHERE lr.id = ?
    `).get(id) as any;

    if (!leaveRequest) {
      throw new AppError('Leave request not found', 404);
    }

    if (leaveRequest.status !== 'pending') {
      throw new AppError('Leave request has already been processed', 400);
    }    // Authorization check
    const userRole = payload.role;
    const userId = payload.id;

    if (userRole === 'principal') {
      // Principals can approve any leave request
    } else if (userRole === 'teacher') {
      // Teachers can only approve student requests from their classes
      if (leaveRequest.user_role !== 'student') {
        throw new AuthorizationError('Teachers cannot approve other teachers\' leave requests');
      }

      // Check if teacher teaches this student's class
      const teacherClass = db.prepare(`
        SELECT 1 FROM teacher_subjects 
        WHERE teacher_id = ? AND class_id = ?
        LIMIT 1
      `).get(userId, leaveRequest.class_id);

      if (!teacherClass) {
        throw new AuthorizationError('You can only approve leave requests from students in your classes');
      }
    } else {
      throw new AuthorizationError('Only teachers and principals can approve leave requests');
    }

    // Update the leave request
    const updateStmt = db.prepare(`
      UPDATE leave_requests 
      SET status = ?, approved_by = ?, approver_notes = ?, approved_at = datetime('now')
      WHERE id = ?
    `);

    updateStmt.run(status, userId, approver_notes || null, id);

    return NextResponse.json({ 
      message: `Leave request ${status} successfully` 
    });
  } catch (error) {
    console.error('Leave request approval error:', error);
    return createErrorResponse(error);
  }
}
