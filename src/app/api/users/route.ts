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
    }

    // Only principals can create users
    if (decoded.role !== 'principal') {
      throw new AuthorizationError('Only principals can create users');
    }

    // TODO: Implement user creation logic
    return NextResponse.json({ 
      success: false,
      message: 'User creation not yet implemented'
    }, { status: 501 });

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
    }

    // Only principals can update users
    if (decoded.role !== 'principal') {
      throw new AuthorizationError('Only principals can update users');
    }

    // TODO: Implement user update logic
    return NextResponse.json({ 
      success: false,
      message: 'User update not yet implemented'
    }, { status: 501 });

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
    }

    // Only principals can delete users
    if (decoded.role !== 'principal') {
      throw new AuthorizationError('Only principals can delete users');
    }

    // TODO: Implement user deletion logic
    return NextResponse.json({ 
      success: false,
      message: 'User deletion not yet implemented'
    }, { status: 501 });

  } catch (error) {
    return createErrorResponse(error);
  }
}
