import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';
import { verifyToken } from '@/lib/auth';
import { AuthenticationError, AuthorizationError, createErrorResponse } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || request.cookies.get('token')?.value;
    
    if (!token) {
      throw new AuthenticationError('No authentication token provided');
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      throw new AuthenticationError('Invalid or expired token');
    }

    // Only principals can view all users
    if (decoded.role !== 'principal') {
      throw new AuthorizationError('Only principals can access user management');
    }

    const db = getDatabase();
    
    const users = db.prepare(`
      SELECT 
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.email,
        u.role,
        u.created_at
      FROM users u
      ORDER BY u.role, u.last_name, u.first_name
    `).all();

    return NextResponse.json({ 
      success: true,
      users,
      message: 'Users retrieved successfully'
    });

  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || request.cookies.get('token')?.value;
    
    if (!token) {
      throw new AuthenticationError('No authentication token provided');
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      throw new AuthenticationError('Invalid or expired token');
    }    // Only principals can create users
    if (decoded.role !== 'principal') {
      throw new AuthorizationError('Only principals can create users');
    }

    const body = await request.json();
    const { username, first_name, last_name, email, role, password } = body;

    // Validate required fields
    if (!username || !first_name || !last_name || !email || !role || !password) {
      return NextResponse.json({ 
        success: false,
        message: 'All fields are required'
      }, { status: 400 });
    }

    // Validate role
    if (!['student', 'teacher', 'principal'].includes(role)) {
      return NextResponse.json({ 
        success: false,
        message: 'Invalid role'
      }, { status: 400 });
    }

    const db = getDatabase();

    // Check if username or email already exists
    const existingUser = db.prepare(`
      SELECT id FROM users WHERE username = ? OR email = ?
    `).get(username, email);

    if (existingUser) {
      return NextResponse.json({ 
        success: false,
        message: 'Username or email already exists'
      }, { status: 409 });
    }

    // Insert new user
    const result = db.prepare(`
      INSERT INTO users (username, first_name, last_name, email, role, password_hash)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(username, first_name, last_name, email, role, password); // In production, hash the password

    return NextResponse.json({ 
      success: true,
      message: 'User created successfully',
      userId: result.lastInsertRowid
    });

  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || request.cookies.get('token')?.value;
    
    if (!token) {
      throw new AuthenticationError('No authentication token provided');
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      throw new AuthenticationError('Invalid or expired token');
    }    // Only principals can update users
    if (decoded.role !== 'principal') {
      throw new AuthorizationError('Only principals can update users');
    }

    const body = await request.json();
    const { id, username, first_name, last_name, email, role } = body;

    // Validate required fields
    if (!id || !username || !first_name || !last_name || !email || !role) {
      return NextResponse.json({ 
        success: false,
        message: 'All fields are required'
      }, { status: 400 });
    }

    // Validate role
    if (!['student', 'teacher', 'principal'].includes(role)) {
      return NextResponse.json({ 
        success: false,
        message: 'Invalid role'
      }, { status: 400 });
    }

    const db = getDatabase();

    // Check if user exists
    const existingUser = db.prepare(`
      SELECT id FROM users WHERE id = ?
    `).get(id);

    if (!existingUser) {
      return NextResponse.json({ 
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Check if username or email is taken by another user
    const duplicateUser = db.prepare(`
      SELECT id FROM users WHERE (username = ? OR email = ?) AND id != ?
    `).get(username, email, id);

    if (duplicateUser) {
      return NextResponse.json({ 
        success: false,
        message: 'Username or email already exists'
      }, { status: 409 });
    }

    // Update user
    db.prepare(`
      UPDATE users 
      SET username = ?, first_name = ?, last_name = ?, email = ?, role = ?
      WHERE id = ?
    `).run(username, first_name, last_name, email, role, id);

    return NextResponse.json({ 
      success: true,
      message: 'User updated successfully'
    });

  } catch (error) {
    return createErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || request.cookies.get('token')?.value;
    
    if (!token) {
      throw new AuthenticationError('No authentication token provided');
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      throw new AuthenticationError('Invalid or expired token');
    }    // Only principals can delete users
    if (decoded.role !== 'principal') {
      throw new AuthorizationError('Only principals can delete users');
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ 
        success: false,
        message: 'User ID is required'
      }, { status: 400 });
    }

    const db = getDatabase();

    // Check if user exists
    const existingUser = db.prepare(`
      SELECT id FROM users WHERE id = ?
    `).get(userId);

    if (!existingUser) {
      return NextResponse.json({ 
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }    // Prevent deleting the current user (self-deletion)
    if (parseInt(userId) === decoded.id) {
      return NextResponse.json({ 
        success: false,
        message: 'Cannot delete your own account'
      }, { status: 400 });
    }

    // Delete user
    db.prepare(`DELETE FROM users WHERE id = ?`).run(userId);

    return NextResponse.json({ 
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    return createErrorResponse(error);
  }
}
