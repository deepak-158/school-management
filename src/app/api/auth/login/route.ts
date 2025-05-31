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

    return NextResponse.json({
      success: true,
      data: user,
      message: 'Login successful'
    });

  } catch (error) {
    return createErrorResponse(error);
  }
}
