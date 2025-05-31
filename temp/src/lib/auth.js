"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.getUserByUsername = getUserByUsername;
exports.getUserById = getUserById;
exports.authenticateUser = authenticateUser;
exports.createUser = createUser;
exports.hasPermission = hasPermission;
exports.canAccessResource = canAccessResource;
exports.getUserFromToken = getUserFromToken;
const bcryptjs_1 = require("bcryptjs");
const jsonwebtoken_1 = require("jsonwebtoken");
const database_1 = require("./database");
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
// Hash password
async function hashPassword(password) {
    const saltRounds = 12;
    return bcryptjs_1.default.hash(password, saltRounds);
}
// Verify password
async function verifyPassword(password, hashedPassword) {
    return bcryptjs_1.default.compare(password, hashedPassword);
}
// Generate JWT token
function generateToken(user) {
    const payload = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}
// Verify JWT token
function verifyToken(token) {
    try {
        return jsonwebtoken_1.default.verify(token, JWT_SECRET);
    }
    catch (error) {
        return null;
    }
}
// Get user by username
function getUserByUsername(username) {
    const stmt = database_1.db.prepare(`
    SELECT id, username, email, password_hash, role, first_name, last_name, 
           phone, address, date_of_birth, created_at, updated_at
    FROM users 
    WHERE username = ?
  `);
    const user = stmt.get(username);
    if (!user)
        return null;
    // Remove password_hash from the returned user object
    const { password_hash } = user, userWithoutPassword = __rest(user, ["password_hash"]);
    return userWithoutPassword;
}
// Get user by ID
function getUserById(id) {
    const stmt = database_1.db.prepare(`
    SELECT id, username, email, role, first_name, last_name, 
           phone, address, date_of_birth, created_at, updated_at
    FROM users 
    WHERE id = ?
  `);
    return stmt.get(id);
}
// Authenticate user
async function authenticateUser(credentials) {
    const stmt = database_1.db.prepare(`
    SELECT id, username, email, password_hash, role, first_name, last_name, 
           phone, address, date_of_birth, created_at, updated_at
    FROM users 
    WHERE username = ?
  `);
    const user = stmt.get(credentials.username);
    if (!user)
        return null;
    const isValidPassword = await verifyPassword(credentials.password, user.password_hash);
    if (!isValidPassword)
        return null;
    // Remove password_hash from the user object
    const { password_hash } = user, userWithoutPassword = __rest(user, ["password_hash"]);
    // Generate token
    const token = generateToken(userWithoutPassword);
    return Object.assign(Object.assign({}, userWithoutPassword), { token });
}
// Create new user
async function createUser(userData) {
    const hashedPassword = await hashPassword(userData.password);
    const stmt = database_1.db.prepare(`
    INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone, address, date_of_birth)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
    const result = stmt.run(userData.username, userData.email, hashedPassword, userData.role, userData.first_name, userData.last_name, userData.phone || null, userData.address || null, userData.date_of_birth || null);
    const newUser = getUserById(result.lastInsertRowid);
    if (!newUser)
        throw new Error('Failed to create user');
    return newUser;
}
// Check if user has permission for a specific role
function hasPermission(userRole, allowedRoles) {
    return allowedRoles.includes(userRole);
}
// Check if user can access a specific resource
function canAccessResource(user, resourceUserId) {
    // Principals can access all resources
    if (user.role === 'principal')
        return true;
    // Users can access their own resources
    if (user.id === resourceUserId)
        return true;
    return false;
}
// Middleware function to extract user from token
function getUserFromToken(token) {
    const decoded = verifyToken(token);
    if (!decoded)
        return null;
    return getUserById(decoded.id);
}
