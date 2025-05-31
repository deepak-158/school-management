import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './database';
import { User, AuthUser, LoginForm, UserRole } from './types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(user: User): string {
  const payload = {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Get user by username
export function getUserByUsername(username: string): User | null {
  const stmt = db.prepare(`
    SELECT id, username, email, password_hash, role, first_name, last_name, 
           phone, address, date_of_birth, created_at, updated_at
    FROM users 
    WHERE username = ?
  `);
  
  const user = stmt.get(username) as any;
  if (!user) return null;
  
  // Remove password_hash from the returned user object
  const { password_hash, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

// Get user by ID
export function getUserById(id: number): User | null {
  const stmt = db.prepare(`
    SELECT id, username, email, role, first_name, last_name, 
           phone, address, date_of_birth, created_at, updated_at
    FROM users 
    WHERE id = ?
  `);
  
  return stmt.get(id) as User | null;
}

// Authenticate user
export async function authenticateUser(credentials: LoginForm): Promise<AuthUser | null> {
  const stmt = db.prepare(`
    SELECT id, username, email, password_hash, role, first_name, last_name, 
           phone, address, date_of_birth, created_at, updated_at
    FROM users 
    WHERE username = ?
  `);
  
  const user = stmt.get(credentials.username) as any;
  if (!user) return null;
  
  const isValidPassword = await verifyPassword(credentials.password, user.password_hash);
  if (!isValidPassword) return null;
  
  // Remove password_hash from the user object
  const { password_hash, ...userWithoutPassword } = user;
  
  // Generate token
  const token = generateToken(userWithoutPassword);
  
  return {
    ...userWithoutPassword,
    token,
  };
}

// Create new user
export async function createUser(userData: {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
}): Promise<User> {
  const hashedPassword = await hashPassword(userData.password);
  
  const stmt = db.prepare(`
    INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone, address, date_of_birth)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    userData.username,
    userData.email,
    hashedPassword,
    userData.role,
    userData.first_name,
    userData.last_name,
    userData.phone || null,
    userData.address || null,
    userData.date_of_birth || null
  );
  
  const newUser = getUserById(result.lastInsertRowid as number);
  if (!newUser) throw new Error('Failed to create user');
  
  return newUser;
}

// Check if user has permission for a specific role
export function hasPermission(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

// Check if user can access a specific resource
export function canAccessResource(user: AuthUser, resourceUserId: number): boolean {
  // Principals can access all resources
  if (user.role === 'principal') return true;
  
  // Users can access their own resources
  if (user.id === resourceUserId) return true;
  
  return false;
}

// Middleware function to extract user from token
export function getUserFromToken(token: string): User | null {
  const decoded = verifyToken(token);
  if (!decoded) return null;
  
  return getUserById(decoded.id);
}
