import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';
import { LoginForm } from '@/lib/types';
import { ValidationError, AuthenticationError, createErrorResponse, validateRequiredFields } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as LoginForm;
      // Validate input
    validateRequiredFields(body, ['username', 'password']);

    // Authenticate user
    const user = await authenticateUser(body);
      if (!user) {
      throw new AuthenticationError('Invalid credentials');
    }

    // Create response with cookie
    const response = NextResponse.json({
      success: true,
      data: user,
      message: 'Login successful'
    });

    // Set token as HTTP-only cookie
    response.cookies.set('token', user.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return response;

  } catch (error) {
    return createErrorResponse(error);
  }
}
