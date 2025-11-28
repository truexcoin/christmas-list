import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'default-secret-change-in-production'
);

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'christmas2024';

// Verify admin password
export function verifyPassword(password) {
  return password === ADMIN_PASSWORD;
}

// Create JWT token
export async function createToken() {
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
  
  return token;
}

// Verify JWT token
export async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload;
  } catch (err) {
    return null;
  }
}

// Check if request is authenticated
export async function isAuthenticated() {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;
  
  if (!token) return false;
  
  const payload = await verifyToken(token);
  return !!payload;
}

// Get token from request headers
export function getTokenFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Also check cookies
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split('; ').map((c) => c.split('='))
    );
    return cookies['auth-token'];
  }
  
  return null;
}

// Middleware to check auth
export async function requireAuth(request) {
  const token = getTokenFromRequest(request);
  
  if (!token) {
    return { error: 'No token provided', status: 401 };
  }
  
  const payload = await verifyToken(token);
  
  if (!payload) {
    return { error: 'Invalid token', status: 401 };
  }
  
  return { authenticated: true, payload };
}

